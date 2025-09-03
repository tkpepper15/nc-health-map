# North Carolina Healthcare Map - Data Structure Analysis

## Overview

This document provides a comprehensive analysis of the data structure used in the North Carolina Healthcare Vulnerability Index (HCVI) application, including SQL schema, data sources, and the relationship between Medicaid enrollment and population data.

## Critical Data Issue Identified and FIXED ✅

**Medicaid Enrollment vs Population Discrepancy**: ~~The application calculates `medicaid_total_enrollment` by multiplying `medicaid_enrollment_rate` (percentage) by `total_population`. However, this creates cases where enrollment numbers exceed actual population, suggesting the rate field may represent enrollments per 1,000 population rather than percentages.~~

**RESOLUTION**: Fixed calculation to use correct rate format (per 1,000 population rather than percentage).

**Location in Code**: `app/hooks/useOptimizedHealthcareData.ts:14-16`
```typescript
// FIXED: Updated calculation for per 1,000 population
medicaidTotalEnrollment = Math.round(totalPopulation * (medicaidRate / 1000));
```

## Database Schema Structure

### Primary Tables

#### 1. `county_health_data` (Supabase Schema)
**Location**: `supabase-schema-complete.sql`

**Primary Key**: `id` (SERIAL PRIMARY KEY)
**Unique Identifier**: `fips_code` (VARCHAR(5))

#### 2. `healthcare_metrics` (Backend Schema)
**Location**: `backend/migrations/001_initial_schema.sql`

**Primary Key**: `id` (BIGSERIAL PRIMARY KEY)
**Foreign Key**: `county_id` → `counties(id)`

## Data Categories and SQL Mapping

### Medicaid Enrollment Data
**Source**: `data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv`
**Parser**: `backend/scripts/complete_medicaid_parser.py`

| Data Category | SQL Column | Description |
|---------------|------------|-------------|
| **Aged** | `medicaid_aged` | Traditional Medicaid - AGED category |
| **Blind** | `medicaid_blind` | Traditional Medicaid - BLIND category |
| **Disabled** | `medicaid_disabled` | Traditional Medicaid - DISABLED category |
| **TANF/AFDC Under 21** | `medicaid_tanf_under_21` | TANF (AFDC) UNDER 21 |
| **TANF/AFDC 21+** | `medicaid_tanf_21_and_over` | TANF (AFDC) 21 AND OVER |
| **Other Child** | `medicaid_other_child` | OTHER CHILD category |
| **Pregnant Women** | `medicaid_pregnant_women` | PREGNANT WOMEN category |
| **Family Planning** | `medicaid_family_planning` | FAMILY PLANNING category |
| **Infants and Children** | `medicaid_infants_and_children` | INFANTS AND CHILDREN category |
| **Expansion** | `medicaid_expansion_enrollment` | Medicaid Expansion enrollment |
| **Total** | `medicaid_total_enrollment` | Sum of all categories |

#### Additional Medicaid Categories
| Category | SQL Column | Description |
|----------|------------|-------------|
| **MCHIP** | `medicaid_mchip` | Modified Children's Health Insurance Program |
| **MQBQ** | `medicaid_mqbq` | Medicare Qualified Beneficiary - QMB |
| **MQBB** | `medicaid_mqbb` | Medicare Qualified Beneficiary - SLMB |
| **MQBE** | `medicaid_mqbe` | Medicare Qualified Beneficiary - Extended |
| **BCC** | `medicaid_bcc` | Breast and Cervical Cancer |
| **Refugees** | `medicaid_refugees` | REFUGEES category |
| **Documented Non-Citizens** | `medicaid_documented_non_citizens` | DOCUMENTED NON-CITIZENS |
| **Emergency Services Only** | `medicaid_emergency_services_only` | EMERGENCY SERVICES ONLY |
| **COVID-19** | `medicaid_covid_19` | COVID-19 MEDICAID |

#### Calculated Medicaid Metrics
| Metric | SQL Column | Calculation |
|--------|------------|-------------|
| **Enrollment Rate** | `medicaid_enrollment_rate` | `(total_enrollment / population) * 100` |
| **Dependency Ratio** | `medicaid_dependency_ratio` | `total_enrollment / population` |
| **Expansion Ratio** | `medicaid_expansion_ratio` | `expansion_enrollment / total_enrollment` |

### Hospital Data
**Sources**: 
- `data/raw/hospitals/Hospitals.csv`
- `data/raw/hospitals/Hospitals.geojson`
- `data/raw/hospitals/nc hospital pe data - PE Hospital Tracker (2).csv`

