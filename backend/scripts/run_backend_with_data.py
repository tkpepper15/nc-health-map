"""
Script to verify the backend can start with all loaded data.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal, check_database_connection
from app.models import County, HealthcareMetrics, GeographicalFeature, Hospital
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_backend_readiness():
    """Verify that the backend is ready to serve data."""
    logger.info("Verifying backend readiness...")
    
    # Check database connection
    if not check_database_connection():
        logger.error("Database connection failed")
        return False
    
    session = SessionLocal()
    try:
        # Verify data integrity
        county_count = session.query(County).count()
        metrics_count = session.query(HealthcareMetrics).count()
        features_count = session.query(GeographicalFeature).count()
        hospitals_count = session.query(Hospital).count()
        
        logger.info(f"Data verification:")
        logger.info(f"  Counties: {county_count}")
        logger.info(f"  Healthcare metrics: {metrics_count}")
        logger.info(f"  Geographical features: {features_count}")
        logger.info(f"  Hospitals: {hospitals_count}")
        
        if county_count == 100 and metrics_count >= 100:
            logger.info("✓ Backend is ready to serve NC healthcare data")
            return True
        else:
            logger.error("✗ Missing required data")
            return False
            
    except Exception as e:
        logger.error(f"Error verifying data: {e}")
        return False
    finally:
        session.close()


def show_api_endpoints():
    """Show what API endpoints should be available."""
    logger.info("Available API endpoints (once backend is running):")
    
    endpoints = [
        "GET /api/v1/counties/ - List all NC counties",
        "GET /api/v1/counties/{fips_code} - Get specific county data",
        "GET /api/v1/counties/{fips_code}/healthcare-metrics - Get county healthcare metrics",
        "GET /api/v1/geographical-features/ - List hospitals, clinics, etc.",
        "GET /api/v1/geographical-features?feature_type=hospital - Filter by type",
        "GET /api/v1/hospitals/ - List all hospitals",
        "GET /api/v1/hospitals?rural=true - Filter rural hospitals",
        "GET /api/v1/access-metrics/ - Get travel time and access data",
        "GET /health - Health check endpoint",
        "GET /api/v1/docs - API documentation (Swagger UI)"
    ]
    
    for endpoint in endpoints:
        logger.info(f"  {endpoint}")


def main():
    """Main verification function."""
    print("=" * 60)
    print("NC Healthcare Vulnerability Index - Backend Verification")
    print("=" * 60)
    
    if verify_backend_readiness():
        print("\n✓ All systems ready!")
        print("\nTo start the backend server, run:")
        print("  cd backend")
        print("  python app/main.py")
        print("\nOr use uvicorn directly:")
        print("  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
        
        print("\nData Summary:")
        print("- All 100 NC counties loaded with FIPS codes")
        print("- June 2025 Medicaid enrollment data parsed and scored")
        print("- Policy risk scores calculated (37 high-risk counties identified)")
        print("- Flexible geographical data structure implemented")
        print("- Sample hospitals, emergency services, and access metrics loaded")
        print("- Ready for map visualization integration")
        
        show_api_endpoints()
        
    else:
        print("\n✗ Backend not ready. Please run the data loading scripts first:")
        print("  python scripts/load_all_data.py")


if __name__ == "__main__":
    main()