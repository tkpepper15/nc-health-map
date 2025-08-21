"""
Pydantic schemas for county-related API responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class CountyBase(BaseModel):
    """Base county information."""
    fips_code: str = Field(..., description="5-digit FIPS code")
    county_name: str = Field(..., description="County name")
    state_code: str = Field(default="NC", description="State code")


class CountyResponse(CountyBase):
    """Basic county response with geographic and demographic data."""
    id: int = Field(..., description="Database ID")
    population_2020: Optional[int] = Field(None, description="2020 Census population")
    land_area_sq_miles: Optional[float] = Field(None, description="Land area in square miles")
    rural_urban_code: Optional[int] = Field(None, description="USDA Rural-Urban Continuum Code")
    metropolitan_status: Optional[str] = Field(None, description="Metro/micro/rural classification")
    median_household_income: Optional[float] = Field(None, description="Median household income")
    poverty_rate: Optional[float] = Field(None, description="Poverty rate percentage")
    
    class Config:
        from_attributes = True


class CountyGeoResponse(CountyResponse):
    """County response with geometric data for mapping."""
    centroid_lat: Optional[float] = Field(None, description="County centroid latitude")
    centroid_lon: Optional[float] = Field(None, description="County centroid longitude")
    geometry: Optional[Dict[str, Any]] = Field(None, description="GeoJSON geometry")


class CountyWithMetrics(CountyResponse):
    """County with current healthcare metrics."""
    hcvi_composite: Optional[float] = Field(None, description="Overall HCVI score (1-10)")
    healthcare_access_score: Optional[float] = Field(None, description="Healthcare access component")
    policy_risk_score: Optional[float] = Field(None, description="Policy risk component")
    economic_vulnerability_score: Optional[float] = Field(None, description="Economic vulnerability component")
    vulnerability_category: Optional[str] = Field(None, description="Risk category (low/moderate/high/extreme)")
    vulnerability_color: Optional[str] = Field(None, description="Color code for visualization")
    
    # Key Medicaid metrics
    medicaid_total_enrollment: Optional[int] = Field(None, description="Total Medicaid enrollment")
    medicaid_enrollment_rate: Optional[float] = Field(None, description="Medicaid enrollment per 1000 population")
    medicaid_dependency_ratio: Optional[float] = Field(None, description="Medicaid enrollment / population")
    
    # Data metadata
    metric_date: Optional[str] = Field(None, description="Date of metrics data")
    data_quality_score: Optional[float] = Field(None, description="Data quality score (0-1)")


class CountyListResponse(BaseModel):
    """Response for county list endpoints."""
    counties: list[CountyResponse]
    total_count: int
    page: int = 1
    page_size: int = 100


class CountyDetailResponse(CountyGeoResponse):
    """Detailed county information with full metrics history."""
    population_density: Optional[float] = Field(None, description="Population per square mile")
    county_seat: Optional[str] = Field(None, description="County seat city")
    established_year: Optional[int] = Field(None, description="Year county was established")
    is_rural: bool = Field(False, description="Whether county is classified as rural")
    population_change_2010_2020: Optional[float] = Field(None, description="Population change percentage")
    
    # Current metrics
    current_metrics: Optional[Dict[str, Any]] = Field(None, description="Most recent healthcare metrics")
    
    # Historical data summary
    metrics_history_count: int = Field(0, description="Number of historical metrics records")
    first_metric_date: Optional[str] = Field(None, description="Earliest metrics date")
    last_metric_date: Optional[str] = Field(None, description="Latest metrics date")