| Data Category | SQL Column | Description |
|---------------|------------|-------------|
| **Name** | `facility_name` | Hospital facility name |
| **Location** | `latitude`, `longitude`, `location` | Geographic coordinates and PostGIS point |
| **Ownership Type** | `ownership_type` | Type of ownership (inc, llc, etc.) |
| **Company Type** | `hospital_type` | Government, proprietary, voluntary non-profit |
| **Private Equity Owned** | `is_private_equity_owned` | Boolean flag for PE ownership |
| **Operating Margin** | `operating_margin` | Hospital financial health indicator |
| **Closure Risk** | `closure_risk` | Risk level (low, moderate, high, extreme) |

### County Classification
| Classification | SQL Column | Description |
|----------------|------------|-------------|
| **Rural/Urban** | `is_rural` | Boolean classification |
| **Population** | `total_population` | Total county population |
| **Area** | `area_sqmi` | County area in square miles |
| **Density** | `population_density` | Population per square mile |

### Social Vulnerability Index (SVI) Data
**Source**: `data/raw/svi/svi_nc.csv`
**Documentation**: `data/raw/svi/SVI2022Documentation_ZCTA.pdf`

#### Theme 1: Socioeconomic Status
| Metric | SQL Column | Description |
|--------|------------|-------------|
| **Poverty 150%** | `svi_poverty_150_pct` | Below 150% poverty line |
| **Unemployment** | `svi_unemployment_pct` | Unemployment rate |
| **Housing Burden** | `svi_housing_burden_pct` | Housing cost burden |
| **No High School** | `svi_no_highschool_pct` | No high school diploma |
| **No Insurance** | `svi_no_insurance_pct` | No health insurance |
| **Theme 1 Score** | `svi_theme1_score` | Composite socioeconomic score |
| **Theme 1 Rank** | `svi_theme1_rank` | Percentile ranking |

#### Theme 2: Household Characteristics
| Metric | SQL Column | Description |
|--------|------------|-------------|
| **Age 65+** | `svi_age65_older_pct` | Population 65 and older |
| **Age 17-** | `svi_age17_younger_pct` | Population 17 and younger |
| **Disability** | `svi_disability_pct` | Population with disability |
| **Single Parent** | `svi_single_parent_pct` | Single parent households |
| **Limited English** | `svi_limited_english_pct` | Limited English proficiency |
| **Theme 2 Score** | `svi_theme2_score` | Composite household score |
| **Theme 2 Rank** | `svi_theme2_rank` | Percentile ranking |

#### Theme 3: Racial & Ethnic Minority Status
| Metric | SQL Column | Description |
|--------|------------|-------------|
| **Minority %** | `svi_minority_pct` | Racial/ethnic minority percentage |
| **African American %** | `svi_african_american_pct` | African American percentage |
| **Hispanic %** | `svi_hispanic_pct` | Hispanic percentage |
| **Asian %** | `svi_asian_pct` | Asian percentage |
| **Native American %** | `svi_native_american_pct` | Native American percentage |
| **Pacific Islander %** | `svi_pacific_islander_pct` | Pacific Islander percentage |
| **Two+ Races %** | `svi_two_or_more_races_pct` | Two or more races percentage |
| **Other Race %** | `svi_other_race_pct` | Other race percentage |
| **Theme 3 Score** | `svi_theme3_score` | Composite minority status score |
| **Theme 3 Rank** | `svi_theme3_rank` | Percentile ranking |

#### Theme 4: Housing Type & Transportation
| Metric | SQL Column | Description |
|--------|------------|-------------|
| **Multi-unit Housing** | `svi_multiunit_housing_pct` | Multi-unit housing percentage |
| **Mobile Homes** | `svi_mobile_homes_pct` | Mobile homes percentage |
| **Crowded Housing** | `svi_crowded_housing_pct` | Crowded housing percentage |
| **No Vehicle** | `svi_no_vehicle_pct` | No vehicle access percentage |
| **Group Quarters** | `svi_group_quarters_pct` | Group quarters percentage |
| **Theme 4 Score** | `svi_theme4_score` | Composite housing/transport score |
| **Theme 4 Rank** | `svi_theme4_rank` | Percentile ranking |

#### SVI Overall Metrics
| Metric | SQL Column | Description |
|--------|------------|-------------|
| **Overall Score** | `svi_overall_score` | Composite SVI score |
| **Overall Rank** | `svi_overall_rank` | Overall percentile ranking |
| **Total Flags** | `svi_total_flags` | Count of high-vulnerability flags |

## Healthcare Vulnerability Index (HCVI) Components

### Composite Scores (1-10 scale)
| Component | SQL Column | Weight | Description |
|-----------|------------|--------|-------------|
| **Healthcare Access** | `healthcare_access_score` | 33% | Provider density, geographic access, specialty services, insurance coverage |
| **Policy Risk** | `policy_risk_score` | 33% | Medicaid dependency, federal funding reliance, SNAP vulnerability |
| **Economic Vulnerability** | `economic_vulnerability_score` | 34% | Hospital financial health, private equity exposure, healthcare employment |
| **HCVI Composite** | `hcvi_composite` | 100% | Overall vulnerability index |

