const fs = require('fs');
const path = require('path');

// Read the medicaid CSV data
const csvPath = path.join(__dirname, '../data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');

// Parse CSV data
const lines = csvData.split('\n');
const headers = lines[0].split(',');
const counties = [];

// Process each county (skip header and total line)
for (let i = 1; i < lines.length - 1; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  // Parse CSV with proper handling of quoted values
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current); // Last value
  
  const countyName = values[0].replace(/"/g, '');
  const countyTotal = parseInt(values[values.length - 1].replace(/[",]/g, '')) || 0;
  const medicaidExpansion = parseInt(values[values.length - 2].replace(/[",]/g, '')) || 0;
  
  // Generate FIPS code based on county name (simplified mapping)
  const fipsCode = generateFipsCode(countyName);
  
  counties.push({
    name: countyName,
    fips: fipsCode,
    medicaidTotal: countyTotal,
    medicaidExpansion: medicaidExpansion
  });
}

function generateFipsCode(countyName) {
  // NC FIPS codes start with 37
  const countyMap = {
    'ALAMANCE': '37001', 'ALEXANDER': '37003', 'ALLEGHANY': '37005', 'ANSON': '37007',
    'ASHE': '37009', 'AVERY': '37011', 'BEAUFORT': '37013', 'BERTIE': '37015',
    'BLADEN': '37017', 'BRUNSWICK': '37019', 'BUNCOMBE': '37021', 'BURKE': '37023',
    'CABARRUS': '37025', 'CALDWELL': '37027', 'CAMDEN': '37029', 'CARTERET': '37031',
    'CASWELL': '37033', 'CATAWBA': '37035', 'CHATHAM': '37037', 'CHEROKEE': '37039',
    'CHOWAN': '37041', 'CLAY': '37043', 'CLEVELAND': '37045', 'COLUMBUS': '37047',
    'CRAVEN': '37049', 'CUMBERLAND': '37051', 'CURRITUCK': '37053', 'DARE': '37055',
    'DAVIDSON': '37057', 'DAVIE': '37059', 'DUPLIN': '37061', 'DURHAM': '37063',
    'EDGECOMBE': '37065', 'FORSYTH': '37067', 'FRANKLIN': '37069', 'GASTON': '37071',
    'GATES': '37073', 'GRAHAM': '37075', 'GRANVILLE': '37077', 'GREENE': '37079',
    'GUILFORD': '37081', 'HALIFAX': '37083', 'HARNETT': '37085', 'HAYWOOD': '37087',
    'HENDERSON': '37089', 'HERTFORD': '37091', 'HOKE': '37093', 'HYDE': '37095',
    'IREDELL': '37097', 'JACKSON': '37099', 'JOHNSTON': '37101', 'JONES': '37103',
    'LEE': '37105', 'LENOIR': '37107', 'LINCOLN': '37109', 'MCDOWELL': '37111',
    'MACON': '37113', 'MADISON': '37115', 'MARTIN': '37117', 'MECKLENBURG': '37119',
    'MITCHELL': '37121', 'MONTGOMERY': '37123', 'MOORE': '37125', 'NASH': '37127',
    'NEW HANOVER': '37129', 'NORTHAMPTON': '37131', 'ONSLOW': '37133', 'ORANGE': '37135',
    'PAMLICO': '37137', 'PASQUOTANK': '37139', 'PENDER': '37141', 'PERQUIMANS': '37143',
    'PERSON': '37145', 'PITT': '37147', 'POLK': '37149', 'RANDOLPH': '37151',
    'RICHMOND': '37153', 'ROBESON': '37155', 'ROCKINGHAM': '37157', 'ROWAN': '37159',
    'RUTHERFORD': '37161', 'SAMPSON': '37163', 'SCOTLAND': '37165', 'STANLY': '37167',
    'STOKES': '37169', 'SURRY': '37171', 'SWAIN': '37173', 'TRANSYLVANIA': '37175',
    'TYRRELL': '37177', 'UNION': '37179', 'VANCE': '37181', 'WAKE': '37183',
    'WARREN': '37185', 'WASHINGTON': '37187', 'WATAUGA': '37189', 'WAYNE': '37191',
    'WILKES': '37193', 'WILSON': '37195', 'YADKIN': '37197', 'YANCEY': '37199'
  };
  
  return countyMap[countyName.toUpperCase()] || '37999';
}

// No longer need to generate fake coordinates - using real NCDOT boundaries

// Load the real NCDOT GeoJSON and merge with medicaid data
const realGeoJSONPath = path.join(__dirname, '../public/NCDOT_County_Boundaries.geojson');
const realGeoJSON = JSON.parse(fs.readFileSync(realGeoJSONPath, 'utf8'));

// Create a lookup map for medicaid data by county name
const medicaidLookup = {};
counties.forEach(county => {
  medicaidLookup[county.name.toUpperCase()] = county;
});

// Enhance the real GeoJSON features with medicaid data
const enhancedFeatures = realGeoJSON.features.map(feature => {
  const countyName = feature.properties.CountyName.toUpperCase();
  const medicaidData = medicaidLookup[countyName];
  
  return {
    ...feature,
    properties: {
      ...feature.properties,
      FIPS: feature.properties.FIPS.toString().padStart(3, '0'), // Convert to 3-digit string
      fips: `37${feature.properties.FIPS.toString().padStart(3, '0')}`, // Add full 5-digit FIPS
      NAME: feature.properties.CountyName,
      name: feature.properties.CountyName,
      medicaid_total: medicaidData ? medicaidData.medicaidTotal : 0,
      medicaid_expansion: medicaidData ? medicaidData.medicaidExpansion : 0,
      population: medicaidData ? medicaidData.medicaidTotal * 3 : 50000, // Rough estimate
      area: feature.properties.ShapeSTArea || 500000,
      classification: medicaidData && medicaidData.medicaidTotal > 20000 ? 'urban' : 'rural'
    }
  };
});

// Generate GeoJSON with real boundaries
const geoJSON = {
  type: "FeatureCollection",
  features: enhancedFeatures
};

// Generate healthcare data
const healthcareData = counties.map(county => {
  const medicaidRate = Math.min(county.medicaidTotal / (county.medicaidTotal * 3), 0.4);
  const vulnerabilityScore = Math.max(1, Math.min(10, 
    2 + (medicaidRate * 10) + (county.medicaidTotal > 50000 ? -2 : 2) + (Math.random() * 2)
  ));
  
  let vulnerabilityCategory = 'low';
  let vulnerabilityColor = '#2E8B57'; // Green for low
  if (vulnerabilityScore >= 7.5) {
    vulnerabilityCategory = 'extreme';
    vulnerabilityColor = '#DC143C'; // Crimson
  } else if (vulnerabilityScore >= 6) {
    vulnerabilityCategory = 'high';
    vulnerabilityColor = '#FF6347'; // Tomato
  } else if (vulnerabilityScore >= 4) {
    vulnerabilityCategory = 'moderate';
    vulnerabilityColor = '#FFA500'; // Orange
  }

  const healthcareAccessScore = Math.max(1, Math.min(10, 10 - vulnerabilityScore + Math.random() * 2));
  const policyRiskScore = Math.max(1, Math.min(10, vulnerabilityScore + Math.random() * 1));
  const economicVulnerabilityScore = Math.max(1, Math.min(10, vulnerabilityScore + Math.random() * 1));
  
  return {
    countyId: county.fips,
    countyName: county.name,
    fips_code: county.fips,
    vulnerability_category: vulnerabilityCategory,
    vulnerability_color: vulnerabilityColor,
    hcvi_composite: vulnerabilityScore,
    policy_risk_score: policyRiskScore,
    healthcare_access_score: healthcareAccessScore,
    economic_vulnerability_score: economicVulnerabilityScore,
    population_2020: county.medicaidTotal * 3, // Estimated population
    is_rural: county.medicaidTotal < 20000,
    medicaid_enrollment_rate: medicaidRate * 100,
    medicaid_dependency_ratio: medicaidRate,
    medicaid_total_enrollment: county.medicaidTotal,
    medicaid_expansion_enrollment: county.medicaidExpansion,
    
    healthcareAccess: {
      providerDensity: Math.max(1, 25 - vulnerabilityScore * 2),
      geographicAccess: Math.max(5, 30 - vulnerabilityScore * 2),
      specialtyServices: Math.max(1, 8 - vulnerabilityScore),
      insuranceCoverage: Math.max(70, 95 - vulnerabilityScore * 3),
      score: healthcareAccessScore
    },
    policyRisk: {
      medicaidDependency: medicaidRate * 100,
      federalFundingReliance: Math.max(20, Math.min(80, 40 + vulnerabilityScore * 4)),
      snapVulnerability: Math.max(5, Math.min(30, vulnerabilityScore * 3)),
      workRequirementImpact: Math.max(0, Math.min(25, vulnerabilityScore * 2.5)),
      score: policyRiskScore
    },
    economicVulnerability: {
      hospitalFinancialHealth: Math.max(1, 8 - vulnerabilityScore),
      privateEquityExposure: Math.max(0, Math.min(40, vulnerabilityScore * 4)),
      healthcareEmployment: Math.max(5, 15 - vulnerabilityScore),
      socialDeterminants: Math.max(1, 8 - vulnerabilityScore),
      score: economicVulnerabilityScore
    },
    hcvi: {
      score: vulnerabilityScore,
      ranking: Math.floor(Math.random() * 100) + 1,
      category: vulnerabilityCategory,
      color: vulnerabilityColor
    }
  };
});

// Write files
const outputDir = path.join(__dirname, '../app/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write GeoJSON
fs.writeFileSync(
  path.join(outputDir, 'ncCountiesGeoJSON.ts'),
  `export const ncCountiesGeoJSON = ${JSON.stringify(geoJSON, null, 2)};`
);

// Write healthcare data
fs.writeFileSync(
  path.join(outputDir, 'healthcareData.ts'),
  `export const mockHealthcareData = ${JSON.stringify(healthcareData, null, 2)};

export function getMedicaidDataByCounty(countyName: string) {
  return mockHealthcareData.find(d => d.countyName.toLowerCase() === countyName.toLowerCase());
}
`
);

console.log(`Processed ${counties.length} counties from medicaid data`);
console.log('Generated ncCountiesGeoJSON.ts and healthcareData.ts');