"""
Demonstration script showing the flexibility of the geographical data structure.
Shows how to add hospitals, ambulance zones, and access metrics.
"""

import sys
from pathlib import Path
from datetime import datetime, date
import json

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models import County, GeographicalFeature, AccessMetric, ServiceArea, Hospital
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_ambulance_service_example():
    """Add an ambulance service as a geographical feature."""
    session = SessionLocal()
    
    try:
        # Find a rural county
        rural_county = session.query(County).filter_by(county_name='Person').first()
        
        if rural_county:
            # Add ambulance service
            ambulance_service = GeographicalFeature(
                feature_type='emergency_service',
                feature_subtype='ambulance_station',
                name='Person County EMS Station 1',
                county_id=rural_county.id,
                latitude=36.3959,
                longitude=-78.9739,
                status='active',
                service_radius_miles=15.0,
                extended_service_radius_miles=25.0,
                data_source='nc_emergency_services',
                verification_status='verified'
            )
            
            # Add ambulance-specific attributes
            ambulance_service.update_attributes({
                'response_time_target_minutes': 8,
                'staffing_level': 'ALS',  # Advanced Life Support
                'vehicles_available': 2,
                'backup_stations': ['Station 2', 'Station 3'],
                'service_hours': '24/7',
                'specialties': ['cardiac', 'trauma', 'pediatric']
            })
            
            session.add(ambulance_service)
            logger.info(f"Added ambulance service: {ambulance_service.name}")
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding ambulance service: {e}")
    finally:
        session.close()


def add_pharmacy_example():
    """Add pharmacies as geographical features."""
    session = SessionLocal()
    
    try:
        # Find Wake County
        wake_county = session.query(County).filter_by(county_name='Wake').first()
        
        if wake_county:
            # Add rural pharmacy
            pharmacy = GeographicalFeature(
                feature_type='healthcare_facility',
                feature_subtype='pharmacy',
                name='Apex Community Pharmacy',
                county_id=wake_county.id,
                latitude=35.7321,
                longitude=-78.8503,
                status='active',
                service_radius_miles=10.0,
                data_source='ncbop_licensing'
            )
            
            # Add pharmacy-specific attributes
            pharmacy.update_attributes({
                'license_number': 'NC-12345',
                'pharmacy_type': 'independent',
                'services': ['prescription_filling', 'immunizations', 'medication_therapy_management'],
                'accepts_medicaid': True,
                'accepts_medicare': True,
                'delivery_available': True,
                'hours': {
                    'monday': '9:00-18:00',
                    'tuesday': '9:00-18:00',
                    'wednesday': '9:00-18:00',
                    'thursday': '9:00-18:00',
                    'friday': '9:00-18:00',
                    'saturday': '9:00-14:00',
                    'sunday': 'closed'
                }
            })
            
            session.add(pharmacy)
            logger.info(f"Added pharmacy: {pharmacy.name}")
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding pharmacy: {e}")
    finally:
        session.close()


def add_access_metrics_example():
    """Add travel time and access metrics between counties and hospitals."""
    session = SessionLocal()
    
    try:
        # Get a rural county and nearest hospital
        swain_county = session.query(County).filter_by(county_name='Swain').first()
        duke_hospital = session.query(GeographicalFeature).filter_by(
            name='Duke University Hospital'
        ).first()
        
        if swain_county and duke_hospital:
            # Add access metric for emergency care
            access_metric = AccessMetric(
                origin_county_id=swain_county.id,
                destination_feature_id=duke_hospital.id,
                travel_time_minutes=95.0,  # 1 hour 35 minutes
                travel_distance_miles=85.0,
                straight_line_distance_miles=65.0,
                overall_accessibility_score=3.2,  # Poor due to distance
                emergency_accessibility_score=2.8,  # Very poor for emergencies
                routine_accessibility_score=4.1,   # Manageable for planned care
                is_primary_service_area=False,
                calculation_method='google_maps_api',
                confidence_level=0.95,
                data_date=datetime.now()
            )
            
            # Add transportation barriers
            access_metric.transportation_barriers = [
                'mountain_roads',
                'weather_dependent',
                'no_public_transit',
                'single_route_dependency'
            ]
            
            session.add(access_metric)
            logger.info(f"Added access metric: {swain_county.county_name} to {duke_hospital.name}")
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding access metrics: {e}")
    finally:
        session.close()


