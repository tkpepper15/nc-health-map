"""
Healthcare metrics model for storing HCVI data and related health indicators.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, date
from ..core.database import Base


class HealthcareMetrics(Base):
    __tablename__ = "healthcare_metrics"
    
    # Primary identifiers
    id = Column(Integer, primary_key=True, index=True)
    county_id = Column(Integer, ForeignKey('counties.id'), nullable=False, index=True)
    metric_date = Column(Date, nullable=False, index=True)
    data_source = Column(String(100), nullable=False)
    data_version = Column(String(50))
    
    # HCVI Composite Scores (1-10 scale)
    hcvi_composite = Column(Float)  # Overall Healthcare Vulnerability Index
    healthcare_access_score = Column(Float)  # 33% weight
    policy_risk_score = Column(Float)  # 33% weight
    economic_vulnerability_score = Column(Float)  # 34% weight
    social_determinants_score = Column(Float)  # Additional component
    
    # Healthcare Access Metrics
    provider_density = Column(Float)  # Primary care physicians per 10,000 residents
    specialist_density = Column(Float)  # Specialists per 10,000 residents
    hospital_beds_per_capita = Column(Float)  # Hospital beds per 1,000 residents
    avg_travel_time_hospital = Column(Float)  # Minutes to nearest hospital
    specialty_services_score = Column(Float)  # 1-10 availability score
    uninsured_rate = Column(Float)  # Percentage uninsured
    underinsured_rate = Column(Float)  # Percentage underinsured
    provider_shortage_designation = Column(Boolean)  # HRSA shortage area
    
    # Medicaid Data (Primary focus for initial implementation)
    medicaid_total_enrollment = Column(Integer)
    medicaid_expansion_enrollment = Column(Integer)
    medicaid_traditional_enrollment = Column(Integer)
    medicaid_enrollment_rate = Column(Float)  # Per 1000 population
    medicaid_dependency_ratio = Column(Float)  # Total enrollment / population
    medicaid_expansion_ratio = Column(Float)  # Expansion / total enrollment
    
    # Detailed Medicaid Categories (Traditional Medicaid)
    medicaid_aged = Column(Integer)  # AGED
    medicaid_blind = Column(Integer)  # BLIND
    medicaid_disabled = Column(Integer)  # DISABLED
    medicaid_tanf_under_21 = Column(Integer)  # TANF (AFDC) UNDER 21
    medicaid_tanf_21_and_over = Column(Integer)  # TANF (AFDC) 21 AND OVER
    medicaid_other_child = Column(Integer)  # OTHER CHILD
    medicaid_pregnant_women = Column(Integer)  # PREGNANT WOMEN
    medicaid_family_planning = Column(Integer)  # FAMILY PLANNING
    medicaid_infants_and_children = Column(Integer)  # INFANTS AND CHILDREN
    medicaid_mchip = Column(Integer)  # MCHIP (Modified Children's Health Insurance Program)
    
    # Special Medicaid Programs
    medicaid_mqbq = Column(Integer)  # MQBQ (Medicare Qualified Beneficiary - QMB)
    medicaid_mqbb = Column(Integer)  # MQBB (Medicare Qualified Beneficiary - SLMB)
    medicaid_mqbe = Column(Integer)  # MQBE (Medicare Qualified Beneficiary - Extended)
    medicaid_bcc = Column(Integer)  # BCC (Breast and Cervical Cancer)
    medicaid_refugees = Column(Integer)  # REFUGEES
    medicaid_documented_non_citizens = Column(Integer)  # DOCUMENTED NON-CITIZENS
    medicaid_emergency_services_only = Column(Integer)  # EMERGENCY SERVICES ONLY
    medicaid_covid_19 = Column(Integer)  # COVID-19 MEDICAID
    
    # Data availability flags for tracking missing data
    medicaid_data_suppressed_fields = Column(Text)  # JSON list of fields with "#" (suppressed data)
    
    # Policy Risk Indicators
    federal_funding_dependence = Column(Float)  # % hospital revenue from federal sources
    snap_participation_rate = Column(Float)  # SNAP enrollment rate
    projected_coverage_losses = Column(Float)  # From work requirements/cuts
    rural_hospital_closure_risk = Column(Float)  # 1-10 risk score
    
    # Economic Vulnerability
    hospital_operating_margin = Column(Float)  # Average hospital operating margin
    hospital_closure_events = Column(Integer)  # Number of closures in recent years
    private_equity_market_share = Column(Float)  # % facilities PE-owned
    healthcare_employment_rate = Column(Float)  # % jobs in healthcare sector
    median_debt_collections = Column(Float)  # Medical debt indicators
    
    # Social Determinants of Health
    poverty_rate = Column(Float)
    education_score = Column(Float)  # Educational attainment indicator
    food_insecurity_rate = Column(Float)
    housing_cost_burden = Column(Float)  # % income spent on housing
    transportation_access_score = Column(Float)  # 1-10 scale
    internet_access_rate = Column(Float)  # For telehealth
    
    # Health Outcomes (for validation)
    life_expectancy = Column(Float)
    infant_mortality_rate = Column(Float)
    diabetes_prevalence = Column(Float)
    hypertension_prevalence = Column(Float)
    obesity_rate = Column(Float)
    preventable_hospitalizations = Column(Float)  # Rate per 1000
    
    # Data Quality and Processing
    data_completeness_score = Column(Float)  # 0-1 scale
    calculation_method = Column(String(100))  # HCVI calculation version
    quality_flags = Column(Text)  # JSON string of data quality issues
    is_provisional = Column(Boolean, default=False)  # Preliminary data flag
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_by = Column(String(100))  # Processing system/user identifier
    notes = Column(Text)
    
    # Relationships
    county = relationship("County", back_populates="healthcare_metrics")
    
    def __repr__(self):
        return f"<HealthcareMetrics(county_id={self.county_id}, date='{self.metric_date}', hcvi={self.hcvi_composite})>"
    
    @property
    def vulnerability_category(self) -> str:
        """Get vulnerability category based on HCVI score."""
        if self.hcvi_composite is None:
            return "unknown"
        elif self.hcvi_composite >= 8.5:
            return "extreme"
        elif self.hcvi_composite >= 6.5:
            return "high"
        elif self.hcvi_composite >= 4.0:
            return "moderate"
        else:
            return "low"
    
    @property
    def vulnerability_color(self) -> str:
        """Get color code for vulnerability level."""
        category = self.vulnerability_category
        colors = {
            "low": "#228B22",      # Green
            "moderate": "#FFD700", # Yellow
            "high": "#FF4500",     # Orange
            "extreme": "#8B0000",  # Red
            "unknown": "#9CA3AF"   # Gray
        }
        return colors.get(category, "#9CA3AF")
    
    @property
    def rural_classification(self) -> str:
        """Get rural classification from related county."""
        if self.county and self.county.is_rural:
            return "rural"
        return "urban"
    
    def calculate_hcvi_composite(self) -> float:
        """Calculate composite HCVI score from component scores."""
        if not all([self.healthcare_access_score, self.policy_risk_score, self.economic_vulnerability_score]):
            return None
        
        # Equal weighting for three main components (can be adjusted)
        composite = (
            self.healthcare_access_score * 0.33 +
            self.policy_risk_score * 0.33 +
            self.economic_vulnerability_score * 0.34
        )
        
        return round(composite, 2)