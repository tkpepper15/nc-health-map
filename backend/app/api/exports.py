"""
API endpoints for data export functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import pandas as pd
import json
import io
import uuid
from ..core.database import get_db
from ..models.county import County
from ..models.healthcare import HealthcareMetrics
from ..schemas.exports import (
    ExportRequest,
    ExportResponse,
    ExportFormat,
    ExportDataType,
    ExportJobStatus
)
from sqlalchemy import and_
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/request", response_model=ExportResponse)
async def request_export(
    export_request: ExportRequest,
    db: Session = Depends(get_db)
):
    """
    Request a data export. For simple exports, returns immediately.
    For complex exports, returns a job ID for status tracking.
    """
    export_id = str(uuid.uuid4())
    
    try:
        # Generate the export data
        export_data = await _generate_export_data(export_request, db)
        
        # Create the file
        file_name, file_content = await _create_export_file(export_data, export_request)
        
        # For now, return immediately with completed status
        # In production, you might store the file and return a download URL
        response = ExportResponse(
            export_id=export_id,
            status="completed",
            file_name=file_name,
            file_size=len(file_content) if isinstance(file_content, bytes) else len(file_content.encode()),
            data_type=export_request.data_type,
            format=export_request.format,
            record_count=len(export_data),
            column_count=len(export_data.columns) if hasattr(export_data, 'columns') else 0,
            requested_at=datetime.now(),
            completed_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=7),
            filters_applied=_get_applied_filters(export_request)
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        return ExportResponse(
            export_id=export_id,
            status="failed",
            file_name="",
            data_type=export_request.data_type,
            format=export_request.format,
            requested_at=datetime.now(),
            error_message=str(e),
            filters_applied=_get_applied_filters(export_request)
        )


@router.get("/download/{export_format}/{data_type}")
async def download_export(
    export_format: ExportFormat,
    data_type: ExportDataType,
    counties: Optional[str] = None,  # Comma-separated FIPS codes
    vulnerability_categories: Optional[str] = None,  # Comma-separated categories
    rural_only: Optional[bool] = None,
    include_geometry: bool = False,
    db: Session = Depends(get_db)
):
    """
    Direct download endpoint for simple exports without job tracking.
    """
    # Create export request from query parameters
    export_request = ExportRequest(
        data_type=data_type,
        format=export_format,
        counties=counties.split(',') if counties else None,
        vulnerability_categories=vulnerability_categories.split(',') if vulnerability_categories else None,
        rural_only=rural_only,
        include_geometry=include_geometry
    )
    
    try:
        # Generate export data
        export_data = await _generate_export_data(export_request, db)
        
        # Create file content
        file_name, file_content = await _create_export_file(export_data, export_request)
        
        # Determine media type
        media_types = {
            ExportFormat.CSV: "text/csv",
            ExportFormat.EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ExportFormat.JSON: "application/json",
            ExportFormat.GEOJSON: "application/geo+json"
        }
        
        media_type = media_types.get(export_format, "application/octet-stream")
        
        # Return file as streaming response
        if isinstance(file_content, str):
            file_content = file_content.encode()
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )
        
    except Exception as e:
        logger.error(f"Direct export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_export_data(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Generate the data for export based on request parameters."""
    
    if export_request.data_type == ExportDataType.COUNTIES:
        return await _export_counties_data(export_request, db)
    elif export_request.data_type == ExportDataType.HEALTHCARE_METRICS:
        return await _export_healthcare_metrics(export_request, db)
    elif export_request.data_type == ExportDataType.HCVI_SCORES:
        return await _export_hcvi_scores(export_request, db)
    elif export_request.data_type == ExportDataType.MEDICAID_DATA:
        return await _export_medicaid_data(export_request, db)
    elif export_request.data_type == ExportDataType.FULL_DATASET:
        return await _export_full_dataset(export_request, db)
    else:
        raise ValueError(f"Unsupported data type: {export_request.data_type}")


