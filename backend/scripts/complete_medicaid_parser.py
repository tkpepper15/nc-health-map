"""
Complete Medicaid Data Parser for NC Healthcare Vulnerability Index.
Handles ALL Medicaid categories and properly manages missing/suppressed data.
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import json
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


class CompleteMedicaidParser:
    """
    Complete parser for NC Medicaid enrollment data capturing all categories.
    """
    
    def __init__(self):
        self.nc_fips_mapping = self._create_nc_fips_mapping()
        
        # Complete column mapping based on actual CSV structure
        self.csv_column_mapping = {
            'COUNTY NAME': 'county_name',
            'AGED': 'medicaid_aged',
            'BLIND': 'medicaid_blind', 
            'DISABLED': 'medicaid_disabled',
            'TANF (AFDC) UNDER 21': 'medicaid_tanf_under_21',
            'TANF (AFDC) 21 AND OVER': 'medicaid_tanf_21_and_over',
            'OTHER CHILD': 'medicaid_other_child',
            'PREGNANT WOMEN': 'medicaid_pregnant_women',
            'FAMILY PLANNING': 'medicaid_family_planning',
            'INFANTS AND CHILDREN': 'medicaid_infants_and_children',
            'MCHIP': 'medicaid_mchip',
            'MQBQ': 'medicaid_mqbq',
            'MQBB': 'medicaid_mqbb',
            'MQBE': 'medicaid_mqbe',
            'BCC': 'medicaid_bcc',
            'REFUGEES': 'medicaid_refugees',
            'DOCUMENTED NON-CITIZENS': 'medicaid_documented_non_citizens',
            'EMERGENCY SERVICES ONLY': 'medicaid_emergency_services_only',
            'COVID-19 MEDICAID': 'medicaid_covid_19',
            'MEDICAID EXPANSION': 'medicaid_expansion_enrollment',
            'COUNTY TOTAL': 'medicaid_total_enrollment'
        }
        
        # Traditional Medicaid categories (not expansion)
        self.traditional_medicaid_fields = [
            'medicaid_aged', 'medicaid_blind', 'medicaid_disabled',
            'medicaid_tanf_under_21', 'medicaid_tanf_21_and_over',
            'medicaid_other_child', 'medicaid_pregnant_women',
            'medicaid_family_planning', 'medicaid_infants_and_children',
            'medicaid_mchip'
        ]
        
        # Special program categories
        self.special_program_fields = [
            'medicaid_mqbq', 'medicaid_mqbb', 'medicaid_mqbe',
            'medicaid_bcc', 'medicaid_refugees', 'medicaid_documented_non_citizens',
            'medicaid_emergency_services_only', 'medicaid_covid_19'
        ]
        
        # All numeric medicaid fields
        self.all_medicaid_fields = self.traditional_medicaid_fields + self.special_program_fields + [
            'medicaid_expansion_enrollment', 'medicaid_total_enrollment'
        ]
    
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
        """
        Clean and convert numeric values, handling '#' (suppressed data) and commas.
        Returns None for suppressed data, int for valid numbers.
        """
        if pd.isna(value) or value == '#' or value == '' or str(value).strip() == '#':
            return None
        
        # Remove commas and quotes, convert to string first
        cleaned = str(value).replace(',', '').replace('"', '').strip()
        
        try:
            return int(float(cleaned))
        except (ValueError, TypeError):
            return None
    
    def is_suppressed(self, value: str) -> bool:
        """Check if a value is suppressed (marked with #)."""
        return pd.isna(value) or str(value).strip() == '#' or value == '#'
    
    def load_and_parse_complete_medicaid_csv(self, file_path: str) -> pd.DataFrame:
        """Load and parse the complete Medicaid CSV file with ALL categories."""
        logger.info(f"Loading complete Medicaid data from: {file_path}")
        
        # Load the CSV
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} rows with {len(df.columns)} columns")
        
        # Clean up column names
        df.columns = df.columns.str.strip()
        
        # Process each row
        processed_data = []
        
        for _, row in df.iterrows():
            county_name = str(row['COUNTY NAME']).strip().upper()
            
            # Skip totals row
            if county_name == 'TOTALS':
                logger.info("Skipping TOTALS row")
                continue
            
            # Get FIPS code
            fips_code = self.nc_fips_mapping.get(county_name)
            if not fips_code:
                logger.warning(f"No FIPS code found for county: {county_name}")
                continue
            
            # Initialize county data record
            county_data = {
                'county_name': county_name.title(),
                'fips_code': fips_code
            }
            
            # Track suppressed fields
            suppressed_fields = []
            
            # Process all Medicaid columns
            for csv_col, db_field in self.csv_column_mapping.items():
                if csv_col in row.index:
                    raw_value = row[csv_col]
                    
                    if self.is_suppressed(raw_value):
                        county_data[db_field] = None
                        suppressed_fields.append(db_field)
                    else:
                        cleaned_value = self.clean_numeric_value(raw_value)
                        county_data[db_field] = cleaned_value
                        
                        if cleaned_value is None and not self.is_suppressed(raw_value):
                            logger.warning(f"Could not parse value '{raw_value}' for {county_name} {csv_col}")
                else:
                    county_data[db_field] = None
                    suppressed_fields.append(db_field)
            
            # Store suppressed fields for tracking data availability
            county_data['suppressed_fields'] = suppressed_fields
            
            # Calculate totals for verification
            traditional_total = sum(
                county_data.get(field, 0) or 0 
                for field in self.traditional_medicaid_fields
            )
            
            special_total = sum(
                county_data.get(field, 0) or 0 
                for field in self.special_program_fields
            )
            
            county_data['calculated_traditional_total'] = traditional_total
            county_data['calculated_special_total'] = special_total
            
            # Calculate ratios if we have total enrollment
            total_enrollment = county_data.get('medicaid_total_enrollment', 0) or 0
            expansion_enrollment = county_data.get('medicaid_expansion_enrollment', 0) or 0
            
            if total_enrollment > 0:
                county_data['medicaid_expansion_ratio'] = expansion_enrollment / total_enrollment
                county_data['medicaid_traditional_ratio'] = traditional_total / total_enrollment if traditional_total else 0
                county_data['medicaid_special_ratio'] = special_total / total_enrollment if special_total else 0
                
                # Data completeness score (0-1 scale)
                total_fields = len(self.all_medicaid_fields)
                complete_fields = total_fields - len(suppressed_fields)
                county_data['data_completeness_score'] = complete_fields / total_fields
            else:
                county_data['medicaid_expansion_ratio'] = 0
                county_data['medicaid_traditional_ratio'] = 0
                county_data['medicaid_special_ratio'] = 0
                county_data['data_completeness_score'] = 0
            
            processed_data.append(county_data)
        
        df_processed = pd.DataFrame(processed_data)
        logger.info(f"Successfully processed {len(df_processed)} counties with complete category breakdown")
        
        return df_processed
    
    def calculate_enhanced_policy_risk_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate enhanced policy risk scores with all category data."""
        df_scored = df.copy()
        
        # Calculate various vulnerability indicators
        
        # 1. Overall Medicaid dependency (total enrollment relative to others)
        if 'medicaid_total_enrollment' in df_scored.columns:
            df_scored['total_enrollment_percentile'] = df_scored['medicaid_total_enrollment'].rank(pct=True)
        
        # 2. Expansion dependency (higher = more vulnerable to expansion cuts)
        if 'medicaid_expansion_ratio' in df_scored.columns:
            df_scored['expansion_dependency_percentile'] = df_scored['medicaid_expansion_ratio'].rank(pct=True)
        
        # 3. Disabled population dependency (higher = more vulnerable)
        if 'medicaid_disabled' in df_scored.columns and 'medicaid_total_enrollment' in df_scored.columns:
            df_scored['disabled_ratio'] = (
                df_scored['medicaid_disabled'].fillna(0) / 
                df_scored['medicaid_total_enrollment'].replace(0, np.nan)
            ).fillna(0)
            df_scored['disabled_dependency_percentile'] = df_scored['disabled_ratio'].rank(pct=True)
        
        # 4. Elderly dependency (aged population)
        if 'medicaid_aged' in df_scored.columns and 'medicaid_total_enrollment' in df_scored.columns:
            df_scored['aged_ratio'] = (
                df_scored['medicaid_aged'].fillna(0) / 
                df_scored['medicaid_total_enrollment'].replace(0, np.nan)
            ).fillna(0)
            df_scored['aged_dependency_percentile'] = df_scored['aged_ratio'].rank(pct=True)
        
        # 5. Child dependency (families with children)
        child_fields = ['medicaid_tanf_under_21', 'medicaid_other_child', 'medicaid_infants_and_children', 'medicaid_mchip']
        available_child_fields = [f for f in child_fields if f in df_scored.columns]
        
        if available_child_fields and 'medicaid_total_enrollment' in df_scored.columns:
            df_scored['child_total'] = df_scored[available_child_fields].fillna(0).sum(axis=1)
            df_scored['child_ratio'] = (
                df_scored['child_total'] / 
                df_scored['medicaid_total_enrollment'].replace(0, np.nan)
            ).fillna(0)
            df_scored['child_dependency_percentile'] = df_scored['child_ratio'].rank(pct=True)
        
        # Calculate composite policy risk score (1-10 scale)
        risk_components = []
        weights = {}
        
        if 'expansion_dependency_percentile' in df_scored.columns:
            risk_components.append('expansion_dependency_percentile')
            weights['expansion_dependency_percentile'] = 0.4  # Highest weight - most vulnerable to policy changes
        
        if 'total_enrollment_percentile' in df_scored.columns:
            risk_components.append('total_enrollment_percentile')
            weights['total_enrollment_percentile'] = 0.25  # Volume indicates impact scale
        
        if 'disabled_dependency_percentile' in df_scored.columns:
            risk_components.append('disabled_dependency_percentile')
            weights['disabled_dependency_percentile'] = 0.2  # High-need population
        
        if 'aged_dependency_percentile' in df_scored.columns:
            risk_components.append('aged_dependency_percentile')
            weights['aged_dependency_percentile'] = 0.1  # Vulnerable but often protected
        
        if 'child_dependency_percentile' in df_scored.columns:
            risk_components.append('child_dependency_percentile')
            weights['child_dependency_percentile'] = 0.05  # Important but lower policy risk
        
        # Calculate weighted composite score
        if risk_components:
            total_weight = sum(weights.values())
            weighted_sum = pd.Series(0.0, index=df_scored.index)
            
            for component in risk_components:
                weighted_sum += df_scored[component] * weights[component]
            
            if total_weight > 0:
                # Convert percentile (0-1) to score (1-10)
                df_scored['policy_risk_score'] = ((weighted_sum / total_weight) * 9 + 1).round(2)
            else:
                df_scored['policy_risk_score'] = 5.0
        else:
            # Fallback if no components available
            df_scored['policy_risk_score'] = 5.0
        
        # Ensure scores are within range
        df_scored['policy_risk_score'] = df_scored['policy_risk_score'].clip(1, 10)
        
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
    
    def save_complete_data_to_database(self, df: pd.DataFrame, session: Session) -> None:
        """Save complete Medicaid data with all categories to database."""
        logger.info("Saving complete Medicaid data to database...")
        
        from datetime import date
        metric_date = date(2025, 6, 1)  # June 2025 data
        
        counties_updated = 0
        metrics_created = 0
        metrics_updated = 0
        
        for _, row in df.iterrows():
            try:
                # Get the county
                county = session.query(County).filter_by(fips_code=row['fips_code']).first()
                if not county:
                    logger.warning(f"County not found for FIPS: {row['fips_code']}")
                    continue
                
                # Check if healthcare metrics already exist for this date
                existing_metrics = session.query(HealthcareMetrics).filter_by(
                    county_id=county.id,
                    metric_date=metric_date
                ).first()
                
                if existing_metrics:
                    healthcare_metrics = existing_metrics
                    metrics_updated += 1
                else:
                    healthcare_metrics = HealthcareMetrics(
                        county_id=county.id,
                        metric_date=metric_date,
                        data_source='NC_DHHS_Medicaid_Complete_Jun_2025',
                        data_version='2025.06.complete'
                    )
                    session.add(healthcare_metrics)
                    metrics_created += 1
                
                # Set all the detailed Medicaid fields
                for field in self.all_medicaid_fields:
                    if field in row and hasattr(healthcare_metrics, field):
                        setattr(healthcare_metrics, field, row.get(field))
                
                # Set calculated ratios
                healthcare_metrics.medicaid_expansion_ratio = row.get('medicaid_expansion_ratio')
                
                # Calculate traditional total from individual components
                traditional_total = sum(
                    row.get(field, 0) or 0 
                    for field in self.traditional_medicaid_fields
                )
                healthcare_metrics.medicaid_traditional_enrollment = traditional_total
                
                # Set policy risk score
                healthcare_metrics.policy_risk_score = row.get('policy_risk_score')
                
                # Set data quality indicators
                healthcare_metrics.data_completeness_score = row.get('data_completeness_score', 0.0)
                
                # Store suppressed fields information
                suppressed_fields = row.get('suppressed_fields', [])
                if suppressed_fields:
                    healthcare_metrics.medicaid_data_suppressed_fields = json.dumps(suppressed_fields)
                
                # Set processing metadata
                healthcare_metrics.processed_by = 'complete_medicaid_parser'
                healthcare_metrics.notes = f"Complete Medicaid data with {len(self.all_medicaid_fields)} categories. Data suppressed for {len(suppressed_fields)} fields due to privacy/statistical reliability."
                
            except Exception as e:
                logger.error(f"Error processing county {row.get('county_name', 'Unknown')}: {e}")
                continue
        
        try:
            session.commit()
            logger.info(f"Complete Medicaid data saved: {metrics_created} new metrics, {metrics_updated} updated metrics")
        except Exception as e:
            session.rollback()
            logger.error(f"Error saving complete data: {e}")
            raise
    
    def generate_comprehensive_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive summary of all Medicaid data."""
        summary = {
            'data_overview': {
                'total_counties_processed': len(df),
                'counties_with_complete_data': len(df[df['data_completeness_score'] == 1.0]),
                'average_data_completeness': df['data_completeness_score'].mean(),
            },
            'enrollment_totals': {
                'total_medicaid_statewide': df['medicaid_total_enrollment'].sum(),
                'total_expansion_enrollment': df['medicaid_expansion_enrollment'].sum(),
                'total_traditional_enrollment': df['calculated_traditional_total'].sum(),
                'total_special_programs': df['calculated_special_total'].sum(),
            },
            'top_categories': {},
            'risk_analysis': {
                'extreme_risk_counties': len(df[df['policy_risk_score'] >= 8.5]),
                'high_risk_counties': len(df[df['policy_risk_score'] >= 6.5]),
                'moderate_risk_counties': len(df[(df['policy_risk_score'] >= 4.0) & (df['policy_risk_score'] < 6.5)]),
                'low_risk_counties': len(df[df['policy_risk_score'] < 4.0]),
            },
            'data_suppression': {
                'counties_with_suppressed_data': len(df[df['suppressed_fields'].apply(len) > 0]),
                'most_commonly_suppressed_fields': []
            }
        }
        
        # Calculate top categories by enrollment
        for field in self.traditional_medicaid_fields + self.special_program_fields:
            if field in df.columns:
                total = df[field].sum()
                summary['top_categories'][field] = total
        
        # Sort categories by enrollment
        summary['top_categories'] = dict(
            sorted(summary['top_categories'].items(), key=lambda x: x[1], reverse=True)
        )
        
        # Find most commonly suppressed fields
        all_suppressed = []
        for suppressed_list in df['suppressed_fields']:
            all_suppressed.extend(suppressed_list)
        
        from collections import Counter
        suppression_counts = Counter(all_suppressed)
        summary['data_suppression']['most_commonly_suppressed_fields'] = dict(
            suppression_counts.most_common(10)
        )
        
        return summary