def add_service_area_example():
    """Add a hospital service area."""
    session = SessionLocal()
    
    try:
        # Get Duke Hospital
        duke_hospital = session.query(GeographicalFeature).filter_by(
            name='Duke University Hospital'
        ).first()
        
        if duke_hospital:
            # Create service area
            service_area = ServiceArea(
                area_name='Duke Hospital Primary Catchment',
                area_type='hospital_catchment',
                description='Primary service area for Duke University Hospital emergency and specialty services',
                center_latitude=36.0106,
                center_longitude=-78.9394,
                radius_miles=30.0,
                primary_facility_id=duke_hospital.id,
                population_served=450000,
                avg_travel_time_minutes=22.0,
                max_travel_time_minutes=45.0,
                coverage_percentage=85.0,
                managing_organization='Duke Health System',
                data_source='duke_health_planning'
            )
            
            # Add primary services
            service_area.primary_services = [
                'level_1_trauma',
                'cardiac_surgery',
                'neurosurgery',
                'organ_transplant',
                'neonatal_icu',
                'emergency_medicine'
            ]
            
            service_area.service_level = 'comprehensive'
            
            # Add contact info
            service_area.contact_info = {
                'phone': '919-684-8111',
                'website': 'https://www.dukehealth.org',
                'emergency_phone': '911'
            }
            
            session.add(service_area)
            logger.info(f"Added service area: {service_area.area_name}")
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding service area: {e}")
    finally:
        session.close()


def query_examples():
    """Demonstrate flexible querying capabilities."""
    session = SessionLocal()
    
    try:
        print("\n=== Flexible Data Structure Demonstration ===\n")
        
        # 1. Find all hospitals in rural counties
        print("1. Hospitals in Rural Counties:")
        rural_hospitals = session.query(GeographicalFeature).join(County).filter(
            GeographicalFeature.feature_type == 'hospital',
            County.rural_urban_code >= 4
        ).all()
        
        for hospital in rural_hospitals:
            attributes = hospital.attributes or {}
            rural_designation = attributes.get('rural_designation', 'unknown')
            print(f"   - {hospital.name} ({rural_designation}) in {hospital.county.county_name}")
        
        # 2. Find all emergency services
        print("\n2. Emergency Services:")
        emergency_services = session.query(GeographicalFeature).filter(
            GeographicalFeature.feature_type == 'emergency_service'
        ).all()
        
        for service in emergency_services:
            attributes = service.attributes or {}
            response_time = attributes.get('response_time_target_minutes', 'unknown')
            print(f"   - {service.name}: Target response {response_time} minutes")
        
        # 3. Find counties with poor hospital access
        print("\n3. Counties with Poor Hospital Access (>60 minutes):")
        poor_access = session.query(AccessMetric).join(County).filter(
            AccessMetric.travel_time_minutes > 60
        ).all()
        
        for metric in poor_access:
            print(f"   - {metric.origin_county.county_name}: {metric.travel_time_minutes} minutes to {metric.destination_feature.name}")
        
        # 4. Show flexible attribute usage
        print("\n4. Flexible Attributes in Use:")
        features_with_attrs = session.query(GeographicalFeature).filter(
            GeographicalFeature.attributes.isnot(None)
        ).all()
        
        for feature in features_with_attrs:
            attrs = feature.attributes or {}
            attr_keys = list(attrs.keys())[:3]  # Show first 3 attributes
            print(f"   - {feature.name} ({feature.feature_type}): {attr_keys}")
        
        # 5. Service areas and coverage
        print("\n5. Service Areas and Coverage:")
        service_areas = session.query(ServiceArea).all()
        
        for area in service_areas:
            print(f"   - {area.area_name}: {area.population_served:,} people, {area.coverage_percentage}% coverage")
            if area.primary_services:
                print(f"     Services: {', '.join(area.primary_services[:3])}...")
        
    except Exception as e:
        logger.error(f"Error in query examples: {e}")
    finally:
        session.close()


def main():
    """Run flexibility demonstration."""
    logger.info("Demonstrating flexible geographical data structure...")
    
    # Add various types of geographical features
    add_ambulance_service_example()
    add_pharmacy_example()
    add_access_metrics_example()
    add_service_area_example()
    
    # Show querying capabilities
    query_examples()
    
    print("\n=== Schema Flexibility Summary ===")
    print("✓ Hospitals with specialized attributes (trauma level, beds, etc.)")
    print("✓ Emergency services with response times and coverage areas")
    print("✓ Pharmacies with licensing and service information")
    print("✓ Access metrics with travel times and barriers")
    print("✓ Service areas with population coverage")
    print("✓ Flexible JSON attributes for feature-specific data")
    print("✓ Extensible for future geographical data types")
    
    print("\n=== Future Extensions Supported ===")
    print("- Clinics and urgent care centers")
    print("- Mental health facilities")
    print("- Ambulance response zones with travel time matrices")
    print("- Public transit accessibility")
    print("- Telehealth service areas")
    print("- Mobile health units and their routes")
    print("- Specialty care referral networks")


if __name__ == "__main__":
    main()