async def _export_counties_data(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Export basic county information."""
    query = db.query(County)
    
    # Apply filters
    if export_request.counties:
        query = query.filter(County.fips_code.in_(export_request.counties))
    
    if export_request.rural_only is not None:
        if export_request.rural_only:
            query = query.filter(County.rural_urban_code >= 4)
        else:
            query = query.filter(County.rural_urban_code < 4)
    
    counties = query.all()
    
    # Convert to DataFrame
    data = []
    for county in counties:
        row = {
            'fips_code': county.fips_code,
            'county_name': county.county_name,
            'state_code': county.state_code,
            'population_2020': county.population_2020,
            'land_area_sq_miles': county.land_area_sq_miles,
            'population_density': county.population_density,
            'rural_urban_code': county.rural_urban_code,
            'metropolitan_status': county.metropolitan_status,
            'median_household_income': county.median_household_income,
            'poverty_rate': county.poverty_rate,
            'county_seat': county.county_seat,
            'is_rural': county.is_rural
        }
        
        if export_request.include_geometry:
            row['centroid_lat'] = county.centroid_lat
            row['centroid_lon'] = county.centroid_lon
            # Note: Full geometry would need PostGIS conversion
        
        data.append(row)
    
    return pd.DataFrame(data)


async def _export_healthcare_metrics(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Export healthcare metrics data."""
    query = db.query(HealthcareMetrics, County).join(County)
    
    # Apply filters
    if export_request.counties:
        query = query.filter(County.fips_code.in_(export_request.counties))
    
    if export_request.date_range:
        if 'start' in export_request.date_range:
            query = query.filter(HealthcareMetrics.metric_date >= export_request.date_range['start'])
        if 'end' in export_request.date_range:
            query = query.filter(HealthcareMetrics.metric_date <= export_request.date_range['end'])
    
    if export_request.vulnerability_categories:
        # Filter by HCVI score ranges corresponding to categories
        category_filters = []
        for category in export_request.vulnerability_categories:
            if category == "low":
                category_filters.append(HealthcareMetrics.hcvi_composite < 4.0)
            elif category == "moderate":
                category_filters.append(and_(
                    HealthcareMetrics.hcvi_composite >= 4.0,
                    HealthcareMetrics.hcvi_composite < 6.5
                ))
            elif category == "high":
                category_filters.append(and_(
                    HealthcareMetrics.hcvi_composite >= 6.5,
                    HealthcareMetrics.hcvi_composite < 8.5
                ))
            elif category == "extreme":
                category_filters.append(HealthcareMetrics.hcvi_composite >= 8.5)
        
        if category_filters:
            from sqlalchemy import or_
            query = query.filter(or_(*category_filters))
    
    results = query.all()
    
    # Convert to DataFrame
    data = []
    for metrics, county in results:
        row = {
            'fips_code': county.fips_code,
            'county_name': county.county_name,
            'metric_date': metrics.metric_date,
            'data_source': metrics.data_source,
            'hcvi_composite': metrics.hcvi_composite,
            'healthcare_access_score': metrics.healthcare_access_score,
            'policy_risk_score': metrics.policy_risk_score,
            'economic_vulnerability_score': metrics.economic_vulnerability_score,
            'vulnerability_category': metrics.vulnerability_category,
            'provider_density': metrics.provider_density,
            'uninsured_rate': metrics.uninsured_rate,
            'medicaid_total_enrollment': metrics.medicaid_total_enrollment,
            'medicaid_enrollment_rate': metrics.medicaid_enrollment_rate,
            'medicaid_dependency_ratio': metrics.medicaid_dependency_ratio,
            'poverty_rate': metrics.poverty_rate,
            'data_completeness_score': metrics.data_completeness_score
        }
        data.append(row)
    
    return pd.DataFrame(data)


async def _export_hcvi_scores(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Export simplified HCVI scores for analysis."""
    # Get latest metrics for each county
    latest_metrics = db.query(HealthcareMetrics, County).join(County).filter(
        HealthcareMetrics.metric_date == db.query(
            db.query(HealthcareMetrics.metric_date.label('max_date'))
            .filter(HealthcareMetrics.county_id == County.id)
            .order_by(HealthcareMetrics.metric_date.desc())
            .limit(1)
            .subquery().c.max_date
        )
    )
    
    # Apply county filters
    if export_request.counties:
        latest_metrics = latest_metrics.filter(County.fips_code.in_(export_request.counties))
    
    if export_request.rural_only is not None:
        if export_request.rural_only:
            latest_metrics = latest_metrics.filter(County.rural_urban_code >= 4)
        else:
            latest_metrics = latest_metrics.filter(County.rural_urban_code < 4)
    
    results = latest_metrics.all()
    
    data = []
    for metrics, county in results:
        row = {
            'fips_code': county.fips_code,
            'county_name': county.county_name,
            'population_2020': county.population_2020,
            'is_rural': county.is_rural,
            'hcvi_composite': metrics.hcvi_composite,
            'healthcare_access_score': metrics.healthcare_access_score,
            'policy_risk_score': metrics.policy_risk_score,
            'economic_vulnerability_score': metrics.economic_vulnerability_score,
            'vulnerability_category': metrics.vulnerability_category,
            'metric_date': metrics.metric_date
        }
        data.append(row)
    
    return pd.DataFrame(data)


async def _export_medicaid_data(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Export Medicaid-specific data."""
    query = db.query(HealthcareMetrics, County).join(County)
    
    # Apply filters (reuse healthcare metrics filtering)
    # ... (similar filtering logic as healthcare metrics)
    
    results = query.all()
    
    data = []
    for metrics, county in results:
        row = {
            'fips_code': county.fips_code,
            'county_name': county.county_name,
            'population_2020': county.population_2020,
            'metric_date': metrics.metric_date,
            'medicaid_total_enrollment': metrics.medicaid_total_enrollment,
            'medicaid_expansion_enrollment': metrics.medicaid_expansion_enrollment,
            'medicaid_traditional_enrollment': metrics.medicaid_traditional_enrollment,
            'medicaid_enrollment_rate': metrics.medicaid_enrollment_rate,
            'medicaid_dependency_ratio': metrics.medicaid_dependency_ratio,
            'policy_risk_score': metrics.policy_risk_score,
            'vulnerability_category': metrics.vulnerability_category
        }
        data.append(row)
    
    return pd.DataFrame(data)


async def _export_full_dataset(export_request: ExportRequest, db: Session) -> pd.DataFrame:
    """Export complete dataset with all available fields."""
    # This would be a comprehensive export combining all data
    # For brevity, reusing the healthcare metrics export
    return await _export_healthcare_metrics(export_request, db)


async def _create_export_file(data: pd.DataFrame, export_request: ExportRequest) -> tuple[str, bytes]:
    """Create the export file in the requested format."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base_name = f"nc_healthcare_{export_request.data_type.value}_{timestamp}"
    
    if export_request.format == ExportFormat.CSV:
        file_name = f"{base_name}.csv"
        content = data.to_csv(index=False).encode()
    
    elif export_request.format == ExportFormat.EXCEL:
        file_name = f"{base_name}.xlsx"
        buffer = io.BytesIO()
        data.to_excel(buffer, index=False, engine='openpyxl')
        content = buffer.getvalue()
    
    elif export_request.format == ExportFormat.JSON:
        file_name = f"{base_name}.json"
        content = data.to_json(orient='records', date_format='iso').encode()
    
    elif export_request.format == ExportFormat.GEOJSON:
        file_name = f"{base_name}.geojson"
        # Convert to GeoJSON format
        # This is a simplified implementation
        features = []
        for _, row in data.iterrows():
            feature = {
                "type": "Feature",
                "properties": row.to_dict(),
                "geometry": {
                    "type": "Point",
                    "coordinates": [row.get('centroid_lon', 0), row.get('centroid_lat', 0)]
                }
            }
            features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        content = json.dumps(geojson, indent=2).encode()
    
    else:
        raise ValueError(f"Unsupported export format: {export_request.format}")
    
    return file_name, content


def _get_applied_filters(export_request: ExportRequest) -> dict:
    """Extract applied filters for the response."""
    filters = {}
    
    if export_request.counties:
        filters['counties'] = export_request.counties
    if export_request.date_range:
        filters['date_range'] = export_request.date_range
    if export_request.vulnerability_categories:
        filters['vulnerability_categories'] = export_request.vulnerability_categories
    if export_request.rural_only is not None:
        filters['rural_only'] = export_request.rural_only
    
    return filters