def main():
    """Main function to run complete Medicaid parsing."""
    logger.info("Starting complete Medicaid data parsing with all categories")
    
    parser = CompleteMedicaidParser()
    
    try:
        # File path
        medicaid_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv"
        
        # Parse the complete data
        df_complete = parser.load_and_parse_complete_medicaid_csv(medicaid_file)
        
        # Calculate enhanced risk scores
        df_with_scores = parser.calculate_enhanced_policy_risk_scores(df_complete)
        
        # Generate comprehensive summary
        summary = parser.generate_comprehensive_summary(df_with_scores)
        
        logger.info("=== COMPREHENSIVE MEDICAID DATA SUMMARY ===")
        for section, data in summary.items():
            logger.info(f"\n{section.upper()}:")
            if isinstance(data, dict):
                for key, value in data.items():
                    logger.info(f"  {key}: {value}")
            else:
                logger.info(f"  {data}")
        
        # Save to database
        session = SessionLocal()
        try:
            parser.save_complete_data_to_database(df_with_scores, session)
        finally:
            session.close()
        
        # Save processed data to CSV
        output_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/backend/data/processed/nc_medicaid_complete_processed.csv"
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        df_with_scores.to_csv(output_file, index=False)
        logger.info(f"Complete processed data saved to: {output_file}")
        
        return df_with_scores
        
    except Exception as e:
        logger.error(f"Error in complete processing: {e}")
        raise


if __name__ == "__main__":
    main()