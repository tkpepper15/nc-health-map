-- NC Healthcare Map - Complete Database Schema with SVI Integration
-- Drop existing tables and recreate with full SVI support
-- Run this in your Supabase SQL Editor

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop existing tables to recreate with proper schema
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS county_health_data CASCADE;

-- County Health Data Table with Full SVI Integration
CREATE TABLE county_health_data (
    id SERIAL PRIMARY KEY,
    fips_code VARCHAR(5) UNIQUE NOT NULL,
    county_name VARCHAR(100) NOT NULL,
    state_abbr VARCHAR(2) DEFAULT 'NC',

    -- Basic Demographics
    total_population INTEGER,
    area_sqmi DECIMAL(10,2),
    population_density DECIMAL(10,2),
    is_rural BOOLEAN DEFAULT false,

    -- HCVI Composite Scores
    hcvi_composite DECIMAL(4,2),
    healthcare_access_score DECIMAL(4,2),
    policy_risk_score DECIMAL(4,2),
    economic_vulnerability_score DECIMAL(4,2),
    vulnerability_category VARCHAR(20),
    vulnerability_level INTEGER, -- 1-10 scale

    -- Healthcare Access Metrics
    medicaid_enrollment_rate DECIMAL(6,2),
    uninsured_rate DECIMAL(5,2),
    physician_density DECIMAL(8,2), -- per 10,000 residents
    hospital_access_score DECIMAL(4,2),
    travel_time_to_hospital DECIMAL(5,2), -- minutes

    -- Policy Risk Metrics
    medicaid_dependency DECIMAL(5,2),
    federal_funding_reliance DECIMAL(5,2),
    snap_participation_rate DECIMAL(5,2),
    work_requirement_impact DECIMAL(5,2),

    -- Economic Indicators
    median_household_income INTEGER,
    poverty_rate DECIMAL(5,2),
    poverty_150_rate DECIMAL(5,2), -- 150% of poverty line
    unemployment_rate DECIMAL(5,2),
    healthcare_employment_pct DECIMAL(5,2),

    -- Health Outcomes
    health_ranking INTEGER, -- 1-100 ranking within NC
    life_expectancy DECIMAL(4,1),
    infant_mortality_rate DECIMAL(5,2),
    premature_death_rate INTEGER,

    -- SVI Theme 1: Socioeconomic Status
    svi_poverty_150_pct DECIMAL(5,2),
    svi_unemployment_pct DECIMAL(5,2),
    svi_housing_burden_pct DECIMAL(5,2),
    svi_no_highschool_pct DECIMAL(5,2),
    svi_no_insurance_pct DECIMAL(5,2),
    svi_theme1_score DECIMAL(6,4),
    svi_theme1_rank DECIMAL(6,4),

    -- SVI Theme 2: Household Characteristics
    svi_age65_older_pct DECIMAL(5,2),
    svi_age17_younger_pct DECIMAL(5,2),
    svi_disability_pct DECIMAL(5,2),
    svi_single_parent_pct DECIMAL(5,2),
    svi_limited_english_pct DECIMAL(5,2),
    svi_theme2_score DECIMAL(6,4),
    svi_theme2_rank DECIMAL(6,4),

    -- SVI Theme 3: Racial & Ethnic Minority Status
    svi_minority_pct DECIMAL(5,2),
    svi_african_american_pct DECIMAL(5,2),
    svi_hispanic_pct DECIMAL(5,2),
    svi_asian_pct DECIMAL(5,2),
    svi_native_american_pct DECIMAL(5,2),
    svi_pacific_islander_pct DECIMAL(5,2),
    svi_two_or_more_races_pct DECIMAL(5,2),
    svi_other_race_pct DECIMAL(5,2),
    svi_theme3_score DECIMAL(6,4),
    svi_theme3_rank DECIMAL(6,4),

    -- SVI Theme 4: Housing Type & Transportation
    svi_multiunit_housing_pct DECIMAL(5,2),
    svi_mobile_homes_pct DECIMAL(5,2),
    svi_crowded_housing_pct DECIMAL(5,2),
    svi_no_vehicle_pct DECIMAL(5,2),
    svi_group_quarters_pct DECIMAL(5,2),
    svi_theme4_score DECIMAL(6,4),
    svi_theme4_rank DECIMAL(6,4),

    -- SVI Overall Scores
    svi_overall_score DECIMAL(6,4),
    svi_overall_rank DECIMAL(6,4),

    -- SVI Vulnerability Flags (1 = high vulnerability, 0 = low)
    svi_flag_poverty_150 INTEGER DEFAULT 0,
    svi_flag_unemployment INTEGER DEFAULT 0,
    svi_flag_housing_burden INTEGER DEFAULT 0,
    svi_flag_no_highschool INTEGER DEFAULT 0,
    svi_flag_no_insurance INTEGER DEFAULT 0,
    svi_flag_age65_older INTEGER DEFAULT 0,
    svi_flag_age17_younger INTEGER DEFAULT 0,
    svi_flag_disability INTEGER DEFAULT 0,
    svi_flag_single_parent INTEGER DEFAULT 0,
    svi_flag_limited_english INTEGER DEFAULT 0,
    svi_flag_minority INTEGER DEFAULT 0,
    svi_flag_multiunit_housing INTEGER DEFAULT 0,
    svi_flag_mobile_homes INTEGER DEFAULT 0,
    svi_flag_crowded_housing INTEGER DEFAULT 0,
    svi_flag_no_vehicle INTEGER DEFAULT 0,
    svi_flag_group_quarters INTEGER DEFAULT 0,
    svi_total_flags INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vintage VARCHAR(10) DEFAULT '2024'
);

