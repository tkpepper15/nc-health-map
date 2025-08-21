"""
Abstract base class for all data processors in the NC Healthcare Vulnerability system.
Provides common functionality for CSV ingestion, data cleaning, and score calculation.
"""

from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import re
from datetime import datetime, date


class BaseDataProcessor(ABC):
    """
    Abstract base class for processing healthcare datasets.
    
    This class provides the framework for:
    1. Loading data from various sources (CSV, Excel, API)
    2. Cleaning and standardizing data
    3. Calculating vulnerability component scores
    4. Validating data quality
    """
    
    def __init__(self, data_source: str, processing_date: Optional[date] = None):
        """
        Initialize the data processor.
        
        Args:
            data_source: Identifier for the data source (e.g., "NC_DHHS_Medicaid")
            processing_date: Date for the data processing (defaults to today)
        """
        self.data_source = data_source
        self.processing_date = processing_date or date.today()
        self.logger = self._setup_logger()
        self.errors = []
        self.warnings = []
        
    def _setup_logger(self) -> logging.Logger:
        """Set up logging for the processor."""
        logger = logging.getLogger(f"{self.__class__.__name__}_{self.data_source}")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    @abstractmethod
    def load_data(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Load data from file. Must be implemented by subclasses.
        
        Args:
            file_path: Path to the data file
            
        Returns:
            DataFrame containing the raw data
        """
        pass
    
    @abstractmethod
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and standardize data. Must be implemented by subclasses.
        
        Args:
            df: Raw dataframe
            
        Returns:
            Cleaned dataframe
        """
        pass
    
    @abstractmethod
    def calculate_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate vulnerability component scores. Must be implemented by subclasses.
        
        Args:
            df: Cleaned dataframe
            
        Returns:
            Dataframe with calculated scores
        """
        pass
    
    def standardize_county_codes(self, df: pd.DataFrame, county_col: str) -> pd.DataFrame:
        """
        Ensure consistent FIPS codes across all processors.
        
        Args:
            df: DataFrame containing county identifiers
            county_col: Name of the column containing county identifiers
            
        Returns:
            DataFrame with standardized fips_code column
        """
        # Create a copy to avoid modifying original
        df_copy = df.copy()
        
        # Convert to string and pad with zeros
        df_copy['fips_code'] = df_copy[county_col].astype(str).str.zfill(5)
        
        # Filter to NC counties only (FIPS codes starting with 37)
        initial_count = len(df_copy)
        df_copy = df_copy[df_copy['fips_code'].str.startswith('37')]
        final_count = len(df_copy)
        
        if initial_count != final_count:
            self.logger.warning(
                f"Filtered out {initial_count - final_count} non-NC counties"
            )
        
        # Validate FIPS codes
        invalid_fips = df_copy[~df_copy['fips_code'].str.match(r'^37\d{3}$')]
        if not invalid_fips.empty:
            self.warnings.append(f"Found {len(invalid_fips)} invalid FIPS codes")
            self.logger.warning(f"Invalid FIPS codes: {invalid_fips['fips_code'].tolist()}")
        
        return df_copy
    
    def standardize_county_names(self, df: pd.DataFrame, name_col: str) -> pd.DataFrame:
        """
        Standardize county names to consistent format.
        
        Args:
            df: DataFrame containing county names
            name_col: Name of the column containing county names
            
        Returns:
            DataFrame with standardized county_name column
        """
        df_copy = df.copy()
        
        # Clean county names
        df_copy['county_name'] = (
            df_copy[name_col]
            .astype(str)
            .str.strip()
            .str.title()
            .str.replace(r'\s+', ' ', regex=True)  # Multiple spaces to single
        )
        
        # Ensure "County" suffix
        df_copy['county_name'] = df_copy['county_name'].apply(
            lambda x: x if x.endswith(' County') else f"{x} County"
        )
        
        return df_copy
    
    def validate_numeric_ranges(self, df: pd.DataFrame, 
                               column_ranges: Dict[str, tuple]) -> pd.DataFrame:
        """
        Validate that numeric columns are within expected ranges.
        
        Args:
            df: DataFrame to validate
            column_ranges: Dict mapping column names to (min, max) tuples
            
        Returns:
            DataFrame with validation flags
        """
        df_copy = df.copy()
        
        for col, (min_val, max_val) in column_ranges.items():
            if col in df_copy.columns:
                # Check for out-of-range values
                out_of_range = (
                    (df_copy[col] < min_val) | 
                    (df_copy[col] > max_val)
                ) & df_copy[col].notna()
                
                if out_of_range.any():
                    count = out_of_range.sum()
                    self.warnings.append(
                        f"Column '{col}': {count} values outside range [{min_val}, {max_val}]"
                    )
                    
                    # Flag invalid values
                    df_copy[f"{col}_validation_flag"] = out_of_range
        
        return df_copy
    
    def calculate_percentile_scores(self, df: pd.DataFrame, 
                                  columns: List[str],
                                  invert: Optional[List[str]] = None) -> pd.DataFrame:
        """
        Convert raw values to 1-10 scale using percentile ranking.
        
        Args:
            df: DataFrame containing columns to score
            columns: List of columns to convert to scores
            invert: List of columns where lower values = higher vulnerability
            
        Returns:
            DataFrame with additional score columns
        """
        df_copy = df.copy()
        invert = invert or []
        
        for col in columns:
            if col in df_copy.columns:
                # Calculate percentile ranks (0-1)
                percentiles = df_copy[col].rank(pct=True, na_option='keep')
                
                if col in invert:
                    # Invert for metrics where lower = worse
                    percentiles = 1 - percentiles
                
                # Convert to 1-10 scale
                scores = (percentiles * 9) + 1
                df_copy[f"{col}_score"] = scores.clip(1, 10)
        
        return df_copy
    
    def calculate_z_scores(self, df: pd.DataFrame, columns: List[str]) -> pd.DataFrame:
        """
        Calculate standardized z-scores for specified columns.
        
        Args:
            df: DataFrame containing columns to standardize
            columns: List of columns to calculate z-scores for
            
        Returns:
            DataFrame with additional z-score columns
        """
        df_copy = df.copy()
        
        for col in columns:
            if col in df_copy.columns:
                mean_val = df_copy[col].mean()
                std_val = df_copy[col].std()
                
                if std_val > 0:
                    df_copy[f"{col}_zscore"] = (df_copy[col] - mean_val) / std_val
                else:
                    df_copy[f"{col}_zscore"] = 0
        
        return df_copy
    
    def handle_missing_values(self, df: pd.DataFrame, 
                            strategy: Dict[str, str]) -> pd.DataFrame:
        """
        Handle missing values using specified strategies.
        
        Args:
            df: DataFrame with missing values
            strategy: Dict mapping column names to strategies ('mean', 'median', 'mode', 'zero', 'drop')
            
        Returns:
            DataFrame with missing values handled
        """
        df_copy = df.copy()
        
        for col, method in strategy.items():
            if col in df_copy.columns:
                missing_count = df_copy[col].isnull().sum()
                
                if missing_count > 0:
                    self.logger.info(f"Handling {missing_count} missing values in '{col}' using '{method}'")
                    
                    if method == 'mean':
                        df_copy[col].fillna(df_copy[col].mean(), inplace=True)
                    elif method == 'median':
                        df_copy[col].fillna(df_copy[col].median(), inplace=True)
                    elif method == 'mode':
                        mode_val = df_copy[col].mode().iloc[0] if not df_copy[col].mode().empty else 0
                        df_copy[col].fillna(mode_val, inplace=True)
                    elif method == 'zero':
                        df_copy[col].fillna(0, inplace=True)
                    elif method == 'drop':
                        df_copy.dropna(subset=[col], inplace=True)
        
        return df_copy
    
    def calculate_data_quality_score(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate data quality score based on completeness and validity.
        
        Args:
            df: DataFrame to assess
            
        Returns:
            DataFrame with data_quality_score column
        """
        df_copy = df.copy()
        
        # Calculate completeness (non-null values / total values)
        total_cols = len(df_copy.columns)
        completeness = df_copy.count(axis=1) / total_cols
        
        # Add penalty for validation flags
        validation_cols = [col for col in df_copy.columns if col.endswith('_validation_flag')]
        if validation_cols:
            validation_penalty = df_copy[validation_cols].sum(axis=1) * 0.1
            completeness = completeness - validation_penalty
        
        # Ensure score is between 0 and 1
        df_copy['data_quality_score'] = completeness.clip(0, 1)
        
        return df_copy
    
    def process_file(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Main processing pipeline that orchestrates all steps.
        
        Args:
            file_path: Path to the data file
            
        Returns:
            Fully processed DataFrame ready for database insertion
        """
        try:
            self.logger.info(f"Starting processing of {file_path}")
            
            # Step 1: Load data
            raw_data = self.load_data(file_path)
            self.logger.info(f"Loaded {len(raw_data)} rows from {file_path}")
            
            # Step 2: Clean data
            cleaned_data = self.clean_data(raw_data)
            self.logger.info(f"Cleaned data: {len(cleaned_data)} rows remaining")
            
            # Step 3: Calculate scores
            scored_data = self.calculate_scores(cleaned_data)
            self.logger.info("Calculated vulnerability scores")
            
            # Step 4: Calculate data quality
            final_data = self.calculate_data_quality_score(scored_data)
            
            # Step 5: Add metadata
            final_data['data_source'] = self.data_source
            final_data['processing_date'] = self.processing_date
            final_data['processed_at'] = datetime.now()
            
            self.logger.info(f"Processing completed successfully: {len(final_data)} records")
            
            return final_data
            
        except Exception as e:
            self.errors.append(str(e))
            self.logger.error(f"Processing failed: {e}")
            raise
    
    def get_processing_summary(self) -> Dict[str, Any]:
        """
        Get summary of processing results.
        
        Returns:
            Dictionary containing processing statistics and issues
        """
        return {
            'data_source': self.data_source,
            'processing_date': self.processing_date,
            'errors': self.errors,
            'warnings': self.warnings,
            'error_count': len(self.errors),
            'warning_count': len(self.warnings)
        }