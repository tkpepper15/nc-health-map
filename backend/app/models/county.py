"""
County model for storing North Carolina geographic and demographic data.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
# from geoalchemy2 import Geometry  # Commented out for SQLite compatibility
from datetime import datetime
from ..core.database import Base


class County(Base):
    __tablename__ = "counties"
    
    # Primary identifiers
    id = Column(Integer, primary_key=True, index=True)
    fips_code = Column(String(5), unique=True, nullable=False, index=True)
    county_name = Column(String(100), nullable=False)
    state_code = Column(String(2), default='NC', nullable=False)
    
    # Geographic data (simplified for SQLite)
    # geometry = Column(Geometry('MULTIPOLYGON', 4326))  # WGS84 coordinate system
    centroid_lat = Column(Float)
    centroid_lon = Column(Float)
    
    # Demographic data
    population_2020 = Column(Integer)
    population_2010 = Column(Integer) 
    land_area_sq_miles = Column(Float)
    water_area_sq_miles = Column(Float)
    population_density = Column(Float)  # Per square mile
    
    # Classification
    rural_urban_code = Column(Integer)  # USDA Rural-Urban Continuum Code (1-9)
    metropolitan_status = Column(String(20))  # 'metro', 'micro', 'rural'
    
    # Economic indicators (from Census)
    median_household_income = Column(Float)
    poverty_rate = Column(Float)
    unemployment_rate = Column(Float)
    
    # Administrative
    county_seat = Column(String(100))
    established_year = Column(Integer)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_quality_score = Column(Float)  # 0-1 scale for data completeness
    notes = Column(Text)
    
    # Relationships
    healthcare_metrics = relationship("HealthcareMetrics", back_populates="county", cascade="all, delete-orphan")
    geographical_features = relationship("GeographicalFeature", back_populates="county", cascade="all, delete-orphan")
    access_metrics_as_origin = relationship("AccessMetric", foreign_keys="AccessMetric.origin_county_id")
    
    def __repr__(self):
        return f"<County(fips='{self.fips_code}', name='{self.county_name}')>"
    
    @property
    def display_name(self) -> str:
        """Get formatted display name."""
        return f"{self.county_name}, {self.state_code}"
    
    @property
    def is_rural(self) -> bool:
        """Determine if county is rural based on USDA classification."""
        # RUCC codes 4-9 are considered rural
        return self.rural_urban_code is not None and self.rural_urban_code >= 4
    
    @property
    def population_change_2010_2020(self) -> float:
        """Calculate population change percentage 2010-2020."""
        if self.population_2010 and self.population_2020:
            return ((self.population_2020 - self.population_2010) / self.population_2010) * 100
        return 0.0