# Healthcare Vulnerability Index (HCVI) - Scientific Methodology & Data Sources

## Overview

This document provides the scientific foundation for calculating the North Carolina Healthcare Vulnerability Index (HCVI), based on established methodologies from the CDC Social Vulnerability Index (SVI), Area Deprivation Index (ADI), and Health Professional Shortage Area (HPSA) scoring systems.

## 1. Composite Index Methodology

### Theoretical Framework
The HCVI follows the **Singh (2003) factor analysis approach** and **CDC SVI methodology**, using standardized indicators across four theoretical domains:

1. **Healthcare Access** (25% weight)
2. **Policy Risk Exposure** (25% weight) 
3. **Economic Vulnerability** (25% weight)
4. **Social Determinants** (25% weight)

### Mathematical Foundation

#### Step 1: Variable Standardization
For each indicator variable X:
```
Z-score = (X - μ) / σ
where μ = mean, σ = standard deviation
```

#### Step 2: Domain Score Calculation
```
Domain Score = Σ(wi × Zi) / n
where wi = factor weight, Zi = standardized variable, n = number of variables
```

#### Step 3: Composite Index
```
HCVI = Σ(Domain Weighti × Domain Scorei)
where Domain Weight = 0.25 for each domain
```

#### Step 4: Percentile Ranking
```
HCVI Percentile = (Rank / Total Counties) × 100
Final Score = 10 × (HCVI Percentile / 100)
```

### Validation Approach
Following **CDC SVI validation methodology**:
- **Internal consistency**: Cronbach's alpha > 0.7
- **Convergent validity**: Correlation with known health outcomes
- **Geographic validity**: Comparison with expert knowledge of vulnerable areas

## 2. Healthcare Access Domain (25% Weight)

### Variables and Data Sources

#### Primary Care Access (6.25% total weight)
**Variable**: Primary Care Physicians per 100,000 population
- **Source**: HRSA Area Health Resources Files (AHRF)
- **Formula**: (Number of PCPs / Population) × 100,000
- **Inversion**: Higher values = lower vulnerability
- **Weight**: 33% of domain

**Variable**: Health Professional Shortage Area (HPSA) Score
- **Source**: HRSA Shortage Designation Management System
- **Range**: 0-25 (higher = more shortage)
- **Direct scoring**: Higher HPSA score = higher vulnerability
- **Weight**: 33% of domain

#### Geographic Access (6.25% total weight)
**Variable**: Average Travel Time to Nearest Hospital
- **Source**: CMS Provider of Services, Google Maps API
- **Calculation**: Weighted average by population density
- **Units**: Minutes driving time
- **Weight**: 50% of sub-domain

**Variable**: Rural-Urban Classification
- **Source**: USDA Rural-Urban Continuum Codes (RUCC)
- **Scale**: 1-9 (1=large metro, 9=rural non-adjacent)
- **Direct scoring**: Higher RUCC = higher vulnerability
- **Weight**: 50% of sub-domain

#### Insurance Coverage (6.25% total weight)
**Variable**: Percent Uninsured (Ages 18-64)
- **Source**: US Census American Community Survey (ACS) 5-year estimates
- **Table**: S2701 - Insurance Coverage Status
- **Direct scoring**: Higher uninsured % = higher vulnerability
- **Weight**: 100% of sub-domain

#### Specialty Care Access (6.25% total weight)
**Variable**: Specialists per 100,000 population
- **Source**: HRSA AHRF
- **Specialists included**: Cardiology, oncology, endocrinology, pulmonology
- **Inversion**: Higher specialist density = lower vulnerability
- **Weight**: 100% of sub-domain

## 3. Policy Risk Exposure Domain (25% Weight)

### Variables and Data Sources

#### Medicaid Dependency (8.33% total weight)
**Variable**: Medicaid Expansion Enrollment Rate
- **Source**: NC DHHS Medicaid Expansion Dashboard
- **Formula**: (Expansion Enrollees / Population Ages 19-64) × 100
- **Direct scoring**: Higher expansion rate = higher policy risk
- **Weight**: 50% of sub-domain

**Variable**: Hospital Medicaid Revenue Dependence
- **Source**: CMS Hospital Cost Reports (Form 2552-10)
- **Formula**: (Medicaid Net Patient Revenue / Total Net Patient Revenue) × 100
- **Direct scoring**: Higher Medicaid dependence = higher policy risk
- **Weight**: 50% of sub-domain

#### Federal Funding Exposure (8.33% total weight)
**Variable**: SNAP Participation Rate
- **Source**: USDA Food and Nutrition Service, Administrative Data
- **Formula**: (SNAP Recipients / Population Below 185% FPL) × 100
- **Direct scoring**: Higher SNAP participation = higher policy risk
- **Weight**: 50% of sub-domain

