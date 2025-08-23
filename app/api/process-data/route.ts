import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface MedicaidData {
  fips_code: string;
  county_name: string;
  population_2020: number;
  medicaid_total_enrollment: number;
  medicaid_expansion_enrollment: number;
  medicaid_traditional_enrollment: number;
  medicaid_enrollment_rate: number;
  medicaid_dependency_ratio: number;
}

interface SVIData {
  fips_code: string;
  county_name: string;
  socioeconomic_percentile: number;
  household_composition_percentile: number;
  racial_minority_percentile: number;
  housing_transport_percentile: number;
  svi_overall_percentile: number;
  poverty_150_pct: number;
  unemployment_pct: number;
  housing_burden_pct: number;
  no_highschool_pct: number;
  no_insurance_pct: number;
}

interface CombinedData extends MedicaidData {
  healthcare_access_score: number;
  policy_risk_score: number;
  economic_vulnerability_score: number;
  hcvi_composite: number;
  vulnerability_category: string;
  svi_data: SVIData | undefined;
  last_updated: string;
}

// This endpoint triggers processing of raw CSV data
export async function POST() {
  try {
    console.log('Starting data processing...');
    
    // Check if raw data files exist
    const dataDir = path.join(process.cwd(), 'data', 'raw');
    const medicaidFile = path.join(dataDir, 'medicaid', 'nc_medicaid_enrollment_jun_2025.csv');
    const sviFile = path.join(dataDir, 'svi', 'svi_nc.csv');
    
    const [medicaidExists, sviExists] = await Promise.all([
      fs.access(medicaidFile).then(() => true).catch(() => false),
      fs.access(sviFile).then(() => true).catch(() => false)
    ]);
    
    if (!medicaidExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Medicaid CSV file not found',
        path: medicaidFile 
      }, { status: 404 });
    }
    
    if (!sviExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'SVI CSV file not found',
        path: sviFile 
      }, { status: 404 });
    }
    
    // Process Medicaid data
    const medicaidData = await processMedicaidData(medicaidFile);
    console.log(`Processed ${medicaidData.length} Medicaid records`);
    
    // Process SVI data  
    const sviData = await processSVIData(sviFile);
    console.log(`Processed ${sviData.length} SVI records`);
    
    // Combine data and calculate HCVI scores
    const combinedData = combineAndCalculateHCVI(medicaidData, sviData);
    console.log(`Generated HCVI scores for ${combinedData.length} counties`);
    
    // Cache processed data
    await cacheProcessedData(combinedData);
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed data for ${combinedData.length} counties`,
      timestamp: new Date().toISOString(),
      counts: {
        medicaid_records: medicaidData.length,
        svi_records: sviData.length,
        combined_records: combinedData.length
      }
    });
    
  } catch (error) {
    console.error('Data processing failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Process Medicaid CSV data
async function processMedicaidData(filePath: string): Promise<MedicaidData[]> {
  const csvContent = await fs.readFile(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const medicaidData: MedicaidData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) continue;
    
    const county = values[0]?.replace(/"/g, '').trim();
    if (!county || county === 'COUNTY NAME') continue;
    
    // Get county total (last column)
    const totalEnrollment = parseInt(values[values.length - 1]?.replace(/[",]/g, '') || '0');
    const expansionEnrollment = parseInt(values[values.length - 2]?.replace(/[",]/g, '') || '0');
    
    // Calculate dependency metrics
    const fipsCode = getCountyFIPS(county);
    const population = getCountyPopulation(county);
    
    medicaidData.push({
      county_name: county,
      fips_code: fipsCode,
      medicaid_total_enrollment: totalEnrollment,
      medicaid_expansion_enrollment: expansionEnrollment,
      medicaid_traditional_enrollment: totalEnrollment - expansionEnrollment,
      population_2020: population,
      medicaid_dependency_ratio: population > 0 ? totalEnrollment / population : 0,
      medicaid_enrollment_rate: population > 0 ? (totalEnrollment / population) * 100 : 0
    });
  }
  
  return medicaidData;
}

// Process SVI CSV data
async function processSVIData(filePath: string) {
  const csvContent = await fs.readFile(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const sviData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < headers.length) continue;
    
    // Extract key SVI indicators (adapt based on actual CSV structure)
    const fips = values[headers.indexOf('FIPS')] || values[headers.indexOf('fips')];
    const county = values[headers.indexOf('COUNTY')] || values[headers.indexOf('county')];
    
    if (!fips || !county) continue;
    
    // Extract SVI component scores (adjust column indices based on actual CSV)
    const sviOverall = parseFloat(values[headers.indexOf('RPL_THEMES')] || values[headers.indexOf('svi_overall')] || '0.5');
    const socioeconomic = parseFloat(values[headers.indexOf('RPL_THEME1')] || values[headers.indexOf('socioeconomic')] || '0.5');
    const householdComposition = parseFloat(values[headers.indexOf('RPL_THEME2')] || values[headers.indexOf('household')] || '0.5');
    const racialMinority = parseFloat(values[headers.indexOf('RPL_THEME3')] || values[headers.indexOf('minority')] || '0.5');
    const housingTransport = parseFloat(values[headers.indexOf('RPL_THEME4')] || values[headers.indexOf('housing')] || '0.5');
    
    sviData.push({
      fips_code: fips,
      county_name: county.replace(/"/g, '').trim(),
      svi_overall_percentile: sviOverall,
      socioeconomic_percentile: socioeconomic,
      household_composition_percentile: householdComposition,
      racial_minority_percentile: racialMinority,
      housing_transport_percentile: housingTransport
    });
  }
  
  return sviData;
}

// Combine data and calculate HCVI composite scores
function combineAndCalculateHCVI(medicaidData: MedicaidData[], sviData: SVIData[]): CombinedData[] {
  return medicaidData.map(medicaid => {
    const svi = sviData.find(s => s.fips_code === medicaid.fips_code);
    
    // Calculate HCVI component scores (1-10 scale)
    const healthcareAccessScore = calculateHealthcareAccessScore(medicaid, svi);
    const policyRiskScore = calculatePolicyRiskScore(medicaid, svi);
    const economicVulnerabilityScore = calculateEconomicVulnerabilityScore(medicaid, svi);
    
    // Calculate composite HCVI score (weighted average)
    const hcvi_composite = (
      healthcareAccessScore * 0.33 +
      policyRiskScore * 0.33 +
      economicVulnerabilityScore * 0.34
    );
    
    // Determine vulnerability category
    let vulnerability_category: string;
    if (hcvi_composite >= 8.5) vulnerability_category = 'extreme';
    else if (hcvi_composite >= 6.5) vulnerability_category = 'high';
    else if (hcvi_composite >= 4.0) vulnerability_category = 'moderate';
    else vulnerability_category = 'low';
    
    return {
      ...medicaid,
      healthcare_access_score: Number(healthcareAccessScore.toFixed(2)),
      policy_risk_score: Number(policyRiskScore.toFixed(2)),
      economic_vulnerability_score: Number(economicVulnerabilityScore.toFixed(2)),
      hcvi_composite: Number(hcvi_composite.toFixed(2)),
      vulnerability_category,
      svi_data: svi,
      last_updated: new Date().toISOString()
    };
  });
}

// Calculate healthcare access score (simplified)
function calculateHealthcareAccessScore(medicaid: MedicaidData, svi: SVIData | undefined): number {
  // Use SVI data and population characteristics to estimate healthcare access
  const populationDensity = medicaid.population_2020 > 100000 ? 8 : medicaid.population_2020 > 50000 ? 5 : 3;
  const socioeconomicFactor = svi ? (1 - svi.socioeconomic_percentile) * 10 : 5;
  const transportFactor = svi ? (1 - svi.housing_transport_percentile) * 10 : 5;
  
  return Math.min(10, Math.max(1, (populationDensity + socioeconomicFactor + transportFactor) / 3));
}

// Calculate policy risk score
function calculatePolicyRiskScore(medicaid: MedicaidData, svi: SVIData | undefined): number {
  const medicaidDependency = Math.min(10, medicaid.medicaid_dependency_ratio * 20);
  const expansionRisk = medicaid.medicaid_expansion_enrollment > 0 ? 
    Math.min(10, (medicaid.medicaid_expansion_enrollment / medicaid.medicaid_total_enrollment) * 12) : 0;
  const socioeconomicRisk = svi ? svi.socioeconomic_percentile * 10 : 5;
  
  return Math.min(10, Math.max(1, (medicaidDependency + expansionRisk + socioeconomicRisk) / 3));
}

// Calculate economic vulnerability score
function calculateEconomicVulnerabilityScore(medicaid: MedicaidData, svi: SVIData | undefined): number {
  const populationRisk = medicaid.population_2020 < 50000 ? 8 : 4; // Rural risk
  const socioeconomicRisk = svi ? svi.socioeconomic_percentile * 10 : 5;
  const householdRisk = svi ? svi.household_composition_percentile * 8 : 4;
  
  return Math.min(10, Math.max(1, (populationRisk + socioeconomicRisk + householdRisk) / 3));
}

// Cache processed data for API consumption
async function cacheProcessedData(data: CombinedData[]) {
  const outputDir = path.join(process.cwd(), 'data', 'processed');
  await fs.mkdir(outputDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(outputDir, `hcvi_processed_${timestamp}.json`);
  
  await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
  
  // Also write to a 'latest' file
  const latestFile = path.join(outputDir, 'hcvi_latest.json');
  await fs.writeFile(latestFile, JSON.stringify(data, null, 2));
  
  console.log(`Cached processed data to ${outputFile}`);
}

// Helper functions
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function getCountyFIPS(countyName: string): string {
  const fipsMap: { [key: string]: string } = {
    'ALAMANCE': '37001',
    'ALEXANDER': '37003',
    'ALLEGHANY': '37005',
    'ANSON': '37007',
    'ASHE': '37009',
    'AVERY': '37011',
    'BEAUFORT': '37013',
    'BERTIE': '37015',
    'BLADEN': '37017',
    'BRUNSWICK': '37019',
    'BUNCOMBE': '37021',
    'BURKE': '37023',
    'CABARRUS': '37025',
    'CALDWELL': '37027',
    'CAMDEN': '37029',
    'CARTERET': '37031',
    'CASWELL': '37033',
    'CATAWBA': '37035',
    'CHATHAM': '37037',
    'CHEROKEE': '37039',
    'CHOWAN': '37041',
    'CLAY': '37043',
    'CLEVELAND': '37045',
    'COLUMBUS': '37047',
    'CRAVEN': '37049',
    'CUMBERLAND': '37051',
    'CURRITUCK': '37053',
    'DARE': '37055',
    'DAVIDSON': '37057',
    'DAVIE': '37059',
    'DUPLIN': '37061',
    'DURHAM': '37063',
    'EDGECOMBE': '37065',
    'FORSYTH': '37067',
    'FRANKLIN': '37069',
    'GASTON': '37071',
    'GATES': '37073',
    'GRAHAM': '37075',
    'GRANVILLE': '37077',
    'GREENE': '37079',
    'GUILFORD': '37081',
    'HALIFAX': '37083',
    'HARNETT': '37085',
    'HAYWOOD': '37087',
    'HENDERSON': '37089',
    'HERTFORD': '37091',
    'HOKE': '37093',
    'HYDE': '37095',
    'IREDELL': '37097',
    'JACKSON': '37099',
    'JOHNSTON': '37101',
    'JONES': '37103',
    'LEE': '37105',
    'LENOIR': '37107',
    'LINCOLN': '37109',
    'MCDOWELL': '37111',
    'MACON': '37113',
    'MADISON': '37115',
    'MARTIN': '37117',
    'MECKLENBURG': '37119',
    'MITCHELL': '37121',
    'MONTGOMERY': '37123',
    'MOORE': '37125',
    'NASH': '37127',
    'NEW HANOVER': '37129',
    'NORTHAMPTON': '37131',
    'ONSLOW': '37133',
    'ORANGE': '37135',
    'PAMLICO': '37137',
    'PASQUOTANK': '37139',
    'PENDER': '37141',
    'PERQUIMANS': '37143',
    'PERSON': '37145',
    'PITT': '37147',
    'POLK': '37149',
    'RANDOLPH': '37151',
    'RICHMOND': '37153',
    'ROBESON': '37155',
    'ROCKINGHAM': '37157',
    'ROWAN': '37159',
    'RUTHERFORD': '37161',
    'SAMPSON': '37163',
    'SCOTLAND': '37165',
    'STANLY': '37167',
    'STOKES': '37169',
    'SURRY': '37171',
    'SWAIN': '37173',
    'TRANSYLVANIA': '37175',
    'TYRRELL': '37177',
    'UNION': '37179',
    'VANCE': '37181',
    'WAKE': '37183',
    'WARREN': '37185',
    'WASHINGTON': '37187',
    'WATAUGA': '37189',
    'WAYNE': '37191',
    'WILKES': '37193',
    'WILSON': '37195',
    'YADKIN': '37197',
    'YANCEY': '37199'
  };
  
  return fipsMap[countyName.toUpperCase()] || '37999';
}

function getCountyPopulation(countyName: string): number {
  const populationMap: { [key: string]: number } = {
    'WAKE': 1111761,
    'MECKLENBURG': 1110356,
    'GUILFORD': 533670,
    'DURHAM': 324833,
    'FORSYTH': 382590,
    'CUMBERLAND': 334728,
    'BUNCOMBE': 269452,
    'CABARRUS': 225804,
    'UNION': 238267,
    'GASTON': 227943
  };
  
  return populationMap[countyName.toUpperCase()] || 50000;
}