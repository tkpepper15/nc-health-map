"""
API endpoints for county-related operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.county import County
from ..models.healthcare import HealthcareMetrics
from ..schemas.county import (
    CountyResponse, 
    CountyListResponse, 
    CountyDetailResponse,
    CountyWithMetrics,
    CountyGeoResponse
)
from sqlalchemy import func, desc, and_
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=CountyListResponse)
async def get_counties(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, le=1000, description="Number of records to return"),
    search: Optional[str] = Query(None, description="Search county names"),
    rural_only: Optional[bool] = Query(None, description="Filter to rural counties only"),
    db: Session = Depends(get_db)
):
    """
    Get list of all North Carolina counties with optional filtering.
    """
    query = db.query(County)
    
    # Apply search filter
    if search:
        query = query.filter(County.county_name.ilike(f"%{search}%"))
    
    # Apply rural filter
    if rural_only is not None:
        if rural_only:
            query = query.filter(County.rural_urban_code >= 4)
        else:
            query = query.filter(County.rural_urban_code < 4)
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    counties = query.offset(skip).limit(limit).all()
    
    return CountyListResponse(
        counties=counties,
        total_count=total_count,
        page=(skip // limit) + 1,
        page_size=limit
    )


@router.get("/{fips_code}", response_model=CountyDetailResponse)
async def get_county_by_fips(
    fips_code: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific county by FIPS code.
    """
    county = db.query(County).filter(County.fips_code == fips_code).first()
    
    if not county:
        raise HTTPException(
            status_code=404, 
            detail=f"County with FIPS code {fips_code} not found"
        )
    
    # Get current healthcare metrics
    current_metrics = db.query(HealthcareMetrics).filter(
        HealthcareMetrics.county_id == county.id
    ).order_by(desc(HealthcareMetrics.metric_date)).first()
    
    # Get metrics history summary
    metrics_count = db.query(HealthcareMetrics).filter(
        HealthcareMetrics.county_id == county.id
    ).count()
    
    first_metric = db.query(func.min(HealthcareMetrics.metric_date)).filter(
        HealthcareMetrics.county_id == county.id
    ).scalar()
    
    last_metric = db.query(func.max(HealthcareMetrics.metric_date)).filter(
        HealthcareMetrics.county_id == county.id
    ).scalar()
    
    # Convert county to response format
    county_dict = {
        "id": county.id,
        "fips_code": county.fips_code,
        "county_name": county.county_name,
        "state_code": county.state_code,
        "population_2020": county.population_2020,
        "land_area_sq_miles": county.land_area_sq_miles,
        "rural_urban_code": county.rural_urban_code,
        "metropolitan_status": county.metropolitan_status,
        "median_household_income": county.median_household_income,
        "poverty_rate": county.poverty_rate,
        "centroid_lat": county.centroid_lat,
        "centroid_lon": county.centroid_lon,
        "population_density": county.population_density,
        "county_seat": county.county_seat,
        "established_year": county.established_year,
        "is_rural": county.is_rural,
        "population_change_2010_2020": county.population_change_2010_2020,
        "metrics_history_count": metrics_count,
        "first_metric_date": first_metric.isoformat() if first_metric else None,
        "last_metric_date": last_metric.isoformat() if last_metric else None
    }
    
    # Add current metrics if available
    if current_metrics:
        county_dict["current_metrics"] = {
            "hcvi_composite": current_metrics.hcvi_composite,
            "healthcare_access_score": current_metrics.healthcare_access_score,
            "policy_risk_score": current_metrics.policy_risk_score,
            "economic_vulnerability_score": current_metrics.economic_vulnerability_score,
            "vulnerability_category": current_metrics.vulnerability_category,
            "medicaid_total_enrollment": current_metrics.medicaid_total_enrollment,
            "medicaid_enrollment_rate": current_metrics.medicaid_enrollment_rate,
            "metric_date": current_metrics.metric_date.isoformat()
        }
    
    return CountyDetailResponse(**county_dict)


