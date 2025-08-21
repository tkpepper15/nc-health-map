"""
Pydantic schemas for healthcare metrics API responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class HealthcareMetricsBase(BaseModel):
    """Base healthcare metrics information."""
    metric_date: date = Field(..., description="Date of the metrics")
    data_source: str = Field(..., description="Source of the data")


class HealthcareMetricsResponse(HealthcareMetricsBase):
    """Healthcare metrics response model."""
    id: int = Field(..., description="Database ID")
    county_id: int = Field(..., description="County ID")
    
    # HCVI Scores
    hcvi_composite: Optional[float] = Field(None, description="Overall HCVI score (1-10)")
    healthcare_access_score: Optional[float] = Field(None, description="Healthcare access score")
    policy_risk_score: Optional[float] = Field(None, description="Policy risk score")
    economic_vulnerability_score: Optional[float] = Field(None, description="Economic vulnerability score")
    social_determinants_score: Optional[float] = Field(None, description="Social determinants score")
    
    # Healthcare Access
    provider_density: Optional[float] = Field(None, description="Primary care physicians per 10,000")
    specialist_density: Optional[float] = Field(None, description="Specialists per 10,000")
    avg_travel_time_hospital: Optional[float] = Field(None, description="Average travel time to hospital (minutes)")
    uninsured_rate: Optional[float] = Field(None, description="Uninsured rate percentage")
    
    # Medicaid Data
    medicaid_total_enrollment: Optional[int] = Field(None, description="Total Medicaid enrollment")
    medicaid_expansion_enrollment: Optional[int] = Field(None, description="Medicaid expansion enrollment")
    medicaid_traditional_enrollment: Optional[int] = Field(None, description="Traditional Medicaid enrollment")
    medicaid_enrollment_rate: Optional[float] = Field(None, description="Enrollment rate per 1000 population")
    medicaid_dependency_ratio: Optional[float] = Field(None, description="Enrollment / population ratio")
    
    # Policy Risk
    federal_funding_dependence: Optional[float] = Field(None, description="Federal funding dependence percentage")
    snap_participation_rate: Optional[float] = Field(None, description="SNAP participation rate")
    projected_coverage_losses: Optional[float] = Field(None, description="Projected coverage losses percentage")
    
    # Economic Vulnerability
    hospital_operating_margin: Optional[float] = Field(None, description="Hospital operating margin")
    private_equity_market_share: Optional[float] = Field(None, description="Private equity market share")
    healthcare_employment_rate: Optional[float] = Field(None, description="Healthcare employment rate")
    
    # Social Determinants
    poverty_rate: Optional[float] = Field(None, description="Poverty rate")
    food_insecurity_rate: Optional[float] = Field(None, description="Food insecurity rate")
    
    # Data Quality
    data_completeness_score: Optional[float] = Field(None, description="Data completeness (0-1)")
    is_provisional: Optional[bool] = Field(False, description="Whether data is provisional")
    
    class Config:
        from_attributes = True


class HCVIDataResponse(BaseModel):
    """Response model for map visualization data."""
    fips_code: str = Field(..., description="County FIPS code")
    county_name: str = Field(..., description="County name")
    hcvi_composite: Optional[float] = Field(None, description="HCVI composite score")
    vulnerability_category: str = Field(..., description="Vulnerability category")
    vulnerability_color: str = Field(..., description="Color code for map")
    
    # Key metrics for popup/tooltip
    policy_risk_score: Optional[float] = Field(None, description="Policy risk score")
    healthcare_access_score: Optional[float] = Field(None, description="Healthcare access score")
    economic_vulnerability_score: Optional[float] = Field(None, description="Economic vulnerability score")
    
    # Population context
    population_2020: Optional[int] = Field(None, description="2020 population")
    is_rural: bool = Field(False, description="Rural classification")
    
    # Medicaid key indicators
    medicaid_enrollment_rate: Optional[float] = Field(None, description="Medicaid enrollment rate per 1000")
    medicaid_dependency_ratio: Optional[float] = Field(None, description="Medicaid dependency ratio")
    
    # Geographic data (for mapping)
    centroid_lat: Optional[float] = Field(None, description="County centroid latitude")
    centroid_lon: Optional[float] = Field(None, description="County centroid longitude")
    geometry: Optional[Dict[str, Any]] = Field(None, description="GeoJSON geometry")


class MetricsTimeSeriesResponse(BaseModel):
    """Time series data for a specific county."""
    county_fips: str = Field(..., description="County FIPS code")
    county_name: str = Field(..., description="County name")
    metrics: List[HealthcareMetricsResponse] = Field(..., description="Historical metrics")
    
    # Summary statistics
    latest_hcvi: Optional[float] = Field(None, description="Most recent HCVI score")
    trend_direction: Optional[str] = Field(None, description="improving/declining/stable")
    data_date_range: Dict[str, str] = Field(..., description="Start and end dates of data")


class MetricsSummaryResponse(BaseModel):
    """Summary statistics across all counties."""
    total_counties: int = Field(..., description="Total number of counties")
    counties_with_data: int = Field(..., description="Counties with current data")
    
    # HCVI distribution
    hcvi_stats: Dict[str, float] = Field(..., description="HCVI score statistics")
    vulnerability_distribution: Dict[str, int] = Field(..., description="Count by vulnerability category")
    
    # Key metrics averages
    avg_policy_risk: Optional[float] = Field(None, description="Average policy risk score")
    avg_healthcare_access: Optional[float] = Field(None, description="Average healthcare access score")
    avg_economic_vulnerability: Optional[float] = Field(None, description="Average economic vulnerability")
    
    # Medicaid statistics
    total_medicaid_enrollment: Optional[int] = Field(None, description="Total statewide Medicaid enrollment")
    avg_medicaid_dependency: Optional[float] = Field(None, description="Average Medicaid dependency ratio")
    
    # Data quality
    data_quality_avg: Optional[float] = Field(None, description="Average data quality score")
    last_updated: datetime = Field(..., description="When data was last updated")


class LayerDataResponse(BaseModel):
    """Response for specific map layer data."""
    layer_name: str = Field(..., description="Name of the data layer")
    layer_description: str = Field(..., description="Description of what the layer shows")
    
    # Data for visualization
    counties: List[HCVIDataResponse] = Field(..., description="County data for the layer")
    
    # Legend information
    legend_title: str = Field(..., description="Title for map legend")
    legend_scale: Dict[str, str] = Field(..., description="Scale values and colors for legend")
    
    # Metadata
    data_date: date = Field(..., description="Date of the underlying data")
    data_source: str = Field(..., description="Source of the data")
    last_updated: datetime = Field(..., description="When this layer was last updated")