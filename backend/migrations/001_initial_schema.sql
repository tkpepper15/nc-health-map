-- NC Healthcare Vulnerability Index - Initial Database Schema
-- This script creates the initial database structure for the application

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create counties table
CREATE TABLE IF NOT EXISTS counties (
    id SERIAL PRIMARY KEY,
    fips_code VARCHAR(5) UNIQUE NOT NULL,
    county_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) DEFAULT 'NC' NOT NULL,
    
    -- Geographic data
    geometry GEOMETRY(MULTIPOLYGON, 4326),
    centroid_lat DOUBLE PRECISION,
    centroid_lon DOUBLE PRECISION,
    
    -- Demographic data
    population_2020 INTEGER,
    population_2010 INTEGER,
    land_area_sq_miles DOUBLE PRECISION,
    water_area_sq_miles DOUBLE PRECISION,
    population_density DOUBLE PRECISION,
    
    -- Classification
    rural_urban_code INTEGER,
    metropolitan_status VARCHAR(20),
    
    -- Economic indicators
    median_household_income DOUBLE PRECISION,
    poverty_rate DOUBLE PRECISION,
    unemployment_rate DOUBLE PRECISION,
    
    -- Administrative
    county_seat VARCHAR(100),
    established_year INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_quality_score DOUBLE PRECISION,
    notes TEXT
);

-- Create indexes on counties table
CREATE INDEX IF NOT EXISTS idx_counties_fips ON counties(fips_code);
CREATE INDEX IF NOT EXISTS idx_counties_state ON counties(state_code);
CREATE INDEX IF NOT EXISTS idx_counties_rural_urban ON counties(rural_urban_code);
CREATE INDEX IF NOT EXISTS idx_counties_metro_status ON counties(metropolitan_status);
CREATE INDEX IF NOT EXISTS idx_counties_geometry ON counties USING GIST(geometry);

-- Create healthcare_metrics table
CREATE TABLE IF NOT EXISTS healthcare_metrics (
    id BIGSERIAL PRIMARY KEY,
    county_id INTEGER NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    data_version VARCHAR(50),
    
    -- HCVI Composite Scores (1-10 scale)
    hcvi_composite DOUBLE PRECISION,
    healthcare_access_score DOUBLE PRECISION,
    policy_risk_score DOUBLE PRECISION,
    economic_vulnerability_score DOUBLE PRECISION,
    social_determinants_score DOUBLE PRECISION,
    
    -- Healthcare Access Metrics
    provider_density DOUBLE PRECISION,
    specialist_density DOUBLE PRECISION,
    hospital_beds_per_capita DOUBLE PRECISION,
    avg_travel_time_hospital DOUBLE PRECISION,
    specialty_services_score DOUBLE PRECISION,
    uninsured_rate DOUBLE PRECISION,
    underinsured_rate DOUBLE PRECISION,
    provider_shortage_designation BOOLEAN,
    
    -- Medicaid Data
    medicaid_total_enrollment INTEGER,
    medicaid_expansion_enrollment INTEGER,
    medicaid_traditional_enrollment INTEGER,
    medicaid_enrollment_rate DOUBLE PRECISION,
    medicaid_dependency_ratio DOUBLE PRECISION,
    medicaid_expansion_ratio DOUBLE PRECISION,
    
    -- Policy Risk Indicators
    federal_funding_dependence DOUBLE PRECISION,
    snap_participation_rate DOUBLE PRECISION,
    projected_coverage_losses DOUBLE PRECISION,
    rural_hospital_closure_risk DOUBLE PRECISION,
    
    -- Economic Vulnerability
    hospital_operating_margin DOUBLE PRECISION,
    hospital_closure_events INTEGER,
    private_equity_market_share DOUBLE PRECISION,
    healthcare_employment_rate DOUBLE PRECISION,
    median_debt_collections DOUBLE PRECISION,
    
    -- Social Determinants of Health
    poverty_rate DOUBLE PRECISION,
    education_score DOUBLE PRECISION,
    food_insecurity_rate DOUBLE PRECISION,
    housing_cost_burden DOUBLE PRECISION,
    transportation_access_score DOUBLE PRECISION,
    internet_access_rate DOUBLE PRECISION,
    
    -- Health Outcomes
    life_expectancy DOUBLE PRECISION,
    infant_mortality_rate DOUBLE PRECISION,
    diabetes_prevalence DOUBLE PRECISION,
    hypertension_prevalence DOUBLE PRECISION,
    obesity_rate DOUBLE PRECISION,
    preventable_hospitalizations DOUBLE PRECISION,
    
    -- Data Quality and Processing
    data_completeness_score DOUBLE PRECISION,
    calculation_method VARCHAR(100),
    quality_flags TEXT,
    is_provisional BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by VARCHAR(100),
    notes TEXT,
    
    -- Ensure unique constraint for county/date combination
    UNIQUE(county_id, metric_date, data_source)
);

