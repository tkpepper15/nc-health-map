"""
API endpoints for healthcare metrics and HCVI data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..core.database import get_db
from ..models.county import County
from ..models.healthcare import HealthcareMetrics
from ..schemas.healthcare import (
    HealthcareMetricsResponse,
    HCVIDataResponse,
    MetricsTimeSeriesResponse,
    MetricsSummaryResponse,
    LayerDataResponse
)
from sqlalchemy import func, desc, and_
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/hcvi-data", response_model=List[HCVIDataResponse])
async def get_hcvi_map_data(
    metric_date: Optional[date] = Query(None, description="Specific date for metrics"),
    include_geometry: bool = Query(False, description="Include county boundaries"),
    db: Session = Depends(get_db)
):
    """
    Get HCVI data for map visualization with county geometries.
    """
    # Build base query
    query = db.query(County, HealthcareMetrics).join(
        HealthcareMetrics,
        County.id == HealthcareMetrics.county_id
    )
    
    # Filter by date (latest if not specified)
    if metric_date:
        query = query.filter(HealthcareMetrics.metric_date == metric_date)
    else:
        # Get latest metrics for each county
        latest_date_subquery = db.query(
            HealthcareMetrics.county_id,
            func.max(HealthcareMetrics.metric_date).label('max_date')
        ).group_by(HealthcareMetrics.county_id).subquery()
        
        query = query.join(
            latest_date_subquery,
            and_(
                County.id == latest_date_subquery.c.county_id,
                HealthcareMetrics.metric_date == latest_date_subquery.c.max_date
            )
        )
    
    results = query.all()
    
    hcvi_data = []
    for county, metrics in results:
        # Convert geometry if requested
        geometry = None
        if include_geometry and county.geometry:
            # In a real implementation, you'd convert PostGIS geometry to GeoJSON
            geometry = {
                "type": "MultiPolygon",
                "coordinates": []  # Placeholder - would use PostGIS functions
            }
        
        data = HCVIDataResponse(
            fips_code=county.fips_code,
            county_name=county.county_name,
            hcvi_composite=metrics.hcvi_composite,
            vulnerability_category=metrics.vulnerability_category,
            vulnerability_color=metrics.vulnerability_color,
            policy_risk_score=metrics.policy_risk_score,
            healthcare_access_score=metrics.healthcare_access_score,
            economic_vulnerability_score=metrics.economic_vulnerability_score,
            population_2020=county.population_2020,
            is_rural=county.is_rural,
            medicaid_enrollment_rate=metrics.medicaid_enrollment_rate,
            medicaid_dependency_ratio=metrics.medicaid_dependency_ratio,
            centroid_lat=county.centroid_lat,
            centroid_lon=county.centroid_lon,
            geometry=geometry
        )
        
        hcvi_data.append(data)
    
    return hcvi_data


@router.get("/counties/{fips_code}/metrics", response_model=List[HealthcareMetricsResponse])
async def get_county_metrics_history(
    fips_code: str,
    start_date: Optional[date] = Query(None, description="Start date for metrics"),
    end_date: Optional[date] = Query(None, description="End date for metrics"),
    limit: int = Query(50, le=200, description="Maximum number of records"),
    db: Session = Depends(get_db)
):
    """
    Get healthcare metrics history for a specific county.
    """
    # Find county
    county = db.query(County).filter(County.fips_code == fips_code).first()
    if not county:
        raise HTTPException(
            status_code=404,
            detail=f"County with FIPS code {fips_code} not found"
        )
    
    # Build metrics query
    query = db.query(HealthcareMetrics).filter(
        HealthcareMetrics.county_id == county.id
    )
    
    # Apply date filters
    if start_date:
        query = query.filter(HealthcareMetrics.metric_date >= start_date)
    if end_date:
        query = query.filter(HealthcareMetrics.metric_date <= end_date)
    
    # Order by date (most recent first) and limit
    metrics = query.order_by(desc(HealthcareMetrics.metric_date)).limit(limit).all()
    
    return metrics


@router.get("/counties/{fips_code}/time-series", response_model=MetricsTimeSeriesResponse)
async def get_county_metrics_time_series(
    fips_code: str,
    metric: str = Query(..., description="Metric to track (hcvi_composite, policy_risk_score, etc.)"),
    db: Session = Depends(get_db)
):
    """
    Get time series data for a specific metric in a county.
    """
    # Find county
    county = db.query(County).filter(County.fips_code == fips_code).first()
    if not county:
        raise HTTPException(
            status_code=404,
            detail=f"County with FIPS code {fips_code} not found"
        )
    
    # Get all metrics for this county
    metrics = db.query(HealthcareMetrics).filter(
        HealthcareMetrics.county_id == county.id
    ).order_by(HealthcareMetrics.metric_date).all()
    
    if not metrics:
        raise HTTPException(
            status_code=404,
            detail=f"No metrics found for county {fips_code}"
        )
    
    # Calculate trend direction
    latest_hcvi = metrics[-1].hcvi_composite if metrics else None
    trend_direction = "stable"  # Default
    
    if len(metrics) >= 2:
        recent_scores = [m.hcvi_composite for m in metrics[-3:] if m.hcvi_composite is not None]
        if len(recent_scores) >= 2:
            if recent_scores[-1] > recent_scores[0] + 0.5:
                trend_direction = "declining"  # Higher HCVI = more vulnerable = declining
            elif recent_scores[-1] < recent_scores[0] - 0.5:
                trend_direction = "improving"
    
    return MetricsTimeSeriesResponse(
        county_fips=fips_code,
        county_name=county.county_name,
        metrics=metrics,
        latest_hcvi=latest_hcvi,
        trend_direction=trend_direction,
        data_date_range={
            "start": metrics[0].metric_date.isoformat(),
            "end": metrics[-1].metric_date.isoformat()
        }
    )


@router.get("/summary", response_model=MetricsSummaryResponse)
async def get_metrics_summary(
    metric_date: Optional[date] = Query(None, description="Date for summary (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get summary statistics for healthcare metrics across all counties.
    """
    # Get latest metrics if no date specified
    if not metric_date:
        metric_date = db.query(func.max(HealthcareMetrics.metric_date)).scalar()
        if not metric_date:
            raise HTTPException(status_code=404, detail="No metrics data found")
    
    # Get metrics for the specified date
    metrics_query = db.query(HealthcareMetrics).filter(
        HealthcareMetrics.metric_date == metric_date
    )
    
    total_counties = db.query(County).count()
    counties_with_data = metrics_query.count()
    
    # Calculate HCVI statistics
    hcvi_scores = [m.hcvi_composite for m in metrics_query.all() if m.hcvi_composite is not None]
    
    hcvi_stats = {}
    if hcvi_scores:
        hcvi_stats = {
            "mean": sum(hcvi_scores) / len(hcvi_scores),
            "min": min(hcvi_scores),
            "max": max(hcvi_scores),
            "median": sorted(hcvi_scores)[len(hcvi_scores) // 2]
        }
    
    # Calculate vulnerability distribution
    vulnerability_distribution = {
        "low": metrics_query.filter(HealthcareMetrics.hcvi_composite < 4.0).count(),
        "moderate": metrics_query.filter(
            and_(HealthcareMetrics.hcvi_composite >= 4.0, HealthcareMetrics.hcvi_composite < 6.5)
        ).count(),
        "high": metrics_query.filter(
            and_(HealthcareMetrics.hcvi_composite >= 6.5, HealthcareMetrics.hcvi_composite < 8.5)
        ).count(),
        "extreme": metrics_query.filter(HealthcareMetrics.hcvi_composite >= 8.5).count()
    }
    
    # Calculate component averages
    component_averages = db.query(
        func.avg(HealthcareMetrics.policy_risk_score),
        func.avg(HealthcareMetrics.healthcare_access_score),
        func.avg(HealthcareMetrics.economic_vulnerability_score),
        func.sum(HealthcareMetrics.medicaid_total_enrollment),
        func.avg(HealthcareMetrics.medicaid_dependency_ratio),
        func.avg(HealthcareMetrics.data_completeness_score)
    ).filter(HealthcareMetrics.metric_date == metric_date).first()
    
    return MetricsSummaryResponse(
        total_counties=total_counties,
        counties_with_data=counties_with_data,
        hcvi_stats=hcvi_stats,
        vulnerability_distribution=vulnerability_distribution,
        avg_policy_risk=component_averages[0],
        avg_healthcare_access=component_averages[1],
        avg_economic_vulnerability=component_averages[2],
        total_medicaid_enrollment=component_averages[3],
        avg_medicaid_dependency=component_averages[4],
        data_quality_avg=component_averages[5],
        last_updated=datetime.now()
    )


@router.get("/geojson")
async def get_hcvi_geojson(db: Session = Depends(get_db)):
    """
    Get HCVI data in GeoJSON format for map visualization.
    """
    # Get latest HCVI data
    hcvi_data = await get_hcvi_map_data(metric_date=None, include_geometry=False, db=db)
    
    # Create GeoJSON features
    features = []
    for county_data in hcvi_data:
        # Simple rectangular bounds for each county (placeholder geometry)
        # In production, you'd load actual county boundary data
        feature = {
            "type": "Feature",
            "properties": {
                "fips_code": county_data.fips_code,
                "county_name": county_data.county_name,
                "hcvi_composite": county_data.hcvi_composite,
                "vulnerability_category": county_data.vulnerability_category,
                "vulnerability_color": county_data.vulnerability_color,
                "policy_risk_score": county_data.policy_risk_score,
                "healthcare_access_score": county_data.healthcare_access_score,
                "economic_vulnerability_score": county_data.economic_vulnerability_score,
                "population_2020": county_data.population_2020,
                "is_rural": county_data.is_rural,
                "medicaid_enrollment_rate": county_data.medicaid_enrollment_rate,
                "medicaid_dependency_ratio": county_data.medicaid_dependency_ratio
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-84.0, 34.0], [-75.0, 34.0], [-75.0, 37.0], [-84.0, 37.0], [-84.0, 34.0]
                ]]
            }
        }
        features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson


