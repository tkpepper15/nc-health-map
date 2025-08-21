#!/usr/bin/env python3
"""
Process NC Medicaid enrollment CSV data and load into database.
Handles the detailed NC DHHS Medicaid enrollment data by category.
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import date
import logging

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db, SessionLocal
from app.core.config import settings
from app.models.county import County
from app.models.healthcare import HealthcareMetrics
from data_processing.medicaid_processor import MedicaidDataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NCMedicaidProcessor(MedicaidDataProcessor):
    """
    Specialized processor for NC DHHS Medicaid enrollment data format.
    """
    
    def __init__(self, data_version: str = "2025"):
        super().__init__(data_version)
        
        # Updated column mappings for NC DHHS format
        self.column_mappings = {
            'county_name': ['COUNTY NAME', 'County Name', 'county'],
            'aged': ['AGED'],
            'blind': ['BLIND'],
            'disabled': ['DISABLED'],
            'tanf_under_21': ['TANF (AFDC) UNDER 21'],
            'tanf_21_over': ['TANF (AFDC) 21 AND OVER'],
            'other_child': ['OTHER CHILD'],
            'pregnant_women': ['PREGNANT WOMEN'],
            'family_planning': ['FAMILY PLANNING'],
            'infants_children': ['INFANTS AND CHILDREN'],
            'mchip': ['MCHIP'],
            'mqbq': ['MQBQ'],
            'mqbb': ['MQBB'],
            'mqbe': ['MQBE'],
            'bcc': ['BCC'],
            'refugees': ['REFUGEES'],
            'documented_non_citizens': ['DOCUMENTED NON-CITIZENS'],
            'emergency_services': ['EMERGENCY SERVICES ONLY'],
            'covid_medicaid': ['COVID-19 MEDICAID'],
            'medicaid_expansion': ['MEDICAID EXPANSION'],
            'county_total': ['COUNTY TOTAL']
        }
        
        # NC county FIPS code mapping
        self.nc_county_fips = self._load_nc_county_fips()
    
    def _load_nc_county_fips(self) -> dict:
        """Load NC county name to FIPS code mapping."""
        # NC county FIPS mapping (37XXX format)
        fips_mapping = {
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
        return fips_mapping
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean NC Medicaid data with special handling for # symbols and formatting.
        """
        # Apply column mapping first
        df_clean = self._map_columns(df)
        
        # Clean county names
        if 'county_name' in df_clean.columns:
            df_clean['county_name'] = df_clean['county_name'].str.strip().str.upper()
            
            # Add FIPS codes based on county names
            df_clean['fips_code'] = df_clean['county_name'].map(self.nc_county_fips)
            
            # Check for missing FIPS codes
            missing_fips = df_clean[df_clean['fips_code'].isnull()]
            if not missing_fips.empty:
                self.logger.warning(f"Missing FIPS codes for counties: {missing_fips['county_name'].tolist()}")
        
        # Clean numeric columns - handle # symbols and commas
        numeric_columns = [
            'aged', 'blind', 'disabled', 'tanf_under_21', 'tanf_21_over',
            'other_child', 'pregnant_women', 'family_planning', 'infants_children',
            'mchip', 'mqbq', 'mqbb', 'mqbe', 'bcc', 'refugees',
            'documented_non_citizens', 'emergency_services', 'covid_medicaid',
            'medicaid_expansion', 'county_total'
        ]
        
        for col in numeric_columns:
            if col in df_clean.columns:
                # Convert to string first, then handle # and commas
                df_clean[col] = df_clean[col].astype(str)
                
                # Replace # with NaN (suppressed data)
                df_clean[col] = df_clean[col].replace('#', np.nan)
                df_clean[col] = df_clean[col].replace('nan', np.nan)
                
                # Remove commas for values that are not NaN
                df_clean[col] = df_clean[col].apply(lambda x: x.replace(',', '') if pd.notna(x) and isinstance(x, str) else x)
                
                # Convert to numeric
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
        
        # Calculate enrollment categories
        self._calculate_enrollment_categories(df_clean)
        
        # Remove rows without valid FIPS codes
        df_clean = df_clean.dropna(subset=['fips_code'])
        
        # Handle missing values
        missing_strategies = {
            'county_total': 'zero',
            'medicaid_expansion': 'zero',
            'aged': 'zero',
            'disabled': 'zero'
        }
        
        df_clean = self.handle_missing_values(df_clean, missing_strategies)
        
        # Validate enrollment totals
        self._validate_enrollment_totals(df_clean)
        
        self.logger.info(f"Cleaned NC Medicaid data: {len(df_clean)} counties")
        
        return df_clean
    
    def _calculate_enrollment_categories(self, df: pd.DataFrame) -> None:
        """Calculate traditional vs expansion enrollment."""
        
        # Traditional Medicaid categories (pre-expansion)
        traditional_categories = [
            'aged', 'blind', 'disabled', 'tanf_under_21', 'tanf_21_over',
            'other_child', 'pregnant_women', 'family_planning', 'infants_children',
            'mchip'
        ]
        
        # Sum traditional categories
        traditional_cols = [col for col in traditional_categories if col in df.columns]
        df['traditional_enrollment'] = df[traditional_cols].sum(axis=1, skipna=True)
        
        # Expansion enrollment is the specific column
        if 'medicaid_expansion' not in df.columns:
            df['medicaid_expansion'] = 0
        
        df['expansion_enrollment'] = df['medicaid_expansion'].fillna(0)
        
        # Total enrollment from county_total column (most reliable)
        df['total_enrollment'] = df['county_total'].fillna(0)
        
        # Alternative total calculation for validation
        all_categories = traditional_cols + ['medicaid_expansion']
        available_cats = [col for col in all_categories if col in df.columns]
        df['calculated_total'] = df[available_cats].sum(axis=1, skipna=True)
    
    def _validate_enrollment_totals(self, df: pd.DataFrame) -> None:
        """Validate that enrollment totals are consistent."""
        
        if all(col in df.columns for col in ['total_enrollment', 'calculated_total']):
            # Check consistency between reported total and calculated total
            difference = abs(df['total_enrollment'] - df['calculated_total'])
            large_differences = difference > (df['total_enrollment'] * 0.05)  # >5% difference
            
            if large_differences.any():
                problem_counties = df[large_differences]['county_name'].tolist()
                self.logger.warning(f"Large enrollment total discrepancies in: {problem_counties}")
                
                # Use reported county_total as authoritative
                df.loc[large_differences, 'total_enrollment_flag'] = True
    
    def calculate_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate policy risk scores specific to NC Medicaid data.
        """
        df_scored = df.copy()
        
        # Add population data (would need to be loaded separately)
        df_scored['population_2020'] = self._estimate_population(df_scored)
        
        # Calculate dependency metrics
        self._calculate_dependency_metrics(df_scored)
        
        # Calculate component scores
        self._calculate_component_scores(df_scored)
        
        # Calculate composite policy risk score
        self._calculate_policy_risk_score(df_scored)
        
        # Add data quality indicators
        self._calculate_data_quality(df_scored)
        
        return df_scored
    
    def _estimate_population(self, df: pd.DataFrame) -> pd.Series:
        """
        Estimate county population based on FIPS codes.
        In production, this would load from Census data.
        """
        # Placeholder population estimates (would use real Census data)
        population_estimates = {
            '37183': 1111761,  # Wake County
            '37119': 1110356,  # Mecklenburg County
            '37081': 533670,   # Guilford County
            '37063': 324833,   # Durham County
            '37067': 382295,   # Forsyth County
            '37051': 334728,   # Cumberland County
            '37021': 269452,   # Buncombe County
        }
        
        # Use average for unknown counties
        avg_population = 65000  # Approximate average NC county population
        
        return df['fips_code'].map(population_estimates).fillna(avg_population)
    
    def _calculate_data_quality(self, df: pd.DataFrame) -> None:
        """Calculate data quality score based on suppressed data."""
        
        # Count suppressed fields (originally #)
        numeric_columns = [
            'aged', 'blind', 'disabled', 'tanf_under_21', 'tanf_21_over',
            'other_child', 'pregnant_women', 'family_planning', 'infants_children',
            'mchip', 'mqbq', 'mqbb', 'mqbe', 'bcc', 'refugees',
            'documented_non_citizens', 'emergency_services', 'covid_medicaid',
            'medicaid_expansion'
        ]
        
        available_cols = [col for col in numeric_columns if col in df.columns]
        
        # Calculate completeness (non-null values / total possible values)
        completeness = df[available_cols].count(axis=1) / len(available_cols)
        
        # Adjust for counties with very low enrollment (more likely to have suppressed data)
        small_county_adjustment = np.where(df['total_enrollment'] < 1000, 0.1, 0)
        
        df['data_quality_score'] = (completeness - small_county_adjustment).clip(0, 1)


def process_nc_medicaid_file(file_path: str, metric_date: date = None) -> pd.DataFrame:
    """
    Process a single NC Medicaid enrollment file.
    
    Args:
        file_path: Path to the CSV file
        metric_date: Date for the metrics (defaults to date derived from filename)
    
    Returns:
        Processed DataFrame ready for database insertion
    """
    if not metric_date:
        # Try to extract date from filename
        filename = Path(file_path).stem
        if 'jun_2025' in filename.lower():
            metric_date = date(2025, 6, 1)
        else:
            metric_date = date.today()
    
    processor = NCMedicaidProcessor()
    
    try:
        # Process the file
        processed_data = processor.process_file(file_path)
        
        # Add metric date
        processed_data['metric_date'] = metric_date
        
        logger.info(f"Successfully processed {len(processed_data)} counties from {file_path}")
        
        return processed_data
        
    except Exception as e:
        logger.error(f"Failed to process {file_path}: {e}")
        raise


def load_to_database(processed_data: pd.DataFrame) -> None:
    """
    Load processed Medicaid data into the database.
    
    Args:
        processed_data: DataFrame with processed metrics
    """
    db = SessionLocal()
    
    try:
        loaded_count = 0
        
        for _, row in processed_data.iterrows():
            # Find county by FIPS code
            county = db.query(County).filter(County.fips_code == row['fips_code']).first()
            
            if not county:
                logger.warning(f"County {row['fips_code']} not found in database, skipping")
                continue
            
            # Create or update healthcare metrics
            existing_metric = db.query(HealthcareMetrics).filter(
                HealthcareMetrics.county_id == county.id,
                HealthcareMetrics.metric_date == row['metric_date']
            ).first()
            
            if existing_metric:
                # Update existing record
                existing_metric.medicaid_total_enrollment = row.get('total_enrollment')
                existing_metric.medicaid_expansion_enrollment = row.get('expansion_enrollment')
                existing_metric.medicaid_traditional_enrollment = row.get('traditional_enrollment')
                existing_metric.medicaid_enrollment_rate = row.get('medicaid_enrollment_rate')
                existing_metric.medicaid_dependency_ratio = row.get('medicaid_dependency_ratio')
                existing_metric.policy_risk_score = row.get('policy_risk_score')
                existing_metric.data_completeness_score = row.get('data_quality_score')
                existing_metric.data_source = "NC_DHHS_Medicaid"
            else:
                # Create new record
                metrics = HealthcareMetrics(
                    county_id=county.id,
                    metric_date=row['metric_date'],
                    data_source="NC_DHHS_Medicaid",
                    medicaid_total_enrollment=row.get('total_enrollment'),
                    medicaid_expansion_enrollment=row.get('expansion_enrollment'),
                    medicaid_traditional_enrollment=row.get('traditional_enrollment'),
                    medicaid_enrollment_rate=row.get('medicaid_enrollment_rate'),
                    medicaid_dependency_ratio=row.get('medicaid_dependency_ratio'),
                    policy_risk_score=row.get('policy_risk_score'),
                    data_completeness_score=row.get('data_quality_score')
                )
                
                db.add(metrics)
            
            loaded_count += 1
        
        db.commit()
        logger.info(f"Successfully loaded {loaded_count} records to database")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database loading failed: {e}")
        raise
    finally:
        db.close()


def main():
    """Main processing function."""
    # Define the data file
    data_file = Path("../data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv")
    
    if not data_file.exists():
        logger.error(f"Data file not found: {data_file}")
        return
    
    try:
        # Process the Medicaid data
        logger.info(f"Processing NC Medicaid data from {data_file}")
        processed_data = process_nc_medicaid_file(str(data_file))
        
        # Export processed data for review
        output_file = Path(settings.PROCESSED_DATA_DIR) / "nc_medicaid_processed_jun_2025.csv"
        output_file.parent.mkdir(parents=True, exist_ok=True)
        processed_data.to_csv(output_file, index=False)
        logger.info(f"Exported processed data to {output_file}")
        
        # Load to database
        load_to_database(processed_data)
        
        logger.info("Medicaid data processing completed successfully")
        
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()