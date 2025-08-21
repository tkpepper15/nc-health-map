"""
Enhanced Medicaid Data Parser for NC Healthcare Vulnerability Index.
Handles the specific June 2025 Medicaid enrollment CSV format.
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import re
from sqlalchemy.orm import Session
from sqlalchemy import text

# Import our models
import sys
sys.path.append('/Users/tejjaskaul/PycharmProjects/nc-health-map/backend')
from app.core.database import SessionLocal, Base, engine
from app.models.county import County
from app.models.healthcare import HealthcareMetrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EnhancedMedicaidParser:
    """
    Enhanced parser for NC Medicaid enrollment data with flexible data structure.
    """
    
    def __init__(self):
        self.nc_fips_mapping = self._create_nc_fips_mapping()
        self.medicaid_categories = {
            'traditional': [
                'AGED', 'BLIND', 'DISABLED', 'TANF (AFDC) UNDER 21', 
                'TANF (AFDC) 21 AND OVER', 'OTHER CHILD', 'PREGNANT WOMEN',
                'FAMILY PLANNING', 'INFANTS AND CHILDREN', 'MCHIP'
            ],
            'special_programs': [
                'MQBQ', 'MQBB', 'MQBE', 'BCC', 'REFUGEES', 
                'DOCUMENTED NON-CITIZENS', 'EMERGENCY SERVICES ONLY', 
                'COVID-19 MEDICAID'
            ],
            'expansion': ['MEDICAID EXPANSION']
        }
    
    def _create_nc_fips_mapping(self) -> Dict[str, str]:
        """Create mapping of NC county names to FIPS codes."""
        return {
            'ALAMANCE': '37001', 'ALEXANDER': '37003', 'ALLEGHANY': '37005',
            'ANSON': '37007', 'ASHE': '37009', 'AVERY': '37011',
            'BEAUFORT': '37013', 'BERTIE': '37015', 'BLADEN': '37017',
            'BRUNSWICK': '37019', 'BUNCOMBE': '37021', 'BURKE': '37023',
            'CABARRUS': '37025', 'CALDWELL': '37027', 'CAMDEN': '37029',
            'CARTERET': '37031', 'CASWELL': '37033', 'CATAWBA': '37035',
            'CHATHAM': '37037', 'CHEROKEE': '37039', 'CHOWAN': '37041',
            'CLAY': '37043', 'CLEVELAND': '37045', 'COLUMBUS': '37047',
            'CRAVEN': '37049', 'CUMBERLAND': '37051', 'CURRITUCK': '37053',
            'DARE': '37055', 'DAVIDSON': '37057', 'DAVIE': '37059',
            'DUPLIN': '37061', 'DURHAM': '37063', 'EDGECOMBE': '37065',
            'FORSYTH': '37067', 'FRANKLIN': '37069', 'GASTON': '37071',
            'GATES': '37073', 'GRAHAM': '37075', 'GRANVILLE': '37077',
            'GREENE': '37079', 'GUILFORD': '37081', 'HALIFAX': '37083',
            'HARNETT': '37085', 'HAYWOOD': '37087', 'HENDERSON': '37089',
            'HERTFORD': '37091', 'HOKE': '37093', 'HYDE': '37095',
            'IREDELL': '37097', 'JACKSON': '37099', 'JOHNSTON': '37101',
            'JONES': '37103', 'LEE': '37105', 'LENOIR': '37107',
            'LINCOLN': '37109', 'MCDOWELL': '37111', 'MACON': '37113',
            'MADISON': '37115', 'MARTIN': '37117', 'MECKLENBURG': '37119',
            'MITCHELL': '37121', 'MONTGOMERY': '37123', 'MOORE': '37125',
            'NASH': '37127', 'NEW HANOVER': '37129', 'NORTHAMPTON': '37131',
            'ONSLOW': '37133', 'ORANGE': '37135', 'PAMLICO': '37137',
            'PASQUOTANK': '37139', 'PENDER': '37141', 'PERQUIMANS': '37143',
            'PERSON': '37145', 'PITT': '37147', 'POLK': '37149',
            'RANDOLPH': '37151', 'RICHMOND': '37153', 'ROBESON': '37155',
            'ROCKINGHAM': '37157', 'ROWAN': '37159', 'RUTHERFORD': '37161',
            'SAMPSON': '37163', 'SCOTLAND': '37165', 'STANLY': '37167',
            'STOKES': '37169', 'SURRY': '37171', 'SWAIN': '37173',
            'TRANSYLVANIA': '37175', 'TYRRELL': '37177', 'UNION': '37179',
            'VANCE': '37181', 'WAKE': '37183', 'WARREN': '37185',
            'WASHINGTON': '37187', 'WATAUGA': '37189', 'WAYNE': '37191',
            'WILKES': '37193', 'WILSON': '37195', 'YADKIN': '37197',
            'YANCEY': '37199'
        }
    
    def clean_numeric_value(self, value: str) -> Optional[int]:
        """Clean and convert numeric values, handling '#' and commas."""
        if pd.isna(value) or value == '#' or value == '':
            return None
        
        # Remove commas and quotes, convert to string first
        cleaned = str(value).replace(',', '').replace('"', '').strip()
        
        try:
            return int(float(cleaned))
        except (ValueError, TypeError):
            return None
    
    def load_and_parse_medicaid_csv(self, file_path: str) -> pd.DataFrame:
        """Load and parse the Medicaid CSV file."""
        logger.info(f"Loading Medicaid data from: {file_path}")
        
        # Load the CSV
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} counties with {len(df.columns)} columns")
        
        # Clean up column names
        df.columns = df.columns.str.strip()
        
        # Process each row
        processed_data = []
        
        for _, row in df.iterrows():
            county_name = row['COUNTY NAME'].strip().upper()
            
            # Get FIPS code
            fips_code = self.nc_fips_mapping.get(county_name)
            if not fips_code:
                logger.warning(f"No FIPS code found for county: {county_name}")
                continue
            
            # Parse all numeric columns
            county_data = {
                'county_name': county_name.title(),
                'fips_code': fips_code,
                'county_total': self.clean_numeric_value(row['COUNTY TOTAL']),
                'medicaid_expansion': self.clean_numeric_value(row['MEDICAID EXPANSION'])
            }
            
            # Parse traditional Medicaid categories
            traditional_total = 0
            for category in self.medicaid_categories['traditional']:
                if category in row:
                    value = self.clean_numeric_value(row[category])
                    county_data[f'medicaid_{category.lower().replace(" ", "_").replace("(", "").replace(")", "")}'] = value
                    if value:
                        traditional_total += value
            
            county_data['medicaid_traditional_total'] = traditional_total
            
            # Parse special programs
            special_total = 0
            for category in self.medicaid_categories['special_programs']:
                if category in row:
                    value = self.clean_numeric_value(row[category])
                    county_data[f'medicaid_{category.lower().replace(" ", "_").replace("-", "_")}'] = value
                    if value:
                        special_total += value
            
            county_data['medicaid_special_programs_total'] = special_total
            
            # Calculate ratios and derived metrics
            total = county_data['county_total'] or 0
            expansion = county_data['medicaid_expansion'] or 0
            
            if total > 0:
                county_data['expansion_ratio'] = expansion / total
                county_data['traditional_ratio'] = traditional_total / total if traditional_total else 0
                county_data['special_programs_ratio'] = special_total / total if special_total else 0
            else:
                county_data['expansion_ratio'] = 0
                county_data['traditional_ratio'] = 0
                county_data['special_programs_ratio'] = 0
            
            processed_data.append(county_data)
        
        df_processed = pd.DataFrame(processed_data)
        logger.info(f"Successfully processed {len(df_processed)} counties")
        
        return df_processed
    
    def calculate_policy_risk_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate policy risk scores based on Medicaid dependency."""
        df_scored = df.copy()
        
        # We'll need population data to calculate true dependency ratios
        # For now, calculate relative risk scores based on enrollment levels and ratios
        
        # Normalize county total enrollments to 1-10 scale
        if 'county_total' in df_scored.columns:
            total_scores = df_scored['county_total'].rank(pct=True) * 9 + 1
            df_scored['enrollment_volume_score'] = total_scores.round(2)
        
        # Expansion dependency score (higher expansion ratio = higher risk)
        if 'expansion_ratio' in df_scored.columns:
            expansion_scores = df_scored['expansion_ratio'].rank(pct=True) * 9 + 1
            df_scored['expansion_dependency_score'] = expansion_scores.round(2)
        
        # Calculate composite policy risk score
        # Weight expansion dependency heavily as it's most vulnerable to policy changes
        if all(col in df_scored.columns for col in ['enrollment_volume_score', 'expansion_dependency_score']):
            df_scored['policy_risk_score'] = (
                df_scored['expansion_dependency_score'] * 0.7 +
                df_scored['enrollment_volume_score'] * 0.3
            ).round(2)
        else:
            df_scored['policy_risk_score'] = 5.0  # Default neutral score
        
        # Add risk categories
        def get_risk_category(score):
            if pd.isna(score):
                return "unknown"
            elif score >= 8.5:
                return "extreme"
            elif score >= 6.5:
                return "high"
            elif score >= 4.0:
                return "moderate"
            else:
                return "low"
        
        df_scored['policy_risk_category'] = df_scored['policy_risk_score'].apply(get_risk_category)
        
        return df_scored
    
    def save_to_database(self, df: pd.DataFrame, session: Session) -> None:
        """Save processed Medicaid data to database."""
        logger.info("Saving Medicaid data to database...")
        
        from datetime import date
        metric_date = date(2025, 6, 1)  # June 2025 data
        
        counties_created = 0
        metrics_created = 0
        counties_updated = 0
        
        for _, row in df.iterrows():
            try:
                # Get or create county
                county = session.query(County).filter_by(fips_code=row['fips_code']).first()
                
                if not county:
                    county = County(
                        fips_code=row['fips_code'],
                        county_name=row['county_name'],
                        state_code='NC'
                    )
                    session.add(county)
                    counties_created += 1
                else:
                    # Update county name if different
                    if county.county_name != row['county_name']:
                        county.county_name = row['county_name']
                        counties_updated += 1
                
                session.flush()  # Get the county ID
                
                # Check if healthcare metrics already exist for this date
                existing_metrics = session.query(HealthcareMetrics).filter_by(
                    county_id=county.id,
                    metric_date=metric_date
                ).first()
                
                if existing_metrics:
                    # Update existing metrics
                    healthcare_metrics = existing_metrics
                else:
                    # Create new metrics
                    healthcare_metrics = HealthcareMetrics(
                        county_id=county.id,
                        metric_date=metric_date,
                        data_source='NC_DHHS_Medicaid_Jun_2025',
                        data_version='2025.06'
                    )
                    session.add(healthcare_metrics)
                    metrics_created += 1
                
                # Update Medicaid-specific fields
                healthcare_metrics.medicaid_total_enrollment = row.get('county_total')
                healthcare_metrics.medicaid_expansion_enrollment = row.get('medicaid_expansion')
                healthcare_metrics.medicaid_traditional_enrollment = row.get('medicaid_traditional_total')
                healthcare_metrics.medicaid_expansion_ratio = row.get('expansion_ratio')
                healthcare_metrics.policy_risk_score = row.get('policy_risk_score')
                
                # Set data quality score based on completeness
                non_null_medicaid_fields = sum(1 for field in [
                    'county_total', 'medicaid_expansion', 'medicaid_traditional_total'
                ] if row.get(field) is not None)
                healthcare_metrics.data_completeness_score = non_null_medicaid_fields / 3.0
                
                healthcare_metrics.processed_by = 'enhanced_medicaid_parser'
                healthcare_metrics.notes = f"Processed from June 2025 Medicaid enrollment CSV. Categories included: {len([k for k, v in row.items() if k.startswith('medicaid_') and v is not None])} Medicaid subcategories"
                
            except Exception as e:
                logger.error(f"Error processing county {row.get('county_name', 'Unknown')}: {e}")
                continue
        
        try:
            session.commit()
            logger.info(f"Successfully saved: {counties_created} new counties, {counties_updated} updated counties, {metrics_created} new healthcare metrics")
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving to database: {e}")
            raise
    
    def get_summary_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate summary statistics for the processed data."""
        return {
            'total_counties': len(df),
            'counties_with_expansion': len(df[df['medicaid_expansion'] > 0]),
            'total_medicaid_enrollment': df['county_total'].sum(),
            'total_expansion_enrollment': df['medicaid_expansion'].sum(),
            'average_expansion_ratio': df['expansion_ratio'].mean(),
            'high_risk_counties': len(df[df['policy_risk_score'] >= 6.5]),
            'extreme_risk_counties': len(df[df['policy_risk_score'] >= 8.5]),
            'counties_missing_data': len(df[df['county_total'].isna()]),
            'data_completeness': (len(df) - len(df[df['county_total'].isna()])) / len(df)
        }


def main():
    """Main function to run the enhanced Medicaid parser."""
    parser = EnhancedMedicaidParser()
    
    # File path
    medicaid_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv"
    
    try:
        # Parse the data
        df_processed = parser.load_and_parse_medicaid_csv(medicaid_file)
        
        # Calculate risk scores
        df_with_scores = parser.calculate_policy_risk_scores(df_processed)
        
        # Print summary statistics
        stats = parser.get_summary_statistics(df_with_scores)
        logger.info("Summary Statistics:")
        for key, value in stats.items():
            logger.info(f"  {key}: {value}")
        
        # Save to database
        session = SessionLocal()
        try:
            parser.save_to_database(df_with_scores, session)
        finally:
            session.close()
        
        # Save processed data to CSV for review
        output_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/backend/data/processed/nc_medicaid_processed_enhanced.csv"
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        df_with_scores.to_csv(output_file, index=False)
        logger.info(f"Processed data saved to: {output_file}")
        
        return df_with_scores
        
    except Exception as e:
        logger.error(f"Error in main processing: {e}")
        raise


if __name__ == "__main__":
    main()