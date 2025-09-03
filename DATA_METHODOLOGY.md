# North Carolina Healthcare Vulnerability Index (HCVI) - Data Methodology

## Data Source References

### Primary Data Sources
1. **NC DHHS Medicaid Enrollment Data** - https://docs.google.com/spreadsheets/d/1srCsapW6I4MsqHqFoOznCBi6ShVdlFZkdqe63p8g-fU/edit?usp=drive_link
2. **CDC Social Vulnerability Index (SVI) 2022** - https://drive.google.com/file/d/1bCvHe3zLp6GryaoVJTwQYRwhGcSewzpH/view?usp=drive_link
3. **NC OneMap Hospital Database** - https://drive.google.com/file/d/1kfv3HLG5ZHbenvy4fmFXwWTC-D4ZQNo3/view?usp=drive_link
4. **Hospital Financial Data** - https://airtable.com/appZYwbt3vioNrb95/shricxhAQSjpv5ec8
5. **NC County Boundary Polygons** - https://www.nconemap.gov/datasets/NCEM-GIS::north-carolina-state-and-county-boundary-polygons/explore
6. **County Economic Classifications** - Afonso 2016, "The Equity of Local Sales Tax Distributions" (DOI: 10.1177/1091142115588976)

## Data Processing Pipeline

### Stage 1: Raw Data Ingestion
1. **Medicaid Data Processing** [Source 1]
   - Input: Monthly enrollment reports by category (Aged, Disabled, Blind, Children, etc.)
   - Validation: FIPS code matching (37001-37199, odd numbers only)
   - Output: Standardized enrollment counts per county

2. **SVI Data Integration** [Source 2]
   - Input: CDC's 16 vulnerability indicators across 4 themes
   - Standardization: Percentile rankings within NC counties
   - Output: Normalized vulnerability scores (0-1 scale)

3. **Geographic Data Processing** [Source 5]
   - Input: Official NC Emergency Management county boundaries
   - Format: GeoJSON with proper topology validation
   - Output: Renderable county polygons with FIPS matching

### Stage 2: Data Transformation & Validation

#### FIPS Code Standardization
- **Valid Range**: 37001 to 37199 (odd numbers only)
- **Invalid Records Removed**: 37999 (aggregate/total records)
- **Final Count**: Exactly 100 NC counties validated

#### County Classification System [Source 6]
Based on Afonso 2016 research methodology:
- **Urban**: Major metropolitan centers (10 counties)
- **Suburban**: Mixed characteristics (5 counties) 
- **Rural**: Agricultural/low-density (66 counties)
- **Tourism**: Economy dependent on tourism (19 counties)

### Stage 3: Healthcare Vulnerability Index Calculation

#### HCVI Composite Formula
```
HCVI = (Healthcare Access × 60%) + (Policy Risk × 20%) + (Economic Vulnerability × 20%)
```

#### Healthcare Access Component (60% weight)
- **Provider Density**: Licensed physicians per 10,000 residents [Source 3]
- **Geographic Access**: Average travel time to nearest hospital
- **Specialty Services**: Availability of critical care, cardiology, oncology
- **Insurance Coverage**: Percentage uninsured from SVI [Source 2]

#### Policy Risk Component (20% weight)
- **Medicaid Dependency**: Expansion enrollment as % of population [Source 1]
- **Federal Funding Exposure**: Hospital revenue from government sources [Source 4]
- **Work Requirement Vulnerability**: Projected coverage losses under policy changes
- **SNAP Participation Risk**: Food assistance dependency rates

#### Economic Vulnerability Component (20% weight)
- **Hospital Financial Health**: Operating margins and closure risk [Source 4]
- **Private Equity Exposure**: PE-owned facility concentration
- **Healthcare Employment**: Jobs dependent on healthcare sector
- **Social Determinants**: Poverty, education, housing from SVI [Source 2]

### Stage 4: Quality Assurance & Validation

#### Data Integrity Checks
1. **County Count Validation**: Exactly 100 counties confirmed
2. **FIPS Code Verification**: All codes match official NC registry
3. **Boundary Topology**: No gaps or overlaps in county polygons
4. **Missing Data Handling**: NULL values preserved, no synthetic data generated

#### Cross-Reference Validation
- Medicaid enrollment vs. population ratios (sanity checks)
- Hospital locations vs. county boundaries (geocoding validation)
- SVI percentiles vs. known demographic patterns

### Stage 5: Real-Time Data Serving

#### Database Architecture
- **Primary Storage**: Supabase PostgreSQL with PostGIS extension
- **Caching Layer**: Application-level caching for performance
- **API Endpoints**: RESTful services with data source attribution

#### Data Freshness
- **Medicaid Data**: Monthly updates from NC DHHS [Source 1]
- **SVI Data**: Annual updates from CDC [Source 2]  
- **Hospital Data**: Quarterly updates from NC OneMap [Source 3]
- **Financial Data**: Annual updates from reporting requirements [Source 4]
- **Boundary Data**: As-needed updates from NC Emergency Management [Source 5]

## Methodology Limitations

### Known Data Constraints
1. **Hospital Financial Data**: Limited to licensed facilities with public reporting
2. **Private Practice Coverage**: Solo practitioners may be underrepresented
3. **Real-Time Medicaid**: Monthly reporting introduces 30-60 day lag
4. **Specialty Care Access**: Travel time calculations use straight-line distance approximations

### Assumptions Made
1. **Population Distribution**: 2020 Census data used for current calculations
2. **Economic Classification**: Static categories from 2016 research, may not reflect current conditions
3. **Policy Impact Modeling**: Projections based on historical patterns and policy analysis

## Data Attribution Requirements

When using this data, cite as:
> North Carolina Healthcare Vulnerability Index, developed using data from NC DHHS Medicaid enrollment reports, CDC Social Vulnerability Index 2022, NC OneMap hospital database, and county economic classifications based on Afonso 2016 research. Processed and analyzed by [Project Team].

## Technical Implementation

### Data Update Process
1. Source data monitoring for changes
2. Automated validation and processing pipelines  
3. Quality assurance checks before publication
4. Version control and change tracking
5. User notification of significant updates

### Performance Considerations
- County boundary data optimized for web rendering
- Healthcare metrics pre-calculated for responsive mapping
- Caching strategies to minimize API load
- Progressive data loading for large datasets