**Variable**: Community Health Center Dependence
- **Source**: HRSA Uniform Data System (UDS)
- **Formula**: (FQHC Patient Volume / Total Population) × 100
- **Direct scoring**: Higher FQHC dependence = higher policy risk
- **Weight**: 50% of sub-domain

#### Work Requirement Vulnerability (8.33% total weight)
**Variable**: Estimated Coverage Loss from Work Requirements
- **Source**: NC DHHS projections, Urban Institute modeling
- **Formula**: (Projected Losses / Current Medicaid Enrollment) × 100
- **Direct scoring**: Higher projected loss rate = higher vulnerability
- **Weight**: 100% of sub-domain

## 4. Economic Vulnerability Domain (25% Weight)

### Variables and Data Sources

#### Hospital Financial Health (8.33% total weight)
**Variable**: Hospital Operating Margin
- **Source**: CMS Hospital Cost Reports
- **Formula**: (Operating Revenue - Operating Expenses) / Operating Revenue
- **Inversion**: Lower margins = higher vulnerability
- **Weight**: 60% of sub-domain

**Variable**: Hospital Closure Risk Score
- **Source**: Cecil G. Sheps Center Rural Hospital Closures Database
- **Methodology**: Combines financial indicators, rural status, volume metrics
- **Range**: 1-10 (10 = highest closure risk)
- **Weight**: 40% of sub-domain

#### Private Equity Exposure (8.33% total weight)
**Variable**: PE-Owned Healthcare Facilities per 100,000
- **Source**: Private Equity Stakeholder Project, Pitchbook data
- **Formula**: (PE-Owned Facilities / Population) × 100,000
- **Direct scoring**: Higher PE concentration = higher vulnerability
- **Weight**: 60% of sub-domain

**Variable**: Market Concentration Index (HHI)
- **Source**: CMS Provider Enrollment, Chain Organization Database
- **Formula**: Herfindahl-Hirschman Index for hospital market
- **Range**: 0-10,000 (higher = more concentrated)
- **Weight**: 40% of sub-domain

#### Employment Dependency (8.33% total weight)
**Variable**: Healthcare Employment Concentration
- **Source**: Bureau of Labor Statistics, Quarterly Census of Employment and Wages
- **Formula**: (Healthcare Jobs / Total Employment) × 100
- **Direct scoring**: Higher concentration = higher vulnerability to sector disruption
- **Weight**: 100% of sub-domain

## 5. Social Determinants Domain (25% Weight)

### Variables and Data Sources
*Following CDC SVI and ADI methodologies*

#### Socioeconomic Status (6.25% total weight)
**Variable**: Percent Below Poverty Level
- **Source**: ACS 5-year estimates, Table S1701
- **Direct scoring**: Higher poverty = higher vulnerability
- **Weight**: 40% of sub-domain

**Variable**: Median Household Income
- **Source**: ACS 5-year estimates, Table S1901
- **Inversion**: Lower income = higher vulnerability
- **Weight**: 30% of sub-domain

**Variable**: Percent Unemployment
- **Source**: ACS 5-year estimates, Table S2301
- **Direct scoring**: Higher unemployment = higher vulnerability
- **Weight**: 30% of sub-domain

#### Educational Attainment (6.25% total weight)
**Variable**: Percent Adults Without High School Diploma
- **Source**: ACS 5-year estimates, Table S1501
- **Direct scoring**: Lower education = higher vulnerability
- **Weight**: 100% of sub-domain

#### Housing and Transportation (6.25% total weight)
**Variable**: Percent Housing Cost Burden (>30% income)
- **Source**: ACS 5-year estimates, Table B25070
- **Direct scoring**: Higher cost burden = higher vulnerability
- **Weight**: 50% of sub-domain

**Variable**: Percent Households Without Vehicle
- **Source**: ACS 5-year estimates, Table B25044
- **Direct scoring**: Less transportation = higher vulnerability
- **Weight**: 50% of sub-domain

#### Demographics (6.25% total weight)
**Variable**: Percent Population Age 65+
- **Source**: ACS 5-year estimates, Table S0101
- **Direct scoring**: Older population = higher vulnerability
- **Weight**: 50% of sub-domain

**Variable**: Percent Minority Population
- **Source**: ACS 5-year estimates, Table B03002
- **Formula**: 100 - (% Non-Hispanic White)
- **Direct scoring**: Higher minority % = higher vulnerability (due to systemic inequities)
- **Weight**: 50% of sub-domain

## 6. Data Quality and Availability