-- Create indexes on healthcare_metrics table
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_county ON healthcare_metrics(county_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_date ON healthcare_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_source ON healthcare_metrics(data_source);
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_hcvi ON healthcare_metrics(hcvi_composite);
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_policy_risk ON healthcare_metrics(policy_risk_score);
CREATE INDEX IF NOT EXISTS idx_healthcare_metrics_county_date ON healthcare_metrics(county_id, metric_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_counties_updated_at
    BEFORE UPDATE ON counties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_healthcare_metrics_updated_at
    BEFORE UPDATE ON healthcare_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for latest metrics by county
CREATE OR REPLACE VIEW latest_county_metrics AS
SELECT 
    c.*,
    hm.metric_date,
    hm.data_source,
    hm.hcvi_composite,
    hm.healthcare_access_score,
    hm.policy_risk_score,
    hm.economic_vulnerability_score,
    hm.social_determinants_score,
    hm.medicaid_total_enrollment,
    hm.medicaid_enrollment_rate,
    hm.medicaid_dependency_ratio,
    hm.provider_density,
    hm.uninsured_rate,
    hm.poverty_rate,
    hm.data_completeness_score,
    CASE 
        WHEN hm.hcvi_composite >= 8.5 THEN 'extreme'
        WHEN hm.hcvi_composite >= 6.5 THEN 'high'
        WHEN hm.hcvi_composite >= 4.0 THEN 'moderate'
        WHEN hm.hcvi_composite IS NOT NULL THEN 'low'
        ELSE 'unknown'
    END as vulnerability_category,
    CASE 
        WHEN hm.hcvi_composite >= 8.5 THEN '#8B0000'
        WHEN hm.hcvi_composite >= 6.5 THEN '#FF4500'
        WHEN hm.hcvi_composite >= 4.0 THEN '#FFD700'
        WHEN hm.hcvi_composite IS NOT NULL THEN '#228B22'
        ELSE '#9CA3AF'
    END as vulnerability_color
FROM counties c
LEFT JOIN healthcare_metrics hm ON c.id = hm.county_id
AND hm.metric_date = (
    SELECT MAX(metric_date) 
    FROM healthcare_metrics hm2 
    WHERE hm2.county_id = c.id
);

-- Create summary statistics view
CREATE OR REPLACE VIEW healthcare_summary_stats AS
SELECT 
    COUNT(*) as total_counties,
    COUNT(hcvi_composite) as counties_with_hcvi,
    ROUND(AVG(hcvi_composite), 2) as avg_hcvi,
    ROUND(MIN(hcvi_composite), 2) as min_hcvi,
    ROUND(MAX(hcvi_composite), 2) as max_hcvi,
    ROUND(AVG(policy_risk_score), 2) as avg_policy_risk,
    ROUND(AVG(healthcare_access_score), 2) as avg_healthcare_access,
    ROUND(AVG(economic_vulnerability_score), 2) as avg_economic_vulnerability,
    SUM(medicaid_total_enrollment) as total_medicaid_enrollment,
    ROUND(AVG(medicaid_dependency_ratio), 4) as avg_medicaid_dependency,
    COUNT(CASE WHEN vulnerability_category = 'low' THEN 1 END) as low_vulnerability_count,
    COUNT(CASE WHEN vulnerability_category = 'moderate' THEN 1 END) as moderate_vulnerability_count,
    COUNT(CASE WHEN vulnerability_category = 'high' THEN 1 END) as high_vulnerability_count,
    COUNT(CASE WHEN vulnerability_category = 'extreme' THEN 1 END) as extreme_vulnerability_count,
    MAX(metric_date) as latest_data_date,
    ROUND(AVG(data_completeness_score), 3) as avg_data_quality
FROM latest_county_metrics;

-- Insert NC counties baseline data
-- This would typically be loaded from a separate script or CSV
-- For now, we'll create a few example counties

INSERT INTO counties (
    fips_code, county_name, state_code, population_2020, land_area_sq_miles,
    rural_urban_code, metropolitan_status, median_household_income, poverty_rate,
    county_seat, centroid_lat, centroid_lon
) VALUES 
    ('37183', 'Wake County', 'NC', 1111761, 832.0, 1, 'metro', 75000, 9.2, 'Raleigh', 35.7796, -78.6382),
    ('37119', 'Mecklenburg County', 'NC', 1110356, 524.0, 1, 'metro', 68000, 12.1, 'Charlotte', 35.2271, -80.8431),
    ('37063', 'Durham County', 'NC', 324833, 286.0, 2, 'metro', 70000, 11.8, 'Durham', 35.9940, -78.8986),
    ('37135', 'Orange County', 'NC', 148696, 397.0, 2, 'metro', 85000, 7.9, 'Hillsborough', 35.9132, -79.1003),
    ('37047', 'Columbus County', 'NC', 50623, 937.0, 8, 'rural', 35000, 22.8, 'Whiteville', 34.2343, -78.7364),
    ('37155', 'Robeson County', 'NC', 116530, 949.0, 6, 'micro', 33000, 24.1, 'Lumberton', 34.6226, -79.0264),
    ('37173', 'Swain County', 'NC', 14117, 527.0, 8, 'rural', 38000, 18.5, 'Bryson City', 35.4012, -83.4896),
    ('37145', 'Person County', 'NC', 39097, 392.0, 6, 'micro', 45000, 15.3, 'Roxboro', 36.3959, -78.9767)
ON CONFLICT (fips_code) DO NOTHING;

-- Update population density for inserted counties
UPDATE counties 
SET population_density = population_2020 / land_area_sq_miles 
WHERE population_density IS NULL AND population_2020 IS NOT NULL AND land_area_sq_miles IS NOT NULL;

-- Grant permissions for application user (will be created separately)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON counties TO nc_healthcare_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare_metrics TO nc_healthcare_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nc_healthcare_user;

-- Create comment for documentation
COMMENT ON TABLE counties IS 'North Carolina counties with geographic and demographic data';
COMMENT ON TABLE healthcare_metrics IS 'Healthcare vulnerability metrics and indicators by county and date';
COMMENT ON VIEW latest_county_metrics IS 'Latest healthcare metrics for each county with vulnerability categorization';
COMMENT ON VIEW healthcare_summary_stats IS 'Summary statistics across all counties for dashboard display';

-- Log successful schema creation
INSERT INTO counties (fips_code, county_name, notes) 
VALUES ('00000', 'SCHEMA_INIT', 'Initial schema created successfully on ' || NOW())
ON CONFLICT (fips_code) DO UPDATE SET 
    notes = 'Schema updated on ' || NOW(),
    updated_at = NOW();

COMMIT;