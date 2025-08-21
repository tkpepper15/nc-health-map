"""
Comprehensive data loading script for NC Healthcare Vulnerability Index.
Loads all data types: counties, Medicaid data, geographical features, and more.
"""

import sys
import logging
from pathlib import Path
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import json

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal, Base, engine, create_tables
from app.models import County, HealthcareMetrics, GeographicalFeature, AccessMetric, ServiceArea, Hospital
from scripts.enhanced_medicaid_parser import EnhancedMedicaidParser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ComprehensiveDataLoader:
    """
    Loads all NC healthcare and geographical data into the database.
    """
    
    def __init__(self):
        self.session = SessionLocal()
        self.county_population_data = self._load_county_population_data()
        
    def __del__(self):
        if hasattr(self, 'session'):
            self.session.close()
    
    def _load_county_population_data(self) -> Dict[str, int]:
        """Load 2020 Census population data for NC counties."""
        # This would typically come from a census data file
        # For now, using representative data for key counties
        return {
            '37001': 171415,  # Alamance
            '37021': 269452,  # Buncombe  
            '37025': 225804,  # Cabarrus
            '37047': 50623,   # Columbus
            '37063': 324833,  # Durham
            '37067': 382295,  # Forsyth
            '37081': 533670,  # Guilford
            '37119': 1110356, # Mecklenburg
            '37135': 148696,  # Orange
            '37145': 39097,   # Person
            '37155': 116530,  # Robeson
            '37173': 14117,   # Swain
            '37183': 1111761, # Wake
            # Add more as needed - this would typically be loaded from a complete census file
        }
    
    def create_database_tables(self) -> None:
        """Create all database tables."""
        logger.info("Creating database tables...")
        try:
            create_tables()
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise
    
    def load_base_county_data(self) -> None:
        """Load base county information for all 100 NC counties."""
        logger.info("Loading base county data...")
        
        # NC counties with FIPS codes (all 100)
        nc_counties = [
            ('37001', 'Alamance'), ('37003', 'Alexander'), ('37005', 'Alleghany'),
            ('37007', 'Anson'), ('37009', 'Ashe'), ('37011', 'Avery'),
            ('37013', 'Beaufort'), ('37015', 'Bertie'), ('37017', 'Bladen'),
            ('37019', 'Brunswick'), ('37021', 'Buncombe'), ('37023', 'Burke'),
            ('37025', 'Cabarrus'), ('37027', 'Caldwell'), ('37029', 'Camden'),
            ('37031', 'Carteret'), ('37033', 'Caswell'), ('37035', 'Catawba'),
            ('37037', 'Chatham'), ('37039', 'Cherokee'), ('37041', 'Chowan'),
            ('37043', 'Clay'), ('37045', 'Cleveland'), ('37047', 'Columbus'),
            ('37049', 'Craven'), ('37051', 'Cumberland'), ('37053', 'Currituck'),
            ('37055', 'Dare'), ('37057', 'Davidson'), ('37059', 'Davie'),
            ('37061', 'Duplin'), ('37063', 'Durham'), ('37065', 'Edgecombe'),
            ('37067', 'Forsyth'), ('37069', 'Franklin'), ('37071', 'Gaston'),
            ('37073', 'Gates'), ('37075', 'Graham'), ('37077', 'Granville'),
            ('37079', 'Greene'), ('37081', 'Guilford'), ('37083', 'Halifax'),
            ('37085', 'Harnett'), ('37087', 'Haywood'), ('37089', 'Henderson'),
            ('37091', 'Hertford'), ('37093', 'Hoke'), ('37095', 'Hyde'),
            ('37097', 'Iredell'), ('37099', 'Jackson'), ('37101', 'Johnston'),
            ('37103', 'Jones'), ('37105', 'Lee'), ('37107', 'Lenoir'),
            ('37109', 'Lincoln'), ('37111', 'McDowell'), ('37113', 'Macon'),
            ('37115', 'Madison'), ('37117', 'Martin'), ('37119', 'Mecklenburg'),
            ('37121', 'Mitchell'), ('37123', 'Montgomery'), ('37125', 'Moore'),
            ('37127', 'Nash'), ('37129', 'New Hanover'), ('37131', 'Northampton'),
            ('37133', 'Onslow'), ('37135', 'Orange'), ('37137', 'Pamlico'),
            ('37139', 'Pasquotank'), ('37141', 'Pender'), ('37143', 'Perquimans'),
            ('37145', 'Person'), ('37147', 'Pitt'), ('37149', 'Polk'),
            ('37151', 'Randolph'), ('37153', 'Richmond'), ('37155', 'Robeson'),
            ('37157', 'Rockingham'), ('37159', 'Rowan'), ('37161', 'Rutherford'),
            ('37163', 'Sampson'), ('37165', 'Scotland'), ('37167', 'Stanly'),
            ('37169', 'Stokes'), ('37171', 'Surry'), ('37173', 'Swain'),
            ('37175', 'Transylvania'), ('37177', 'Tyrrell'), ('37179', 'Union'),
            ('37181', 'Vance'), ('37183', 'Wake'), ('37185', 'Warren'),
            ('37187', 'Washington'), ('37189', 'Watauga'), ('37191', 'Wayne'),
            ('37193', 'Wilkes'), ('37195', 'Wilson'), ('37197', 'Yadkin'),
            ('37199', 'Yancey')
        ]
        
        counties_created = 0
        counties_updated = 0
        
        for fips_code, county_name in nc_counties:
            try:
                # Check if county exists
                county = self.session.query(County).filter_by(fips_code=fips_code).first()
                
                if not county:
                    # Create new county
                    county = County(
                        fips_code=fips_code,
                        county_name=county_name,
                        state_code='NC'
                    )
                    
                    # Add population data if available
                    if fips_code in self.county_population_data:
                        county.population_2020 = self.county_population_data[fips_code]
                    
                    # Set rural classification (simplified logic)
                    # Counties with population < 50,000 are typically rural
                    population = self.county_population_data.get(fips_code, 30000)  # Default estimate
                    county.rural_urban_code = 7 if population < 50000 else 2  # Rural vs Urban
                    county.metropolitan_status = 'rural' if population < 50000 else 'metro'
                    
                    self.session.add(county)
                    counties_created += 1
                else:
                    # Update existing county
                    if county.county_name != county_name:
                        county.county_name = county_name
                        counties_updated += 1
                    
                    # Update population if we have new data
                    if fips_code in self.county_population_data and not county.population_2020:
                        county.population_2020 = self.county_population_data[fips_code]
                        counties_updated += 1
                
            except Exception as e:
                logger.error(f"Error processing county {county_name} ({fips_code}): {e}")
                continue
        
        try:
            self.session.commit()
            logger.info(f"Base county data loaded: {counties_created} created, {counties_updated} updated")
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error saving county data: {e}")
            raise
    
    def load_medicaid_data(self, file_path: str) -> None:
        """Load Medicaid enrollment data."""
        logger.info("Loading Medicaid data...")
        
        parser = EnhancedMedicaidParser()
        
        try:
            # Parse the data
            df_processed = parser.load_and_parse_medicaid_csv(file_path)
            df_with_scores = parser.calculate_policy_risk_scores(df_processed)
            
            # Update counties with population data from Medicaid file if available
            for _, row in df_with_scores.iterrows():
                county = self.session.query(County).filter_by(fips_code=row['fips_code']).first()
                if county and not county.population_2020:
                    # Estimate population from Medicaid enrollment (rough approximation)
                    estimated_pop = int((row.get('county_total', 0) or 0) / 0.25)  # Assume ~25% Medicaid rate
                    if estimated_pop > 5000:  # Only use if reasonable estimate
                        county.population_2020 = estimated_pop
            
            # Save to database using the enhanced parser
            parser.save_to_database(df_with_scores, self.session)
            
            # Get summary statistics
            stats = parser.get_summary_statistics(df_with_scores)
            logger.info("Medicaid data summary:")
            for key, value in stats.items():
                logger.info(f"  {key}: {value}")
            
        except Exception as e:
            logger.error(f"Error loading Medicaid data: {e}")
            raise
    
    def load_sample_hospital_data(self) -> None:
        """Load sample hospital data to demonstrate geographical features."""
        logger.info("Loading sample hospital data...")
        
        # Sample NC hospitals with their locations
        sample_hospitals = [
            {
                'name': 'Duke University Hospital',
                'county_fips': '37063',  # Durham
                'latitude': 36.0106,
                'longitude': -78.9394,
                'hospital_type': 'general_acute',
                'ownership_type': 'private_nonprofit',
                'total_beds': 957,
                'trauma_level': 'I',
                'emergency_services': True,
                'cms_certification_number': '340030'
            },
            {
                'name': 'Atrium Health Carolinas Medical Center',
                'county_fips': '37119',  # Mecklenburg
                'latitude': 35.2201,
                'longitude': -80.8414,
                'hospital_type': 'general_acute',
                'ownership_type': 'private_nonprofit',
                'total_beds': 874,
                'trauma_level': 'I',
                'emergency_services': True,
                'cms_certification_number': '340028'
            },
            {
                'name': 'Columbus Regional Healthcare System',
                'county_fips': '37047',  # Columbus (rural)
                'latitude': 34.2357,
                'longitude': -78.7369,
                'hospital_type': 'general_acute',
                'ownership_type': 'private_nonprofit',
                'total_beds': 101,
                'trauma_level': None,
                'emergency_services': True,
                'rural_designation': 'rural_referral_center'
            },
            {
                'name': 'Swain Community Hospital',
                'county_fips': '37173',  # Swain (critical access)
                'latitude': 35.4318,
                'longitude': -83.4993,
                'hospital_type': 'critical_access',
                'ownership_type': 'public',
                'total_beds': 25,
                'trauma_level': None,
                'emergency_services': True,
                'rural_designation': 'critical_access'
            }
        ]
        
        hospitals_created = 0
        
        for hospital_data in sample_hospitals:
            try:
                # Get the county
                county = self.session.query(County).filter_by(fips_code=hospital_data['county_fips']).first()
                if not county:
                    logger.warning(f"County not found for FIPS: {hospital_data['county_fips']}")
                    continue
                
                # Create geographical feature
                geo_feature = GeographicalFeature(
                    feature_type='hospital',
                    feature_subtype=hospital_data['hospital_type'],
                    name=hospital_data['name'],
                    county_id=county.id,
                    latitude=hospital_data['latitude'],
                    longitude=hospital_data['longitude'],
                    status='active',
                    data_source='sample_data',
                    data_version='2025.01'
                )
                
                # Set hospital-specific attributes
                geo_feature.set_attribute('emergency_services', hospital_data['emergency_services'])
                geo_feature.set_attribute('trauma_level', hospital_data.get('trauma_level'))
                geo_feature.set_attribute('rural_designation', hospital_data.get('rural_designation'))
                
                self.session.add(geo_feature)
                self.session.flush()  # Get the ID
                
                # Create specialized hospital record
                hospital = Hospital(
                    feature_id=geo_feature.id,
                    cms_certification_number=hospital_data.get('cms_certification_number'),
                    hospital_type=hospital_data['hospital_type'],
                    ownership_type=hospital_data['ownership_type'],
                    total_beds=hospital_data.get('total_beds'),
                    trauma_level=hospital_data.get('trauma_level'),
                    emergency_services=hospital_data['emergency_services'],
                    rural_designation=hospital_data.get('rural_designation')
                )
                
                self.session.add(hospital)
                hospitals_created += 1
                
            except Exception as e:
                logger.error(f"Error creating hospital {hospital_data['name']}: {e}")
                continue
        
        try:
            self.session.commit()
            logger.info(f"Sample hospital data loaded: {hospitals_created} hospitals created")
        except Exception as e:
            self.session.rollback()
            logger.error(f"Error saving hospital data: {e}")
            raise
    
    def verify_data_completeness(self) -> Dict[str, Any]:
        """Verify that all expected data has been loaded."""
        logger.info("Verifying data completeness...")
        
        results = {}
        
        # Check counties
        county_count = self.session.query(County).count()
        results['counties_loaded'] = county_count
        results['all_100_counties_loaded'] = county_count == 100
        
        # Check healthcare metrics
        metrics_count = self.session.query(HealthcareMetrics).count()
        results['healthcare_metrics_loaded'] = metrics_count
        
        # Check counties with Medicaid data
        counties_with_medicaid = self.session.query(County).join(HealthcareMetrics).filter(
            HealthcareMetrics.medicaid_total_enrollment.isnot(None)
        ).count()
        results['counties_with_medicaid_data'] = counties_with_medicaid
        
        # Check geographical features
        geo_features_count = self.session.query(GeographicalFeature).count()
        results['geographical_features_loaded'] = geo_features_count
        
        # Check hospitals
        hospitals_count = self.session.query(Hospital).count()
        results['hospitals_loaded'] = hospitals_count
        
        # Verify high-risk counties
        high_risk_counties = self.session.query(HealthcareMetrics).filter(
            HealthcareMetrics.policy_risk_score >= 6.5
        ).count()
        results['high_risk_counties'] = high_risk_counties
        
        logger.info("Data completeness verification:")
        for key, value in results.items():
            logger.info(f"  {key}: {value}")
        
        return results
    
    def generate_summary_report(self) -> str:
        """Generate a summary report of loaded data."""
        verification = self.verify_data_completeness()
        
        report = f"""
NC Healthcare Vulnerability Index - Data Loading Summary
======================================================

Data Completeness:
- Counties loaded: {verification['counties_loaded']}/100
- All counties present: {'✓' if verification['all_100_counties_loaded'] else '✗'}
- Counties with Medicaid data: {verification['counties_with_medicaid_data']}
- Healthcare metrics records: {verification['healthcare_metrics_loaded']}
- Geographical features: {verification['geographical_features_loaded']}
- Hospitals: {verification['hospitals_loaded']}

Risk Analysis:
- High-risk counties (score ≥ 6.5): {verification['high_risk_counties']}

Database Schema:
- Flexible geographical feature system implemented
- Hospital-specific data model available
- Access metrics framework ready for expansion
- Service area mapping capabilities included

Next Steps:
1. Add more hospital data from CMS Hospital Cost Reports
2. Load ambulance service locations and response times
3. Import clinic and pharmacy location data
4. Calculate travel time matrices for access analysis
5. Add social determinants data from Census ACS
"""
        return report


