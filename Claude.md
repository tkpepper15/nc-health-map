# North Carolina Healthcare Impact Analysis - Project Context

## About This Project

This web application visualizes the complex healthcare landscape in North Carolina, with particular focus on the impacts of recent federal legislation (the "One Big Beautiful Bill Act") and broader healthcare challenges across the state's 100 counties.

## Visual Design Reference

This application should closely mirror the design and functionality of the Climate-Conflict-Vulnerability Index (https://climate-conflict.org/www), adapted for North Carolina healthcare data:

### Layout Structure
- **Left Sidebar**: Index description card, metrics panel, legend, data download
- **Right Main Area**: Interactive North Carolina map with county boundaries
- **Color Scheme**: Blue (healthcare access), Red (policy risk), Orange (economic vulnerability)
- **Clean Design**: White cards with subtle shadows, professional typography

### North Carolina Healthcare Vulnerability Index (HCVI)

Similar to CCVI but focused on healthcare challenges:

#### Composite Scoring (1-10 scale)
**Healthcare Access (33%)**
- Provider density: Physicians per 10,000 residents
- Geographic access: Average travel time to hospital
- Specialty services: Availability of cardiology, oncology, etc.
- Insurance coverage: Percent uninsured

**Policy Risk (33%)**  
- Medicaid dependency: Expansion enrollment as % of population
- Federal funding reliance: Hospital revenue from government sources
- SNAP vulnerability: Participation rates and cut exposure
- Work requirement impact: Projected coverage losses

**Economic Vulnerability (34%)**
- Hospital financial health: Operating margins and closure risk
- Private equity exposure: PE-owned facilities and market concentration
- Healthcare employment: Jobs dependent on healthcare sector
- Social determinants: Poverty, education, housing instability

### Rural Hospital Crisis
- **12 rural hospitals** have closed since 2005
- **338 rural hospitals nationwide** at risk due to federal cuts
- **5 NC hospitals** specifically identified as high-risk
- **44% of rural hospitals** operate with negative margins
- Rural counties have only **10 physicians per 10,000 residents** vs. 26.6 in metro areas

### Healthcare Disparities
- NC ranks **30th nationally** in overall health
- **78 of 100 counties** classified as rural
- Rural poverty rate: **18.3%** vs. urban **13.7%**
- Consistent pattern: **wealthier urban counties perform better** than poorer rural counties

### Private Equity Activity
- **$206 billion** in healthcare acquisitions nationally in 2021
- **6-fold increase** in physician practice acquisitions (2012-2021)
- Major NC firms: NovaQuest ($2.5B), Pamlico Capital, Ridgemont Equity

## Data Categories for Visualization

### 1. Policy Impact Analysis
- Medicaid expansion enrollment by county
- Hospital closure risk assessments
- SNAP program participation and cuts
- Provider tax revenue losses

### 2. Healthcare Access Metrics
- Hospital locations and financial health
- Provider-to-population ratios
- Travel distances to specialty care
- Insurance coverage rates

### 3. Economic Health Indicators
- Hospital operating margins
- Private equity investments
- Healthcare employment data
- Economic impact projections

### 4. Population Health Outcomes
- County health rankings (1-100)
- Social determinants of health
- Chronic disease prevalence
- Mortality and morbidity rates

## Key Counties of Interest

### County Risk Classifications

#### Extreme Vulnerability (HCVI 9-10) - Expected Counties
- **Columbus County**: Consistently worst health outcomes, high poverty
- **Robeson County**: High uninsured rates, rural challenges, minority population
- **Swain County**: Remote location, limited healthcare infrastructure
- **Person County**: Hospital closure risk, economic challenges

#### High Vulnerability (HCVI 7-8)
- **Rural mountain counties**: Transportation barriers, provider shortages
- **Eastern coastal plains**: Hurricane risk, economic vulnerability
- **Small manufacturing towns**: Economic transition, aging population

#### Moderate Vulnerability (HCVI 4-6)
- **Mid-size cities**: Some resources but facing challenges
- **Suburban counties**: Mixed urban-rural characteristics
- **Military communities**: Federal healthcare but civilian gaps

#### Low Vulnerability (HCVI 1-3)
- **Orange County** (Chapel Hill): Academic medical center, high education
- **Durham County**: Research Triangle, major healthcare systems  
- **Mecklenburg County** (Charlotte): Urban resources, though disparities exist
- **Wake County** (Raleigh): State capital, healthcare hub

## Technical Implementation Notes

### Map Layers Priority
1. **Medicaid Impact Layer** (highest priority)
   - Current expansion enrollment
   - Projected losses under work requirements
   - Financial impact on hospitals

2. **Hospital Financial Health**
   - Operating margins by facility
   - Closure risk indicators
   - Rural vs. urban classifications

3. **Social Determinants**
   - Poverty rates
   - Education levels
   - Transportation access
   - Food security

4. **Healthcare Access**
   - Provider density
   - Specialty service availability
   - Travel time to care

### Data Sources Referenced
- **NC Medicaid Dashboards**: Real-time enrollment data
- **County Health Rankings**: Annual comparative data
- **NC State Center for Health Statistics**: Health surveillance
- **Cecil G. Sheps Center**: Rural health research
- **CMS Hospital Cost Reports**: Financial data
- **U.S. Census ACS**: Demographics and economics

### Color Coding Suggestions
- **Red**: High risk, poor outcomes, significant challenges
- **Yellow/Orange**: Moderate risk, mixed outcomes
- **Green**: Low risk, good outcomes, stable systems
- **Blue**: Water bodies, neutral areas
- **Gray**: No data or not applicable

### Interactive Features Priority
1. **County click events** with comprehensive data popup
2. **Layer toggles** for different data categories
3. **Comparison tool** for side-by-side county analysis
4. **Time series** showing trends over time
5. **Filter system** for rural/urban, risk levels, etc.

## Key Messages to Convey

### Primary Narrative
North Carolina's healthcare system faces unprecedented challenges from federal policy changes, with rural communities bearing disproportionate burden while urban areas maintain relative advantages.

### Supporting Points
- Medicaid expansion success story now threatened
- Rural hospital closures create healthcare deserts
- Private equity consolidation changes care delivery
- Geographic disparities persist across health outcomes
- Policy decisions have real impacts on real communities

### Call to Action
This data should inform evidence-based policy decisions and resource allocation to protect vulnerable populations and maintain healthcare access across all 100 counties.

## User Personas

### Primary Users
- **Policymakers**: State legislators, congressional staff
- **Healthcare Administrators**: Hospital CEOs, health system leaders
- **Researchers**: Academic institutions, think tanks
- **Advocates**: Patient advocacy groups, rural health advocates
- **Media**: Healthcare journalists, policy reporters

### Secondary Users
- **General Public**: Residents seeking healthcare information
- **Students**: Public health, policy, and medical students
- **Investors**: Healthcare investors and private equity firms

## Performance Considerations
- Large datasets require efficient loading and caching
- Mobile users need simplified but functional interface
- Map interactions must be smooth and responsive
- Data updates should be seamless without full reloads

## Accessibility Requirements
- Screen reader compatible
- Keyboard navigation support
- High contrast color options
- Alt text for all visualizations
- Clear labeling and descriptions

## Future Enhancement Opportunities
- Real-time data integration with state APIs
- Predictive modeling for hospital closures
- Integration with electronic health records
- Community health assessment tools
- Policy scenario modeling

This context should guide development decisions and help prioritize features that best serve the application's mission of informing healthcare policy and access decisions in North Carolina.