-- Hospitals Table
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    facility_name VARCHAR(255) NOT NULL,
    county_fips VARCHAR(5) NOT NULL,

    -- Location Data
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2) DEFAULT 'NC',
    zip_code VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location GEOGRAPHY(POINT, 4326),

    -- Facility Information
    hospital_type VARCHAR(50),
    facility_type VARCHAR(50),
    license_number VARCHAR(50),
    licensee VARCHAR(255),
    phone VARCHAR(20),

    -- Capacity Information
    general_beds INTEGER DEFAULT 0,
    rehab_beds INTEGER DEFAULT 0,
    psych_beds INTEGER DEFAULT 0,
    substance_abuse_beds INTEGER DEFAULT 0,
    nursing_facility_beds INTEGER DEFAULT 0,
    total_beds INTEGER DEFAULT 0,

    -- Operating Room Information
    cardiac_surgery_rooms INTEGER DEFAULT 0,
    cesarean_rooms INTEGER DEFAULT 0,
    ambulatory_surgery_rooms INTEGER DEFAULT 0,
    shared_rooms INTEGER DEFAULT 0,
    endoscopy_rooms INTEGER DEFAULT 0,
    other_surgery_rooms INTEGER DEFAULT 0,
    total_surgery_rooms INTEGER DEFAULT 0,

    -- Financial Health Indicators
    operating_margin DECIMAL(5,2),
    closure_risk VARCHAR(20), -- low, moderate, high, extreme
    financial_health_score DECIMAL(4,2),

    -- Ownership and Classification
    ownership_type VARCHAR(50),
    is_private_equity_owned BOOLEAN DEFAULT false,
    parent_company VARCHAR(255),
    is_major_hospital BOOLEAN DEFAULT false,
    is_critical_access BOOLEAN DEFAULT false,
    is_teaching_hospital BOOLEAN DEFAULT false,

    -- Service Classifications
    has_emergency_dept BOOLEAN DEFAULT true,
    is_specialty BOOLEAN DEFAULT false,
    is_ltac BOOLEAN DEFAULT false,
    is_rehab BOOLEAN DEFAULT false,
    trauma_level VARCHAR(10),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Foreign key constraint
    FOREIGN KEY (county_fips) REFERENCES county_health_data(fips_code) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX idx_county_health_fips ON county_health_data(fips_code);
CREATE INDEX idx_county_health_vulnerability ON county_health_data(vulnerability_category);
CREATE INDEX idx_county_health_rural ON county_health_data(is_rural);
CREATE INDEX idx_county_health_hcvi ON county_health_data(hcvi_composite);

-- SVI Indexes
CREATE INDEX idx_county_health_svi_overall ON county_health_data(svi_overall_rank);
CREATE INDEX idx_county_health_svi_theme1 ON county_health_data(svi_theme1_rank);
CREATE INDEX idx_county_health_svi_theme2 ON county_health_data(svi_theme2_rank);
CREATE INDEX idx_county_health_svi_theme3 ON county_health_data(svi_theme3_rank);
CREATE INDEX idx_county_health_svi_theme4 ON county_health_data(svi_theme4_rank);
CREATE INDEX idx_county_health_svi_flags ON county_health_data(svi_total_flags);

-- Hospital Indexes
CREATE INDEX idx_hospitals_county ON hospitals(county_fips);
CREATE INDEX idx_hospitals_type ON hospitals(hospital_type);
CREATE INDEX idx_hospitals_closure_risk ON hospitals(closure_risk);
CREATE INDEX idx_hospitals_location ON hospitals USING GIST (location);

-- Trigger Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_hospital_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_GeogFromText('POINT(' || NEW.longitude || ' ' || NEW.latitude || ')');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE OR REPLACE TRIGGER update_county_health_data_updated_at
    BEFORE UPDATE ON county_health_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_hospitals_updated_at
    BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_hospital_location_trigger
    BEFORE INSERT OR UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_hospital_location();

-- Row Level Security
ALTER TABLE county_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to county health data" ON county_health_data
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to hospitals" ON hospitals
    FOR SELECT USING (true);

-- Authenticated user policies for modifications
CREATE POLICY "Allow authenticated users to modify county data" ON county_health_data
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to modify hospital data" ON hospitals
    FOR ALL USING (auth.role() = 'authenticated');

-- Success confirmation
SELECT 'Complete schema with SVI integration created successfully!' as status,
       'Tables: county_health_data, hospitals' as tables_created,
       'Ready for data migration' as next_step;