def main():
    """Main function to run comprehensive data loading."""
    logger.info("Starting comprehensive data loading for NC Healthcare Vulnerability Index")
    
    loader = ComprehensiveDataLoader()
    
    try:
        # Step 1: Create database tables
        loader.create_database_tables()
        
        # Step 2: Load base county data (all 100 NC counties)
        loader.load_base_county_data()
        
        # Step 3: Load Medicaid data
        medicaid_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv"
        if Path(medicaid_file).exists():
            loader.load_medicaid_data(medicaid_file)
        else:
            logger.warning(f"Medicaid file not found: {medicaid_file}")
        
        # Step 4: Load sample geographical data
        loader.load_sample_hospital_data()
        
        # Step 5: Verify data completeness
        verification = loader.verify_data_completeness()
        
        # Step 6: Generate summary report
        report = loader.generate_summary_report()
        print(report)
        
        # Save report to file
        report_file = "/Users/tejjaskaul/PycharmProjects/nc-health-map/backend/data/processed/data_loading_report.txt"
        Path(report_file).parent.mkdir(parents=True, exist_ok=True)
        with open(report_file, 'w') as f:
            f.write(report)
        
        logger.info(f"Data loading completed successfully. Report saved to: {report_file}")
        return verification
        
    except Exception as e:
        logger.error(f"Error in comprehensive data loading: {e}")
        raise
    finally:
        loader.session.close()


if __name__ == "__main__":
    main()