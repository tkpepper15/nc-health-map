# North Carolina Healthcare Data - Real vs Placeholder Status

## ✅ REAL DATA AVAILABLE (from Supabase Database)

### County Demographics
- `county_name` - Real county names
- `fips_code` - Real FIPS codes  
- `total_population` - Real 2020 Census data
- `is_rural` - Real rural classification

### Healthcare Vulnerability Index (HCVI)
- `hcvi_composite` - Real composite scores (1-10 scale)
- `vulnerability_category` - Real categories (low, moderate, high, extreme)
- `healthcare_access_score` - Real component scores
- `policy_risk_score` - Real component scores
- `economic_vulnerability_score` - Real component scores

### Medicaid Data
- `medicaid_enrollment_rate` - Real enrollment percentages
- `medicaid_total_enrollment` - Calculated from rate × population

### Social Vulnerability Index (SVI)
- `svi_overall_rank` - Real CDC SVI percentiles
- `svi_theme1_rank` through `svi_theme4_rank` - Real theme rankings
- `svi_poverty_150_pct` - Real poverty data
- `svi_unemployment_pct` - Real unemployment data
- `svi_housing_burden_pct` - Real housing cost burden
- `svi_no_highschool_pct` - Real education data
- `svi_no_insurance_pct` - Real uninsured rates
- `svi_age65_older_pct`, `svi_age17_younger_pct` - Real demographic data
- `svi_disability_pct` - Real disability data
- `svi_minority_pct` - Real racial/ethnic data

### Insurance & Healthcare Access
- `uninsured_rate` - Real uninsured percentages

## ❌ NOT AVAILABLE (Showing "--" or "N/A")

### Provider Details
- `physician_density` - NULL in database
- `travel_time_to_hospital` - NULL in database
- `hospital_access_score` - NULL in database

### Policy & Economic Details  
- `federal_funding_reliance` - NULL in database
- `snap_participation_rate` - NULL in database
- `work_requirement_impact` - NULL in database
- `healthcare_employment_pct` - NULL in database
- `medicaid_dependency` - NULL in database

### Financial Data
- `hospital_financial_health` - Not in database
- `private_equity_exposure` - Not in database

### Medicaid Breakdown
- `medicaid_expansion_enrollment` - No breakdown data available
- `medicaid_traditional_enrollment` - No breakdown data available

### Health Outcomes
- `life_expectancy` - NULL in database
- `infant_mortality_rate` - NULL in database
- `health_ranking` - NULL in database

## 🏥 HOSPITAL DATA AVAILABLE
- 163 real hospital facilities with locations
- Facility names, addresses, bed counts
- Hospital types and classifications
- Geographic coordinates for mapping

## 📊 UI BEHAVIOR
- Real data displays with actual numbers
- Missing data shows "--" or "N/A"
- No dummy/fabricated values generated
- Clear indication when data is unavailable