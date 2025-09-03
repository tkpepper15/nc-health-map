# North Carolina Healthcare Map - UI Redesign Plan
*Multi-stage implementation plan based on climate-conflict.org layout reference*

## Phase 1: Light Mode Reversion & Data Fix (Priority: Critical)

### Step 1.1: Revert Dark Mode to Light Mode
- [ ] **DescriptionLegendTile**: `bg-gray-800` → `bg-white`, text colors to dark
- [ ] **DataLayerSelector**: `bg-gray-800` → `bg-white`, borders and text to light theme
- [ ] **UnifiedCountyTile**: Revert all dark theme classes to original light theme
- [ ] **Map Base**: Change from Jawg.Dark back to light OpenStreetMap tiles

### Step 1.2: Fix Medicaid Rate Display Issue  
- [ ] **Root Cause**: Enrollment rate showing >100% despite backend fix
- [ ] **Investigation**: Check if frontend is still using old calculation or display logic
- [ ] **Fix**: Ensure rate displays as proportion (0-1) or proper percentage
- [ ] **Validation**: Test with sample county data to confirm accurate display

## Phase 2: Layout Restructure (Priority: High)

### Step 2.1: Container Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Header                           │
├─────────────────┬───────────────────────────────────┤
│  Left Sidebar   │           Map Area              │
│   (Fixed 320px) │        (Flexible Width)         │
│                 │                                 │
│ ┌─Description─┐ │                                 │
│ │ & Legend    │ │         Leaflet Map             │
│ │ (Top)       │ │                                 │
│ └─────────────┘ │                                 │
│                 │                                 │
│ ┌─Data Layers─┐ │                                 │
│ │ Selector    │ │                                 │
│ │ (Bottom)    │ │                                 │
│ └─────────────┘ │                                 │
└─────────────────┴───────────────────────────────────┘
```

### Step 2.2: Component Repositioning
- [ ] **Map**: Remove left padding, center in right area
- [ ] **DescriptionLegendTile**: Move to fixed left sidebar (top section)
- [ ] **DataLayerSelector**: Move to fixed left sidebar (bottom section)
- [ ] **Create**: New sidebar container component for left-side layout

## Phase 3: Backend Data Integration (Priority: Medium)

### Step 3.1: Three-Theme Data Architecture
Based on backend structure analysis, organize data into:

#### Theme 1: Healthcare Access (33% of HCVI)
```typescript
interface HealthcareAccessTheme {
  providerDensity: number;        // physicians per 10,000
  geographicAccess: number;       // avg minutes to hospital
  specialtyServices: number;      // availability score 1-10
  insuranceCoverage: number;      // % insured
  medicaidAccess: number;         // enrollment accessibility
}
```

#### Theme 2: Policy Risk (33% of HCVI)  
```typescript
interface PolicyRiskTheme {
  medicaidDependency: number;     // % population on Medicaid
  federalFundingReliance: number; // % hospital revenue federal
  snapVulnerability: number;      // SNAP participation rate
  workRequirementImpact: number;  // projected coverage losses
}
```

#### Theme 3: Economic Vulnerability (34% of HCVI)
```typescript
interface EconomicVulnerabilityTheme {
  hospitalFinancialHealth: number;  // operating margin percentile
  privateEquityExposure: number;    // % facilities PE-owned
  healthcareEmployment: number;     // % jobs in healthcare
  socialDeterminants: number;       // poverty/education composite
}
```

### Step 3.2: Data Layer Organization
- [ ] **Restructure**: DataLayerSelector to show three main themes
- [ ] **Sub-layers**: Each theme contains 3-4 specific metrics
- [ ] **Integration**: Use county classifications (Urban/Suburban/Rural/Tourism)

## Phase 4: Advanced UI Components (Priority: Medium)

### Step 4.1: Enhanced Description & Legend
- [ ] **Dynamic Content**: Auto-update based on selected layer
- [ ] **County Classifications**: Show classification in hover/click
- [ ] **Data Sources**: Clear attribution for each metric
- [ ] **Statistical Summary**: Min/max/avg values for context

### Step 4.2: Interactive Features
- [ ] **Multi-layer Toggle**: Show overlay combinations
- [ ] **Comparison Mode**: Side-by-side county analysis
- [ ] **Time Series**: Historical data where available
- [ ] **Export Functions**: Data download for selected counties

## Phase 5: Polish & Performance (Priority: Low)

### Step 5.1: Performance Optimization
- [ ] **Lazy Loading**: Load data layers on demand
- [ ] **Caching**: Implement client-side data caching
- [ ] **Debouncing**: Optimize hover interactions
- [ ] **Bundle Size**: Code splitting for map components

### Step 5.2: Accessibility & UX
- [ ] **Screen Reader**: ARIA labels and descriptions
- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Mobile Responsive**: Collapsible sidebar for mobile
- [ ] **Loading States**: Show progress during data loading

## Implementation Strategy

### Chunk 1: Critical Fixes (Day 1)
1. Revert to light mode across all components
2. Fix Medicaid enrollment rate calculation/display
3. Basic layout restructure (sidebar placement)

### Chunk 2: Layout Implementation (Day 2) 
1. Create new sidebar container component
2. Reposition existing components to match reference
3. Implement responsive design patterns

### Chunk 3: Data Integration (Day 3)
1. Restructure data layer selector with three themes
2. Integrate county classifications into display
3. Update legend and description components

### Chunk 4: Enhancement & Testing (Day 4)
1. Add interactive features and comparisons
2. Performance optimization and caching
3. Comprehensive testing and bug fixes

## Success Metrics
- [ ] Layout matches climate-conflict.org reference structure
- [ ] All Medicaid rates display correctly (no >100% values)
- [ ] Three-theme data architecture properly reflected in UI
- [ ] Light mode theme consistent throughout
- [ ] County classifications properly integrated and displayed
- [ ] Responsive design works across devices
- [ ] Performance: page loads in <3 seconds
- [ ] Accessibility: passes WCAG 2.1 AA standards

## Technical Debt Resolution
- [ ] Remove unused dark mode classes
- [ ] Consolidate duplicate styling patterns  
- [ ] Update component prop interfaces for new data structure
- [ ] Add TypeScript strict checking for data models
- [ ] Implement proper error boundaries for map failures