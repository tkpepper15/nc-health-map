"""
Medicaid data processor for NC Healthcare Vulnerability Index.
Processes NC Medicaid enrollment data to calculate policy risk scores.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from .base_processor import BaseDataProcessor


class MedicaidDataProcessor(BaseDataProcessor):
    """
    Processor for NC Medicaid enrollment CSV data.
    
    This processor handles:
    1. NC Medicaid enrollment by county
    2. Expansion vs traditional enrollment breakdown
    3. Policy risk score calculation based on Medicaid dependency
    4. Historical trend analysis
    """
    
    def __init__(self, data_version: str = "2024"):
        """
        Initialize Medicaid data processor.
        
        Args:
            data_version: Version identifier for the Medicaid data
        """
        super().__init__("NC_DHHS_Medicaid")
        self.data_version = data_version
        
        # Expected column mappings (flexible to handle different CSV formats)
        self.column_mappings = {
            'county': ['county', 'county_name', 'County', 'County Name'],
            'fips': ['fips', 'fips_code', 'FIPS', 'County FIPS', 'county_fips'],
            'total_enrollment': ['total_enrollment', 'Total Enrollment', 'total', 'Total Medicaid'],
            'expansion_enrollment': ['expansion_enrollment', 'Expansion Enrollment', 'expansion', 'Medicaid Expansion'],
            'traditional_enrollment': ['traditional_enrollment', 'Traditional Enrollment', 'traditional', 'Traditional Medicaid'],
            'population': ['population', 'Population', 'total_population', 'County Population', 'pop_2020']
        }
    
    def load_data(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Load Medicaid enrollment CSV data.
        
        Args:
            file_path: Path to the Medicaid CSV file
            
        Returns:
            DataFrame containing raw Medicaid data
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Try different file formats
        if file_path.suffix.lower() == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix.lower() in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        self.logger.info(f"Loaded {len(df)} rows, {len(df.columns)} columns from {file_path}")
        self.logger.info(f"Columns: {list(df.columns)}")
        
        return df
    
    def _map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Map various column names to standardized names.
        
        Args:
            df: DataFrame with original column names
            
        Returns:
            DataFrame with standardized column names
        """
        df_copy = df.copy()
        column_map = {}
        
        for standard_name, possible_names in self.column_mappings.items():
            for col in df_copy.columns:
                if col in possible_names:
                    column_map[col] = standard_name
                    break
        
        df_copy = df_copy.rename(columns=column_map)
        
        # Log what mappings were made
        if column_map:
            self.logger.info(f"Column mappings applied: {column_map}")
        
        return df_copy
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize Medicaid data.
        
        Args:
            df: Raw Medicaid dataframe
            
        Returns:
            Cleaned dataframe
        """
        # Start with column mapping
        df_clean = self._map_columns(df)
        
        # Remove any completely empty rows
        df_clean = df_clean.dropna(how='all')
        
        # Standardize county information
        if 'county' in df_clean.columns:
            df_clean = self.standardize_county_names(df_clean, 'county')
        
        if 'fips' in df_clean.columns:
            df_clean = self.standardize_county_codes(df_clean, 'fips')
        
        # Clean numeric columns
        numeric_columns = ['total_enrollment', 'expansion_enrollment', 'traditional_enrollment', 'population']
        
        for col in numeric_columns:
            if col in df_clean.columns:
                # Remove commas and convert to numeric
                df_clean[col] = pd.to_numeric(
                    df_clean[col].astype(str).str.replace(',', ''), 
                    errors='coerce'
                )
        
        # Calculate traditional enrollment if not provided
        if 'total_enrollment' in df_clean.columns and 'expansion_enrollment' in df_clean.columns:
            if 'traditional_enrollment' not in df_clean.columns:
                df_clean['traditional_enrollment'] = (
                    df_clean['total_enrollment'] - df_clean['expansion_enrollment']
                ).clip(lower=0)
        
        # Validate enrollment consistency
        if all(col in df_clean.columns for col in ['total_enrollment', 'expansion_enrollment', 'traditional_enrollment']):
            # Check that total = expansion + traditional (within small tolerance)
            calculated_total = df_clean['expansion_enrollment'] + df_clean['traditional_enrollment']
            difference = abs(df_clean['total_enrollment'] - calculated_total)
            inconsistent = difference > 10  # Allow small rounding differences
            
            if inconsistent.any():
                count = inconsistent.sum()
                self.warnings.append(f"Found {count} counties with inconsistent enrollment totals")
                
                # Flag inconsistent records
                df_clean['enrollment_consistency_flag'] = inconsistent
        
        # Handle missing values using appropriate strategies
        missing_strategies = {
            'total_enrollment': 'zero',
            'expansion_enrollment': 'zero',
            'traditional_enrollment': 'zero',
            'population': 'median'
        }
        
        df_clean = self.handle_missing_values(df_clean, missing_strategies)
        
        # Validate numeric ranges
        validation_ranges = {
            'total_enrollment': (0, 500000),  # Reasonable limits for NC counties
            'expansion_enrollment': (0, 300000),
            'traditional_enrollment': (0, 200000),
            'population': (1000, 1200000)  # Wake County ~1.1M, smallest counties ~1K
        }
        
        df_clean = self.validate_numeric_ranges(df_clean, validation_ranges)
        
        self.logger.info(f"Data cleaning completed: {len(df_clean)} records")
        
        return df_clean
    
    def calculate_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate policy risk scores from Medicaid enrollment data.
        
        Args:
            df: Cleaned Medicaid dataframe
            
        Returns:
            Dataframe with calculated policy risk scores
        """
        df_scored = df.copy()
        
        # Calculate key Medicaid dependency metrics
        self._calculate_dependency_metrics(df_scored)
        
        # Calculate individual component scores
        self._calculate_component_scores(df_scored)
        
        # Calculate composite policy risk score
        self._calculate_policy_risk_score(df_scored)
        
        return df_scored
    
    def _calculate_dependency_metrics(self, df: pd.DataFrame) -> None:
        """Calculate Medicaid dependency ratios and rates."""
        
        # Medicaid dependency ratio (total enrollment / population)
        if 'total_enrollment' in df.columns and 'population' in df.columns:
            df['medicaid_dependency_ratio'] = (
                df['total_enrollment'] / df['population']
            ).fillna(0)
            
            # Enrollment rate per 1000 population
            df['medicaid_enrollment_rate'] = df['medicaid_dependency_ratio'] * 1000
        
        # Expansion vulnerability (expansion enrollment / total enrollment)
        if 'expansion_enrollment' in df.columns and 'total_enrollment' in df.columns:
            df['expansion_vulnerability'] = (
                df['expansion_enrollment'] / df['total_enrollment'].replace(0, np.nan)
            ).fillna(0)
        
        # Traditional Medicaid ratio
        if 'traditional_enrollment' in df.columns and 'total_enrollment' in df.columns:
            df['traditional_medicaid_ratio'] = (
                df['traditional_enrollment'] / df['total_enrollment'].replace(0, np.nan)
            ).fillna(0)
        
        self.logger.info("Calculated Medicaid dependency metrics")
    
    def _calculate_component_scores(self, df: pd.DataFrame) -> None:
        """Calculate individual component scores for policy risk."""
        
        # Score components that contribute to policy risk
        score_components = []
        
        # 1. Medicaid dependency score (higher dependency = higher risk)
        if 'medicaid_dependency_ratio' in df.columns:
            df = self.calculate_percentile_scores(df, ['medicaid_dependency_ratio'])
            score_components.append('medicaid_dependency_ratio_score')
        
        # 2. Expansion vulnerability score (higher expansion dependency = higher risk)
        if 'expansion_vulnerability' in df.columns:
            df = self.calculate_percentile_scores(df, ['expansion_vulnerability'])
            score_components.append('expansion_vulnerability_score')
        
        # Store component list for later use
        df['score_components'] = [score_components] * len(df)
        
        self.logger.info(f"Calculated component scores: {score_components}")
    
    def _calculate_policy_risk_score(self, df: pd.DataFrame) -> None:
        """Calculate composite policy risk score (1-10 scale)."""
        
        # Define scoring components and weights
        scoring_config = {
            'medicaid_dependency_ratio_score': 0.6,  # Primary driver of policy risk
            'expansion_vulnerability_score': 0.4     # Additional risk from expansion dependency
        }
        
        # Calculate weighted composite score
        total_weight = 0
        weighted_sum = pd.Series(0.0, index=df.index)
        
        for component, weight in scoring_config.items():
            if component in df.columns:
                weighted_sum += df[component] * weight
                total_weight += weight
        
        if total_weight > 0:
            df['policy_risk_score'] = (weighted_sum / total_weight).round(2)
        else:
            # Fallback to simple dependency ratio if components missing
            if 'medicaid_dependency_ratio' in df.columns:
                percentiles = df['medicaid_dependency_ratio'].rank(pct=True)
                df['policy_risk_score'] = ((percentiles * 9) + 1).round(2)
            else:
                df['policy_risk_score'] = 5.0  # Default neutral score
        
        # Ensure scores are within 1-10 range
        df['policy_risk_score'] = df['policy_risk_score'].clip(1, 10)
        
        # Add vulnerability category
        df['policy_risk_category'] = df['policy_risk_score'].apply(self._get_risk_category)
        
        self.logger.info("Calculated composite policy risk scores")
    
    def _get_risk_category(self, score: float) -> str:
        """Convert numeric score to risk category."""
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
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """Get summary of validation results specific to Medicaid data."""
        summary = self.get_processing_summary()
        
        # Add Medicaid-specific validation info
        summary.update({
            'data_version': self.data_version,
            'expected_columns': list(self.column_mappings.keys()),
            'validation_checks': [
                'enrollment_consistency',
                'numeric_ranges',
                'fips_codes',
                'missing_values'
            ]
        })
        
        return summary
    
    def export_processed_data(self, df: pd.DataFrame, output_path: Union[str, Path]) -> None:
        """
        Export processed data to CSV for review.
        
        Args:
            df: Processed dataframe
            output_path: Path for output file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Select key columns for export
        export_columns = [
            'fips_code', 'county_name', 'total_enrollment', 'expansion_enrollment',
            'traditional_enrollment', 'population', 'medicaid_dependency_ratio',
            'expansion_vulnerability', 'medicaid_enrollment_rate', 'policy_risk_score',
            'policy_risk_category', 'data_quality_score'
        ]
        
        # Only include columns that exist
        available_columns = [col for col in export_columns if col in df.columns]
        
        df[available_columns].to_csv(output_path, index=False)
        self.logger.info(f"Exported processed data to {output_path}")


# Example usage and testing functions
def create_sample_medicaid_data() -> pd.DataFrame:
    """Create sample Medicaid data for testing."""
    
    nc_counties = [
        {'county': 'Wake County', 'fips': '37183', 'population': 1111761},
        {'county': 'Mecklenburg County', 'fips': '37119', 'population': 1110356},
        {'county': 'Guilford County', 'fips': '37081', 'population': 533670},
        {'county': 'Durham County', 'fips': '37063', 'population': 324833},
        {'county': 'Columbus County', 'fips': '37047', 'population': 50623},
        {'county': 'Robeson County', 'fips': '37155', 'population': 116530},
        {'county': 'Swain County', 'fips': '37173', 'population': 14117},
        {'county': 'Person County', 'fips': '37145', 'population': 39097}
    ]
    
    # Generate realistic Medicaid enrollment data
    for county in nc_counties:
        # Base enrollment rate varies by county type
        if county['population'] > 500000:  # Large urban
            base_rate = 0.18
        elif county['population'] > 100000:  # Mid-size
            base_rate = 0.25
        else:  # Rural/small
            base_rate = 0.35
        
        total = int(county['population'] * base_rate)
        expansion_pct = np.random.uniform(0.6, 0.8)  # 60-80% expansion
        
        county['total_enrollment'] = total
        county['expansion_enrollment'] = int(total * expansion_pct)
        county['traditional_enrollment'] = total - county['expansion_enrollment']
    
    return pd.DataFrame(nc_counties)