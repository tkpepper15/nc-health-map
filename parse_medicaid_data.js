const fs = require('fs');

// Read the CSV file
const csvData = fs.readFileSync('/Users/tejjaskaul/PycharmProjects/nc-health-map/data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv', 'utf8');

// Split into lines and get headers
const lines = csvData.split('\n');
const headers = lines[0].split(',');

// Clean and parse a value (handle quotes, commas, and # symbols)
function cleanValue(value) {
    if (!value || value.trim() === '' || value.trim() === '#') {
        return 0;
    }
    
    // Remove quotes and commas
    const cleaned = value.replace(/"/g, '').replace(/,/g, '');
    const parsed = parseInt(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
}

// Convert county name to lowercase key format
function formatCountyKey(countyName) {
    return countyName.toLowerCase()
        .replace(' county', '')
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');
}

// Process each county row
const medicaidData = {};

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('TOTALS')) continue;
    
    // Split the line, handling quoted values with commas
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
    values.push(current); // Add the last value
    
    if (values.length < 21) continue; // Skip incomplete rows
    
    const countyName = values[0].replace(/"/g, '');
    const countyKey = formatCountyKey(countyName);
    
    medicaidData[countyKey] = {
        countyName: countyName,
        aged: cleanValue(values[1]),
        blind: cleanValue(values[2]),
        disabled: cleanValue(values[3]),
        tanfUnder21: cleanValue(values[4]),
        tanf21AndOver: cleanValue(values[5]),
        otherChild: cleanValue(values[6]),
        pregnantWomen: cleanValue(values[7]),
        familyPlanning: cleanValue(values[8]),
        infantsAndChildren: cleanValue(values[9]),
        mchip: cleanValue(values[10]),
        mqbq: cleanValue(values[11]),
        mqbb: cleanValue(values[12]),
        mqbe: cleanValue(values[13]),
        bcc: cleanValue(values[14]),
        refugees: cleanValue(values[15]),
        documentedNonCitizens: cleanValue(values[16]),
        emergencyServicesOnly: cleanValue(values[17]),
        covid19Medicaid: cleanValue(values[18]),
        medicaidExpansion: cleanValue(values[19]),
        countyTotal: cleanValue(values[20])
    };
}

// Generate the JavaScript object string
console.log('const medicaidEnrollmentData = {');
const counties = Object.keys(medicaidData).sort();

counties.forEach((county, index) => {
    const data = medicaidData[county];
    const isLast = index === counties.length - 1;
    
    console.log(`  '${county}': {`);
    console.log(`    countyName: '${data.countyName}',`);
    console.log(`    aged: ${data.aged},`);
    console.log(`    blind: ${data.blind},`);
    console.log(`    disabled: ${data.disabled},`);
    console.log(`    tanfUnder21: ${data.tanfUnder21},`);
    console.log(`    tanf21AndOver: ${data.tanf21AndOver},`);
    console.log(`    otherChild: ${data.otherChild},`);
    console.log(`    pregnantWomen: ${data.pregnantWomen},`);
    console.log(`    familyPlanning: ${data.familyPlanning},`);
    console.log(`    infantsAndChildren: ${data.infantsAndChildren},`);
    console.log(`    mchip: ${data.mchip},`);
    console.log(`    mqbq: ${data.mqbq},`);
    console.log(`    mqbb: ${data.mqbb},`);
    console.log(`    mqbe: ${data.mqbe},`);
    console.log(`    bcc: ${data.bcc},`);
    console.log(`    refugees: ${data.refugees},`);
    console.log(`    documentedNonCitizens: ${data.documentedNonCitizens},`);
    console.log(`    emergencyServicesOnly: ${data.emergencyServicesOnly},`);
    console.log(`    covid19Medicaid: ${data.covid19Medicaid},`);
    console.log(`    medicaidExpansion: ${data.medicaidExpansion},`);
    console.log(`    countyTotal: ${data.countyTotal}`);
    console.log(`  }${isLast ? '' : ','}`);
});

console.log('};');

// Also output summary statistics
console.log('\n// Summary Statistics:');
console.log(`// Total counties processed: ${counties.length}`);
console.log(`// Total statewide enrollment: ${Object.values(medicaidData).reduce((sum, county) => sum + county.countyTotal, 0).toLocaleString()}`);