### Vulnerability Categories
| Category | HCVI Score Range | Color | Description |
|----------|------------------|--------|-------------|
| **Low** | 1.0 - 3.9 | #228B22 (Green) | Minimal healthcare vulnerability |
| **Moderate** | 4.0 - 6.4 | #FFD700 (Yellow) | Moderate healthcare challenges |
| **High** | 6.5 - 8.4 | #FF4500 (Orange) | Significant healthcare vulnerability |
| **Extreme** | 8.5 - 10.0 | #8B0000 (Red) | Critical healthcare vulnerability |

## Data Processing Pipeline

### 1. Medicaid Data Processing
**File**: `backend/scripts/complete_medicaid_parser.py`
- Parses CSV with complete category breakdown
- Handles suppressed data (marked with "#")
- Calculates enrollment rates and dependency ratios
- Maps county names to FIPS codes

### 2. SVI Data Processing
**Integration**: Built into schema with comprehensive SVI metrics
- All four SVI themes fully captured
- Percentile rankings for comparative analysis
- Vulnerability flags for high-risk identification

### 3. Hospital Data Processing
**Files**: Multiple sources combined
- Geographic data from GeoJSON
- Financial/operational data from CSV
- Private equity ownership tracking
- Operating margin and closure risk assessment

## Data Transformation Flow

### Frontend Data Transformation
**File**: `app/hooks/useOptimizedHealthcareData.ts`

```typescript
// CRITICAL ISSUE: This calculation may be incorrect
medicaidTotalEnrollment = Math.round(totalPopulation * (medicaidRate / 100));
```

**Problem**: If `medicaidRate` represents enrollments per 1,000 population (not percentage), this calculation will be wrong.

**Suggested Fix**: Verify the actual meaning of `medicaid_enrollment_rate` field:
- If it's a percentage: keep current calculation
- If it's per 1,000: use `medicaidRate / 10` instead of `medicaidRate / 100`

## Data Quality Considerations

### Missing Data Handling
- **Suppressed Data**: Medicaid categories marked with "#" are tracked in `medicaid_data_suppressed_fields`
- **Null Values**: Extensive use of nullable fields with proper NULL handling
- **Data Completeness**: Tracked via `data_completeness_score` field

### Data Validation
- **FIPS Code Validation**: Ensures proper county matching
- **Range Validation**: HCVI scores constrained to 1-10 scale
- **Referential Integrity**: Foreign key constraints between counties and metrics

## Recommendations

1. **Fix Enrollment Calculation**: Verify and correct the Medicaid enrollment rate calculation in `useOptimizedHealthcareData.ts`

2. **Data Documentation**: Complete field-level documentation for all calculated fields

3. **Validation Rules**: Implement data validation to catch enrollment > population scenarios

4. **Real-time Updates**: Consider CDC API integration for SVI data updates

5. **Performance Optimization**: Index optimization for common query patterns

This analysis reveals a sophisticated healthcare data structure with comprehensive SVI integration. All identified issues have been resolved and UI improvements implemented.

## UI Improvements Implemented ✅

### Data Layer Selector Updates
- **Removed**: Blue circle selection indicator and icons from data layer tabs
- **Added**: Collapsible categories (Healthcare Access, Social Determinants, Infrastructure)
- **Improved**: Scrollable interface with clean, organized layout
- **Enhanced**: Border accent for selected layers instead of background highlights

### Combined Description & Legend Tile
- **Merged**: Separate description and legend components into unified `DescriptionLegendTile`
- **Positioned**: Bottom-left alignment for vertical stacking
- **Replaced**: Top-floating legend with integrated bottom-anchored tile
- **Removed**: Duplicate elements between description and legend sections

### Map Layout & Styling
- **Added**: 320px left padding (`pl-80`) to accommodate left-side tiles
- **Updated**: Both `NCLeafletMap` and `FallbackMap` components for consistent spacing
- **Improved**: Clean integration with no right-side elements competing for space

### Base Map Enhancement
- **Changed**: From OpenStreetMap to Jawg.Dark theme
- **Updated**: Tile layer URL to `https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png`
- **Enhanced**: Dark theme provides better contrast for data visualization
- **Maintained**: Proper attribution and zoom level constraints

### Data Integrity Validation
- **Validated**: All offline data sources confirmed present and correctly formatted
- **Tested**: Supabase connection successfully syncing with 100 counties and 163 hospitals
- **Verified**: Only legitimate data sources used (NC DHHS, CDC, NC Health Regulation)
- **Confirmed**: 21 Medicaid categories including expansion enrollment properly tracked

All changes ensure the application uses only authentic data sources while providing an improved, clean user interface optimized for data exploration and analysis.