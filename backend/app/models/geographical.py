"""
Geographical models for flexible location-based data storage.
Supports hospitals, access zones, transportation networks, and other geographical features.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
from ..core.database import Base


class GeographicalFeature(Base):
    """
    Base model for any geographical feature (hospitals, clinics, service areas, etc.).
    Flexible design to accommodate various types of location-based data.
    """
    __tablename__ = "geographical_features"
    
    # Primary identifiers
    id = Column(Integer, primary_key=True, index=True)
    feature_type = Column(String(50), nullable=False, index=True)  # 'hospital', 'clinic', 'pharmacy', 'access_zone', etc.
    feature_subtype = Column(String(50), index=True)  # 'rural_hospital', 'critical_access', 'trauma_center', etc.
    external_id = Column(String(100), index=True)  # CMS ID, NPI, etc.
    
    # Basic information
    name = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(50), default='active')  # 'active', 'closed', 'at_risk', 'planned', etc.
    
    # Location data (simplified for SQLite, can be enhanced for PostGIS)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(2), default='NC')
    zip_code = Column(String(10))
    county_id = Column(Integer, ForeignKey('counties.id'), index=True)
    
    # Coordinates
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Service area and accessibility
    service_radius_miles = Column(Float)  # Primary service area
    extended_service_radius_miles = Column(Float)  # Extended catchment area
    
    # Flexible attributes stored as JSON
    # This allows for feature-specific data without rigid schema
    attributes = Column(JSON)  # Flexible key-value storage
    
    # Operational data
    established_date = Column(DateTime)
    closure_date = Column(DateTime)  # If facility closed
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Data source and quality
    data_source = Column(String(100))
    data_version = Column(String(50))
    data_quality_score = Column(Float)  # 0-1 scale
    verification_status = Column(String(50), default='unverified')  # 'verified', 'unverified', 'disputed'
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(100))
    notes = Column(Text)
    
    # Relationships
    county = relationship("County", back_populates="geographical_features")
    access_metrics = relationship("AccessMetric", back_populates="destination_feature")
    
    def __repr__(self):
        return f"<GeographicalFeature(type='{self.feature_type}', name='{self.name}', county_id={self.county_id})>"
    
    @hybrid_property
    def coordinates(self) -> Optional[Dict[str, float]]:
        """Get coordinates as a dictionary."""
        if self.latitude is not None and self.longitude is not None:
            return {"lat": self.latitude, "lng": self.longitude}
        return None
    
    @coordinates.setter
    def coordinates(self, value: Dict[str, float]):
        """Set coordinates from a dictionary."""
        if value and isinstance(value, dict):
            self.latitude = value.get('lat')
            self.longitude = value.get('lng')
    
    def get_attribute(self, key: str, default: Any = None) -> Any:
        """Get a value from the flexible attributes JSON."""
        if self.attributes and isinstance(self.attributes, dict):
            return self.attributes.get(key, default)
        return default
    
    def set_attribute(self, key: str, value: Any) -> None:
        """Set a value in the flexible attributes JSON."""
        if self.attributes is None:
            self.attributes = {}
        elif not isinstance(self.attributes, dict):
            self.attributes = {}
        
        self.attributes[key] = value
    
    def update_attributes(self, new_attributes: Dict[str, Any]) -> None:
        """Update multiple attributes at once."""
        if self.attributes is None:
            self.attributes = {}
        elif not isinstance(self.attributes, dict):
            self.attributes = {}
        
        self.attributes.update(new_attributes)
    
    @property
    def is_hospital(self) -> bool:
        """Check if this feature is a hospital."""
        return self.feature_type == 'hospital'
    
    @property
    def is_active(self) -> bool:
        """Check if this feature is currently active."""
        return self.status == 'active'
    
    @property
    def is_rural(self) -> bool:
        """Check if this feature serves a rural area (based on county)."""
        return self.county and self.county.is_rural if self.county else False


class AccessMetric(Base):
    """
    Model for storing access metrics between geographical points.
    Supports travel time, distance, and accessibility calculations.
    """
    __tablename__ = "access_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Origin and destination
    origin_county_id = Column(Integer, ForeignKey('counties.id'), nullable=False, index=True)
    destination_feature_id = Column(Integer, ForeignKey('geographical_features.id'), nullable=False, index=True)
    
    # Access measurements
    travel_time_minutes = Column(Float)  # Driving time
    travel_distance_miles = Column(Float)  # Driving distance
    straight_line_distance_miles = Column(Float)  # As the crow flies
    
    # Alternative access methods
    public_transit_time_minutes = Column(Float)
    walking_time_minutes = Column(Float)
    
    # Accessibility scores (1-10 scale)
    overall_accessibility_score = Column(Float)
    emergency_accessibility_score = Column(Float)  # For emergency services
    routine_accessibility_score = Column(Float)  # For routine care
    
    # Conditions and context
    transportation_barriers = Column(JSON)  # List of barriers: ['poor_roads', 'no_public_transit', 'weather_dependent']
    population_served = Column(Integer)  # Population in this catchment area
    is_primary_service_area = Column(Boolean, default=False)
    
    # Data source and quality
    calculation_method = Column(String(100))  # 'google_maps', 'osrm', 'manual_estimate'
    data_date = Column(DateTime)
    confidence_level = Column(Float)  # 0-1 scale
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    origin_county = relationship("County", foreign_keys=[origin_county_id], overlaps="access_metrics_as_origin")
    destination_feature = relationship("GeographicalFeature", back_populates="access_metrics")
    
    def __repr__(self):
        return f"<AccessMetric(origin_county_id={self.origin_county_id}, destination_feature_id={self.destination_feature_id}, travel_time={self.travel_time_minutes})>"
    
    @property
    def is_reasonable_access(self) -> bool:
        """Determine if this represents reasonable access (< 30 minutes for routine care)."""
        return self.travel_time_minutes is not None and self.travel_time_minutes <= 30
    
    @property
    def access_category(self) -> str:
        """Categorize access level based on travel time."""
        if self.travel_time_minutes is None:
            return "unknown"
        elif self.travel_time_minutes <= 15:
            return "excellent"
        elif self.travel_time_minutes <= 30:
            return "good"
        elif self.travel_time_minutes <= 60:
            return "moderate"
        else:
            return "poor"


class ServiceArea(Base):
    """
    Model for defining service catchment areas and health service regions.
    """
    __tablename__ = "service_areas"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Area definition
    area_name = Column(String(200), nullable=False)
    area_type = Column(String(50), nullable=False)  # 'hospital_catchment', 'health_district', 'emergency_zone'
    description = Column(Text)
    
    # Geographic bounds (simplified polygon representation)
    center_latitude = Column(Float)
    center_longitude = Column(Float)
    radius_miles = Column(Float)  # For circular areas
    
    # Complex geometry (for future PostGIS upgrade)
    # geometry = Column(Geometry('POLYGON', 4326))  # Can be added later
    boundary_points = Column(JSON)  # Store polygon points as JSON for now
    
    # Service characteristics
    primary_services = Column(JSON)  # List of primary services offered
    service_level = Column(String(50))  # 'basic', 'comprehensive', 'specialized'
    population_served = Column(Integer)
    
    # Associated features
    primary_facility_id = Column(Integer, ForeignKey('geographical_features.id'))
    
    # Accessibility metrics
    avg_travel_time_minutes = Column(Float)
    max_travel_time_minutes = Column(Float)
    coverage_percentage = Column(Float)  # % of area population with reasonable access
    
    # Administrative
    managing_organization = Column(String(200))
    contact_info = Column(JSON)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_source = Column(String(100))
    
    # Relationships
    primary_facility = relationship("GeographicalFeature", foreign_keys=[primary_facility_id])
    
    def __repr__(self):
        return f"<ServiceArea(name='{self.area_name}', type='{self.area_type}', population={self.population_served})>"


# Update the County model to include the new relationships
def update_county_relationships():
    """
    This function documents the relationship updates needed in the County model.
    Add this to the County class:
    
    # In County model, add:
    geographical_features = relationship("GeographicalFeature", back_populates="county")
    access_metrics_as_origin = relationship("AccessMetric", foreign_keys="AccessMetric.origin_county_id")
    """
    pass


# Specialized hospital model that extends GeographicalFeature
class Hospital(Base):
    """
    Specialized model for hospital-specific data.
    Extends the flexible GeographicalFeature with hospital-specific fields.
    """
    __tablename__ = "hospitals"
    
    id = Column(Integer, primary_key=True, index=True)
    feature_id = Column(Integer, ForeignKey('geographical_features.id'), nullable=False, unique=True)
    
    # Hospital-specific identifiers
    cms_certification_number = Column(String(20), unique=True, index=True)
    npi_number = Column(String(20))
    medicare_provider_id = Column(String(20))
    
    # Hospital classification
    hospital_type = Column(String(50))  # 'general_acute', 'critical_access', 'specialty', 'psychiatric'
    ownership_type = Column(String(50))  # 'public', 'private_nonprofit', 'private_for_profit', 'government'
    network_affiliation = Column(String(200))
    
    # Capacity and services
    total_beds = Column(Integer)
    icu_beds = Column(Integer)
    emergency_services = Column(Boolean, default=True)
    trauma_level = Column(String(10))  # 'I', 'II', 'III', 'IV', or null
    
    # Specialty services (stored as JSON for flexibility)
    specialty_services = Column(JSON)  # ['cardiology', 'oncology', 'neurology', etc.]
    
    # Financial and operational data
    operating_margin = Column(Float)  # Percentage
    total_revenue = Column(Float)
    medicaid_revenue_percentage = Column(Float)
    medicare_revenue_percentage = Column(Float)
    
    # Risk indicators
    closure_risk_score = Column(Float)  # 1-10 scale
    financial_distress_indicators = Column(JSON)  # List of warning signs
    
    # Quality metrics
    cms_overall_rating = Column(Integer)  # 1-5 stars
    safety_rating = Column(String(10))  # 'A', 'B', 'C', 'D', 'F'
    patient_satisfaction_score = Column(Float)
    
    # Rural designation
    rural_designation = Column(String(50))  # 'critical_access', 'sole_community', 'rural_referral_center'
    
    # Metadata
    last_financial_update = Column(DateTime)
    last_service_update = Column(DateTime)
    
    # Relationships
    geographical_feature = relationship("GeographicalFeature", foreign_keys=[feature_id])
    
    def __repr__(self):
        return f"<Hospital(cms_id='{self.cms_certification_number}', type='{self.hospital_type}', beds={self.total_beds})>"
    
    @property
    def is_critical_access(self) -> bool:
        """Check if this is a Critical Access Hospital."""
        return self.hospital_type == 'critical_access' or self.rural_designation == 'critical_access'
    
    @property
    def is_at_risk(self) -> bool:
        """Check if hospital is at closure risk."""
        return self.closure_risk_score is not None and self.closure_risk_score >= 7.0
    
    @property
    def has_trauma_services(self) -> bool:
        """Check if hospital provides trauma services."""
        return self.trauma_level is not None
    
    def get_specialty_services(self) -> List[str]:
        """Get list of specialty services offered."""
        if self.specialty_services and isinstance(self.specialty_services, list):
            return self.specialty_services
        return []
    
    def add_specialty_service(self, service: str) -> None:
        """Add a specialty service to the hospital."""
        services = self.get_specialty_services()
        if service not in services:
            services.append(service)
            self.specialty_services = services