### Primary Data Sources
1. **US Census Bureau**
   - American Community Survey (ACS) 5-year estimates
   - Annual updates, county-level data
   - High reliability for populations >20,000

2. **Centers for Medicare & Medicaid Services (CMS)**
   - Hospital Cost Reports (annually)
   - Provider enrollment data
   - Claims data aggregations

3. **Health Resources and Services Administration (HRSA)**
   - Area Health Resources Files (annually)
   - Shortage designation data (quarterly updates)
   - Provider supply data

4. **NC Department of Health and Human Services**
   - Medicaid enrollment dashboards (monthly)
   - Hospital discharge data
   - Provider licensing data

5. **Bureau of Labor Statistics**
   - Quarterly Census of Employment and Wages
   - County-level employment by industry

### Data Limitations and Adjustments

#### Small Area Estimation
For counties with populations <20,000, apply **shrinkage estimation**:
```
Adjusted Value = w × County Value + (1-w) × Regional Mean
where w = reliability weight based on sample size
```

#### Missing Data Imputation
- **Geographic imputation**: Use adjacent county averages
- **Temporal imputation**: Use most recent available year
- **Regression imputation**: For systematic missingness

#### Temporal Alignment
- Align all data to same reference year (preferably most recent)
- Use linear interpolation for data gaps
- Apply inflation adjustments where appropriate

## 7. Validation Studies

### Predictive Validity
Test HCVI correlation with:
- **Hospital closure rates**: Expected correlation r > 0.6
- **COVID-19 mortality rates**: Expected correlation r > 0.4
- **Life expectancy**: Expected correlation r < -0.5
- **Emergency department utilization**: Expected correlation r > 0.5

### Construct Validity
- **Factor analysis**: Confirm four-factor structure
- **Inter-domain correlations**: Moderate correlations (0.3-0.7)
- **Geographic face validity**: Expert review of county rankings

### Sensitivity Analysis
- **Weight variations**: Test alternative domain weights
- **Variable substitutions**: Test with alternative indicators
- **Temporal stability**: Compare rankings across years

## 8. Implementation Formulas for Development

### Standardization Function
```javascript
function standardizeVariable(values) {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2)) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return values.map(value => (value - mean) / stdDev);
}
```

### Domain Score Calculation
```javascript
function calculateDomainScore(standardizedVars, weights) {
  return standardizedVars.reduce((sum, value, index) => 
    sum + (value * weights[index]), 0) / weights.length;
}
```

### Final HCVI Score
```javascript
function calculateHCVI(domains) {
  const domainWeights = [0.25, 0.25, 0.25, 0.25]; // Equal weighting
  const compositeScore = domains.reduce((sum, score, index) => 
    sum + (score * domainWeights[index]), 0);
  
  // Convert to percentile ranking (0-100)
  const percentile = calculatePercentile(compositeScore, allCountyScores);
  
  // Scale to 1-10
  return Math.max(1, Math.min(10, Math.ceil(percentile / 10)));
}
```

### Risk Classification
```javascript
function classifyRisk(hcviScore) {
  if (hcviScore >= 9) return { level: "Extreme", color: "#8B0000" };
  if (hcviScore >= 7) return { level: "High", color: "#FF4500" };
  if (hcviScore >= 4) return { level: "Moderate", color: "#FFD700" };
  return { level: "Low", color: "#228B22" };
}
```

## 9. Literature References

### Foundational Methodologies
- **Singh, G.K. (2003)**. Area deprivation and widening inequalities in US mortality, 1969-1998. *American Journal of Public Health*, 93(7), 1137-1143.
- **CDC/ATSDR Social Vulnerability Index**. Centers for Disease Control and Prevention. Documentation and methodology.
- **Kind, A.J.H. et al. (2014)**. Neighborhood socioeconomic disadvantage and 30-day rehospitalization. *Annals of Internal Medicine*, 161(11), 765-774.

### Validation Studies
- **Flanagan, B.E. et al. (2011)**. A social vulnerability index for disaster management. *Journal of Homeland Security and Emergency Management*, 8(1).
- **Butler, D.C. et al. (2013)**. Measures of social deprivation that predict health care access and need within a rational area of primary care service delivery. *Health Services Research*, 48(2), 539-559.

### Healthcare Economics
- **Holahan, J. & McMorrow, S. (2013)**. Medicaid expansion under the ACA: How states analyze the fiscal and economic trade-offs. *Urban Institute*.
- **Dranove, D. et al. (2017)**. The impact of the ACA's Medicaid expansion on hospitals' uncompensated care burden. *Commonwealth Fund*.

This methodology provides a scientifically rigorous foundation for calculating healthcare vulnerability that can be validated against real-world health outcomes and used for policy decision-making.