@router.get("/layers/{layer_name}", response_model=LayerDataResponse)
async def get_layer_data(
    layer_name: str,
    metric_date: Optional[date] = Query(None, description="Date for layer data"),
    db: Session = Depends(get_db)
):
    """
    Get data for a specific map layer (policy risk, healthcare access, etc.).
    """
    # Define layer configurations
    layer_configs = {
        "policy_risk": {
            "description": "Policy risk from federal healthcare cuts and Medicaid changes",
            "metric_field": "policy_risk_score",
            "legend_title": "Policy Risk Score",
            "legend_scale": {
                "1-3": "#228B22",    # Low - Green
                "4-6": "#FFD700",    # Moderate - Yellow
                "7-8": "#FF4500",    # High - Orange
                "9-10": "#8B0000"    # Extreme - Red
            }
        },
        "healthcare_access": {
            "description": "Healthcare access including providers, hospitals, and insurance coverage",
            "metric_field": "healthcare_access_score",
            "legend_title": "Healthcare Access Score",
            "legend_scale": {
                "1-3": "#8B0000",    # Poor access - Red
                "4-6": "#FF4500",    # Limited access - Orange
                "7-8": "#FFD700",    # Good access - Yellow
                "9-10": "#228B22"    # Excellent access - Green
            }
        },
        "economic_vulnerability": {
            "description": "Economic vulnerability including hospital finances and employment",
            "metric_field": "economic_vulnerability_score",
            "legend_title": "Economic Vulnerability",
            "legend_scale": {
                "1-3": "#228B22",    # Low vulnerability - Green
                "4-6": "#FFD700",    # Moderate vulnerability - Yellow
                "7-8": "#FF4500",    # High vulnerability - Orange
                "9-10": "#8B0000"    # Extreme vulnerability - Red
            }
        },
        "hcvi_composite": {
            "description": "Overall Healthcare Vulnerability Index combining all components",
            "metric_field": "hcvi_composite",
            "legend_title": "HCVI Composite Score",
            "legend_scale": {
                "1-3": "#228B22",    # Low vulnerability - Green
                "4-6": "#FFD700",    # Moderate vulnerability - Yellow
                "7-8": "#FF4500",    # High vulnerability - Orange
                "9-10": "#8B0000"    # Extreme vulnerability - Red
            }
        }
    }
    
    if layer_name not in layer_configs:
        raise HTTPException(
            status_code=404,
            detail=f"Layer '{layer_name}' not found. Available layers: {list(layer_configs.keys())}"
        )
    
    layer_config = layer_configs[layer_name]
    
    # Get HCVI data (reuse the existing endpoint logic)
    hcvi_data = await get_hcvi_map_data(metric_date=metric_date, include_geometry=False, db=db)
    
    # Get the actual metric date used
    if not metric_date:
        metric_date = db.query(func.max(HealthcareMetrics.metric_date)).scalar()
    
    return LayerDataResponse(
        layer_name=layer_name,
        layer_description=layer_config["description"],
        counties=hcvi_data,
        legend_title=layer_config["legend_title"],
        legend_scale=layer_config["legend_scale"],
        data_date=metric_date,
        data_source="NC_DHHS_Medicaid",
        last_updated=datetime.now()
    )