@router.get("/with-metrics/", response_model=List[CountyWithMetrics])
async def get_counties_with_current_metrics(
    vulnerability_level: Optional[str] = Query(None, description="Filter by vulnerability level"),
    min_hcvi: Optional[float] = Query(None, ge=1, le=10, description="Minimum HCVI score"),
    max_hcvi: Optional[float] = Query(None, ge=1, le=10, description="Maximum HCVI score"),
    rural_only: Optional[bool] = Query(None, description="Rural counties only"),
    db: Session = Depends(get_db)
):
    """
    Get all counties with their current healthcare metrics for map visualization.
    """
    # Query counties with their latest metrics
    query = db.query(County, HealthcareMetrics).join(
        HealthcareMetrics,
        County.id == HealthcareMetrics.county_id
    )
    
    # Get latest metrics using a proper subquery
    latest_date_subquery = db.query(
        HealthcareMetrics.county_id,
        func.max(HealthcareMetrics.metric_date).label('max_date')
    ).group_by(HealthcareMetrics.county_id).subquery()
    
    query = query.join(
        latest_date_subquery,
        and_(
            HealthcareMetrics.county_id == latest_date_subquery.c.county_id,
            HealthcareMetrics.metric_date == latest_date_subquery.c.max_date
        )
    )
    
    # Apply filters
    if vulnerability_level:
        # Calculate vulnerability category from HCVI score
        if vulnerability_level == "low":
            query = query.filter(HealthcareMetrics.hcvi_composite < 4.0)
        elif vulnerability_level == "moderate":
            query = query.filter(
                HealthcareMetrics.hcvi_composite >= 4.0,
                HealthcareMetrics.hcvi_composite < 6.5
            )
        elif vulnerability_level == "high":
            query = query.filter(
                HealthcareMetrics.hcvi_composite >= 6.5,
                HealthcareMetrics.hcvi_composite < 8.5
            )
        elif vulnerability_level == "extreme":
            query = query.filter(HealthcareMetrics.hcvi_composite >= 8.5)
    
    if min_hcvi is not None:
        query = query.filter(HealthcareMetrics.hcvi_composite >= min_hcvi)
    
    if max_hcvi is not None:
        query = query.filter(HealthcareMetrics.hcvi_composite <= max_hcvi)
    
    if rural_only is not None:
        if rural_only:
            query = query.filter(County.rural_urban_code >= 4)
        else:
            query = query.filter(County.rural_urban_code < 4)
    
    results = query.all()
    
    # Transform to response format
    counties_with_metrics = []
    for county, metrics in results:
        county_data = {
            "id": county.id,
            "fips_code": county.fips_code,
            "county_name": county.county_name,
            "state_code": county.state_code,
            "population_2020": county.population_2020,
            "land_area_sq_miles": county.land_area_sq_miles,
            "rural_urban_code": county.rural_urban_code,
            "metropolitan_status": county.metropolitan_status,
            "median_household_income": county.median_household_income,
            "poverty_rate": county.poverty_rate,
            
            # Healthcare metrics
            "hcvi_composite": metrics.hcvi_composite,
            "healthcare_access_score": metrics.healthcare_access_score,
            "policy_risk_score": metrics.policy_risk_score,
            "economic_vulnerability_score": metrics.economic_vulnerability_score,
            "vulnerability_category": metrics.vulnerability_category,
            "vulnerability_color": metrics.vulnerability_color,
            
            # Medicaid metrics
            "medicaid_total_enrollment": metrics.medicaid_total_enrollment,
            "medicaid_enrollment_rate": metrics.medicaid_enrollment_rate,
            "medicaid_dependency_ratio": metrics.medicaid_dependency_ratio,
            
            # Metadata
            "metric_date": metrics.metric_date.isoformat(),
            "data_quality_score": metrics.data_completeness_score
        }
        
        counties_with_metrics.append(CountyWithMetrics(**county_data))
    
    return counties_with_metrics


@router.get("/geo/{fips_code}", response_model=CountyGeoResponse)
async def get_county_geometry(
    fips_code: str,
    db: Session = Depends(get_db)
):
    """
    Get county with geographic boundary data for mapping.
    """
    county = db.query(County).filter(County.fips_code == fips_code).first()
    
    if not county:
        raise HTTPException(
            status_code=404,
            detail=f"County with FIPS code {fips_code} not found"
        )
    
    # Convert geometry to GeoJSON format if available
    geometry = None
    if county.geometry:
        # This would need proper PostGIS to GeoJSON conversion
        # For now, return placeholder
        geometry = {
            "type": "MultiPolygon",
            "coordinates": []  # Would be populated from PostGIS
        }
    
    county_data = {
        "id": county.id,
        "fips_code": county.fips_code,
        "county_name": county.county_name,
        "state_code": county.state_code,
        "population_2020": county.population_2020,
        "land_area_sq_miles": county.land_area_sq_miles,
        "rural_urban_code": county.rural_urban_code,
        "metropolitan_status": county.metropolitan_status,
        "median_household_income": county.median_household_income,
        "poverty_rate": county.poverty_rate,
        "centroid_lat": county.centroid_lat,
        "centroid_lon": county.centroid_lon,
        "geometry": geometry
    }
    
    return CountyGeoResponse(**county_data)