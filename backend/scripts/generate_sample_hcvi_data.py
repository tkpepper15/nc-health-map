#!/usr/bin/env python3
"""
Generate sample HCVI (Healthcare Vulnerability Index) data for all NC counties.
This creates realistic healthcare metrics based on known patterns.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import date
import logging

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.county import County
from app.models.healthcare import HealthcareMetrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_hcvi_data() -> pd.DataFrame:
    """
    Generate realistic HCVI data based on county characteristics and known patterns.
    """
    db = SessionLocal()
    
    try:
        # Get all counties from database
        counties = db.query(County).all()
        
        hcvi_data = []
        
        for county in counties:
            # Base scores on rural/urban status and known patterns
            is_rural = county.rural_urban_code >= 4
            is_mountain = county.county_name in [
                'Cherokee County', 'Clay County', 'Graham County', 'Swain County',
                'Macon County', 'Jackson County', 'Transylvania County', 'Haywood County',
                'Madison County', 'Yancey County', 'Mitchell County', 'Avery County',
                'Watauga County', 'Ashe County', 'Alleghany County'
            ]
            is_eastern = county.fips_code in [
                '37013', '37015', '37017', '37047', '37049', '37053', '37055',
                '37065', '37073', '37083', '37091', '37095', '37103', '37107',
                '37117', '37131', '37137', '37139', '37143', '37177', '37187'
            ]
            
            # Known high-risk counties based on your requirements
            extreme_risk_counties = ['37047', '37155', '37173', '37145']  # Columbus, Robeson, Swain, Person
            high_risk_rural = is_rural and (is_mountain or is_eastern)
            low_risk_urban = county.fips_code in ['37135', '37063', '37119', '37183']  # Orange, Durham, Mecklenburg, Wake
            
            # Healthcare Access Score (1-10, higher is better access)
            if low_risk_urban:
                healthcare_access = np.random.normal(8.5, 0.5)
            elif county.fips_code in extreme_risk_counties:
                healthcare_access = np.random.normal(2.5, 0.8)
            elif high_risk_rural:
                healthcare_access = np.random.normal(3.5, 1.0)
            elif is_rural:
                healthcare_access = np.random.normal(4.5, 1.2)
            else:
                healthcare_access = np.random.normal(6.5, 1.0)
            
            # Policy Risk Score (1-10, higher is more risk)
            medicaid_expansion_ratio = min(0.45 if is_rural else 0.25, 0.6) + np.random.normal(0, 0.05)
            if county.fips_code in extreme_risk_counties:
                policy_risk = np.random.normal(8.5, 0.8)
            elif high_risk_rural:
                policy_risk = np.random.normal(7.0, 1.0)
            elif is_rural:
                policy_risk = np.random.normal(6.0, 1.2)
            elif low_risk_urban:
                policy_risk = np.random.normal(3.0, 0.8)
            else:
                policy_risk = np.random.normal(4.5, 1.0)
            
            # Economic Vulnerability Score (1-10, higher is more vulnerable)
            if county.fips_code in extreme_risk_counties:
                economic_vulnerability = np.random.normal(8.0, 0.8)
            elif high_risk_rural:
                economic_vulnerability = np.random.normal(6.5, 1.0)
            elif is_rural:
                economic_vulnerability = np.random.normal(5.5, 1.2)
            elif low_risk_urban:
                economic_vulnerability = np.random.normal(2.5, 0.8)
            else:
                economic_vulnerability = np.random.normal(4.0, 1.0)
            
            # Clip scores to valid range
            healthcare_access = np.clip(healthcare_access, 1.0, 10.0)
            policy_risk = np.clip(policy_risk, 1.0, 10.0)
            economic_vulnerability = np.clip(economic_vulnerability, 1.0, 10.0)
            
            # Calculate composite HCVI (weighted average, inverted for access)
            inverted_access = 11 - healthcare_access  # Invert so higher = worse
            hcvi_composite = (policy_risk * 0.33 + inverted_access * 0.33 + economic_vulnerability * 0.34)
            hcvi_composite = np.clip(hcvi_composite, 1.0, 10.0)
            
            # Vulnerability category and color
            if hcvi_composite >= 8.5:
                vulnerability_category = 'extreme'
                vulnerability_color = '#8B0000'
            elif hcvi_composite >= 6.5:
                vulnerability_category = 'high'
                vulnerability_color = '#FF4500'
            elif hcvi_composite >= 4.0:
                vulnerability_category = 'moderate'
                vulnerability_color = '#FFD700'
            else:
                vulnerability_category = 'low'
                vulnerability_color = '#228B22'
            
            # Medicaid metrics
            population = county.population_2020 or 50000
            medicaid_total = int(population * medicaid_expansion_ratio * np.random.uniform(1.2, 1.8))
            medicaid_expansion = int(medicaid_total * np.random.uniform(0.3, 0.7) if medicaid_expansion_ratio > 0.2 else 0)
            medicaid_traditional = medicaid_total - medicaid_expansion
            medicaid_enrollment_rate = medicaid_total / population * 100
            medicaid_dependency = medicaid_total / population
            
            # Provider and health metrics
            provider_density = max(1.0, (26.6 if not is_rural else 10.0) * np.random.uniform(0.7, 1.3))
            uninsured_rate = max(5.0, (8.0 if not is_rural else 15.0) * np.random.uniform(0.8, 1.2))
            
            # Data quality
            data_completeness = np.random.uniform(0.85, 0.98)
            
            hcvi_record = {
                'county_id': county.id,
                'fips_code': county.fips_code,
                'county_name': county.county_name,
                'metric_date': date(2025, 6, 1),
                'data_source': 'HCVI_Generated',
                
                # HCVI Scores
                'hcvi_composite': round(hcvi_composite, 2),
                'healthcare_access_score': round(healthcare_access, 2),
                'policy_risk_score': round(policy_risk, 2),
                'economic_vulnerability_score': round(economic_vulnerability, 2),
                'vulnerability_category': vulnerability_category,
                'vulnerability_color': vulnerability_color,
                
                # Healthcare Access Metrics
                'provider_density': round(provider_density, 1),
                'uninsured_rate': round(uninsured_rate, 1),
                'provider_shortage_designation': is_rural,
                
                # Medicaid Metrics
                'medicaid_total_enrollment': medicaid_total,
                'medicaid_expansion_enrollment': medicaid_expansion,
                'medicaid_traditional_enrollment': medicaid_traditional,
                'medicaid_enrollment_rate': round(medicaid_enrollment_rate, 2),
                'medicaid_dependency_ratio': round(medicaid_dependency, 4),
                'medicaid_expansion_ratio': round(medicaid_expansion / medicaid_total if medicaid_total > 0 else 0, 4),
                
                # Policy Risk Indicators
                'federal_funding_dependence': round(np.random.uniform(0.3, 0.8), 3),
                'snap_participation_rate': round((25.0 if is_rural else 12.0) * np.random.uniform(0.8, 1.2), 1),
                'projected_coverage_losses': round(medicaid_expansion * np.random.uniform(0.15, 0.35), 0),
                'rural_hospital_closure_risk': round(np.random.uniform(0.1, 0.9) if is_rural else 0.0, 2),
                
                # Economic Vulnerability
                'hospital_operating_margin': round(np.random.uniform(-15.0, 8.0) if is_rural else np.random.uniform(-5.0, 12.0), 1),
                'private_equity_market_share': round(np.random.uniform(0.1, 0.4), 2),
                'healthcare_employment_rate': round(np.random.uniform(8.0, 18.0), 1),
                
                # Health Outcomes
                'life_expectancy': round((76.0 if is_rural else 79.0) + np.random.uniform(-2, 3), 1),
                'diabetes_prevalence': round((12.0 if is_rural else 9.0) * np.random.uniform(0.8, 1.3), 1),
                'obesity_rate': round((35.0 if is_rural else 28.0) * np.random.uniform(0.9, 1.1), 1),
                
                # Data Quality
                'data_completeness_score': round(data_completeness, 3),
                'is_provisional': False
            }
            
            hcvi_data.append(hcvi_record)
        
        logger.info(f"Generated HCVI data for {len(hcvi_data)} counties")
        return pd.DataFrame(hcvi_data)
    
    finally:
        db.close()


def load_hcvi_to_database(hcvi_df: pd.DataFrame) -> None:
    """
    Load HCVI data into the database.
    """
    db = SessionLocal()
    
    try:
        loaded_count = 0
        
        for _, row in hcvi_df.iterrows():
            # Check if metrics already exist for this county and date
            existing = db.query(HealthcareMetrics).filter(
                HealthcareMetrics.county_id == row['county_id'],
                HealthcareMetrics.metric_date == row['metric_date'],
                HealthcareMetrics.data_source == row['data_source']
            ).first()
            
            if existing:
                # Update existing
                for col in hcvi_df.columns:
                    if col not in ['county_id', 'fips_code', 'county_name'] and hasattr(existing, col):
                        setattr(existing, col, row[col])
            else:
                # Create new - exclude computed properties
                excluded_cols = ['fips_code', 'county_name', 'vulnerability_category', 'vulnerability_color']
                metrics_data = {k: v for k, v in row.items() 
                              if k not in excluded_cols and v is not None}
                
                metrics = HealthcareMetrics(**metrics_data)
                db.add(metrics)
            
            loaded_count += 1
        
        db.commit()
        logger.info(f"Successfully loaded {loaded_count} HCVI records to database")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database loading failed: {e}")
        raise
    finally:
        db.close()


def main():
    """Generate and load sample HCVI data."""
    try:
        logger.info("Generating sample HCVI data")
        
        # Generate HCVI data
        hcvi_df = generate_hcvi_data()
        
        # Save to CSV for review
        output_file = Path("data/processed/sample_hcvi_data.csv")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        hcvi_df.to_csv(output_file, index=False)
        logger.info(f"Exported HCVI data to {output_file}")
        
        # Load to database
        load_hcvi_to_database(hcvi_df)
        
        # Print summary
        vulnerability_counts = hcvi_df['vulnerability_category'].value_counts()
        logger.info(f"Vulnerability distribution: {vulnerability_counts.to_dict()}")
        
        avg_hcvi = hcvi_df['hcvi_composite'].mean()
        logger.info(f"Average HCVI score: {avg_hcvi:.2f}")
        
        logger.info("HCVI data generation completed successfully")
        
    except Exception as e:
        logger.error(f"HCVI data generation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()