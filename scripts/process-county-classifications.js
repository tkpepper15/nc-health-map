/**
 * NC County Classifications Processor
 * Processes the county classification data from the PDF and creates a structured JSON file
 * Based on Afonso 2016 classifications: Urban, Suburban, Rural, Tourism
 */

const fs = require('fs');
const path = require('path');

// County classifications from the PDF
const countyClassifications = {
  // Urban counties (major metropolitan areas)
  "Urban": [
    "Buncombe", "Cumberland", "Durham", "Forsyth", "Gaston", "Guilford", 
    "Mecklenburg", "New Hanover", "Union", "Wake"
  ],
  
  // Suburban counties (adjacent to urban areas)
  "Suburban": [
    "Currituck", "Franklin", "Gates", "Lincoln", "Rowan"
  ],
  
  // Tourism counties (tourism-dependent economies)
  "Tourism": [
    "Alamance", "Brunswick", "Cabarrus", "Carteret", "Catawba", "Dare", 
    "Haywood", "Henderson", "Iredell", "Jackson", "Johnston", "Moore", 
    "Nash", "Onslow", "Orange", "Pitt", "Rutherford", "Swain", "Watauga"
  ],
  
  // Rural counties (all others)
  "Rural": [
    "Alexander", "Alleghany", "Anson", "Ashe", "Avery", "Beaufort", "Bertie", 
    "Bladen", "Burke", "Caldwell", "Camden", "Caswell", "Chatham", "Cherokee", 
    "Chowan", "Clay", "Cleveland", "Columbus", "Craven", "Davidson", "Davie", 
    "Duplin", "Edgecombe", "Graham", "Granville", "Greene", "Halifax", "Harnett", 
    "Hertford", "Hoke", "Hyde", "Jones", "Lee", "Lenoir", "Macon", "Madison", 
    "Martin", "McDowell", "Mitchell", "Montgomery", "Northampton", "Pamlico", 
    "Pasquotank", "Pender", "Perquimans", "Person", "Polk", "Randolph", 
    "Richmond", "Robeson", "Rockingham", "Sampson", "Scotland", "Stanly", 
    "Stokes", "Surry", "Transylvania", "Tyrrell", "Vance", "Warren", 
    "Washington", "Wayne", "Wilkes", "Wilson", "Yadkin", "Yancey"
  ]
};

// FIPS code mapping for NC counties
const ncFipsCodes = {
  "Alamance": "37001", "Alexander": "37003", "Alleghany": "37005", "Anson": "37007",
  "Ashe": "37009", "Avery": "37011", "Beaufort": "37013", "Bertie": "37015",
  "Bladen": "37017", "Brunswick": "37019", "Buncombe": "37021", "Burke": "37023",
  "Cabarrus": "37025", "Caldwell": "37027", "Camden": "37029", "Carteret": "37031",
  "Caswell": "37033", "Catawba": "37035", "Chatham": "37037", "Cherokee": "37039",
  "Chowan": "37041", "Clay": "37043", "Cleveland": "37045", "Columbus": "37047",
  "Craven": "37049", "Cumberland": "37051", "Currituck": "37053", "Dare": "37055",
  "Davidson": "37057", "Davie": "37059", "Duplin": "37061", "Durham": "37063",
  "Edgecombe": "37065", "Forsyth": "37067", "Franklin": "37069", "Gaston": "37071",
  "Gates": "37073", "Graham": "37075", "Granville": "37077", "Greene": "37079",
  "Guilford": "37081", "Halifax": "37083", "Harnett": "37085", "Haywood": "37087",
  "Henderson": "37089", "Hertford": "37091", "Hoke": "37093", "Hyde": "37095",
  "Iredell": "37097", "Jackson": "37099", "Johnston": "37101", "Jones": "37103",
  "Lee": "37105", "Lenoir": "37107", "Lincoln": "37109", "McDowell": "37111", "Macon": "37113",
  "Madison": "37115", "Martin": "37117", "Mecklenburg": "37119", "Mitchell": "37121",
  "Montgomery": "37123", "Moore": "37125", "Nash": "37127", "New Hanover": "37129",
  "Northampton": "37131", "Onslow": "37133", "Orange": "37135", "Pamlico": "37137",
  "Pasquotank": "37139", "Pender": "37141", "Perquimans": "37143", "Person": "37145",
  "Pitt": "37147", "Polk": "37149", "Randolph": "37151", "Richmond": "37153",
  "Robeson": "37155", "Rockingham": "37157", "Rowan": "37159", "Rutherford": "37161",
  "Sampson": "37163", "Scotland": "37165", "Stanly": "37167", "Stokes": "37169",
  "Surry": "37171", "Swain": "37173", "Transylvania": "37175", "Tyrrell": "37177",
  "Union": "37179", "Vance": "37181", "Wake": "37183", "Warren": "37185",
  "Washington": "37187", "Watauga": "37189", "Wayne": "37191", "Wilkes": "37193",
  "Wilson": "37195", "Yadkin": "37197", "Yancey": "37199"
};

function createClassificationData() {
  const classificationData = {};
  
  // Process each classification type
  for (const [classification, counties] of Object.entries(countyClassifications)) {
    for (const county of counties) {
      const fipsCode = ncFipsCodes[county];
      if (fipsCode) {
        classificationData[fipsCode] = {
          county_name: county,
          classification: classification.toLowerCase(),
          fips_code: fipsCode,
          classification_source: "Afonso 2016, updated 2024",
          notes: getClassificationNotes(classification.toLowerCase())
        };
      } else {
        console.warn(`Warning: No FIPS code found for county: ${county}`);
      }
    }
  }
  
  return classificationData;
}

function getClassificationNotes(classification) {
  const notes = {
    "urban": "Major metropolitan area with high population density and economic activity",
    "suburban": "Adjacent to urban areas, mixed residential and commercial development", 
    "tourism": "Economy significantly dependent on tourism industry",
    "rural": "Lower population density, agriculture or resource-based economy"
  };
  
  return notes[classification] || "";
}

function generateClassificationSummary(data) {
  const summary = {
    total_counties: Object.keys(data).length,
    by_classification: {},
    data_source: "The Equity of Local Sales Tax Distributions in Urban, Suburban, Rural, and Tourism-rich counties in North Carolina (Afonso 2016)",
    last_updated: new Date().toISOString().split('T')[0]
  };
  
  for (const county of Object.values(data)) {
    if (!summary.by_classification[county.classification]) {
      summary.by_classification[county.classification] = 0;
    }
    summary.by_classification[county.classification]++;
  }
  
  return summary;
}

// Main processing function
function processClassifications() {
  console.log('🏛️  Processing NC County Classifications...\n');
  
  try {
    // Create classification data
    const classificationData = createClassificationData();
    const summary = generateClassificationSummary(classificationData);
    
    // Create output structure
    const output = {
      metadata: {
        title: "North Carolina County Classifications",
        description: "County classifications for Urban, Suburban, Rural, and Tourism-rich counties",
        source: "Afonso 2016, Public Finance Review 44(6):691-721, updated with recent data",
        total_counties: summary.total_counties,
        classifications: summary.by_classification,
        processed_date: new Date().toISOString()
      },
      counties: classificationData
    };
    
    // Write to JSON file
    const outputPath = path.join(__dirname, '../data/processed/nc-county-classifications.json');
    
    // Ensure directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log('✅ Classification processing completed!');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Processed ${summary.total_counties} counties:`);
    
    for (const [classification, count] of Object.entries(summary.by_classification)) {
      console.log(`   ${classification.charAt(0).toUpperCase() + classification.slice(1)}: ${count} counties`);
    }
    
    console.log('\n🔍 Sample classifications:');
    const samples = [
      { name: 'Mecklenburg', type: 'Urban' },
      { name: 'Rowan', type: 'Suburban' },
      { name: 'Dare', type: 'Tourism' },
      { name: 'Columbus', type: 'Rural' }
    ];
    
    samples.forEach(sample => {
      const county = Object.values(classificationData).find(c => c.county_name === sample.name);
      if (county) {
        console.log(`   ${sample.name} County (${county.fips_code}): ${county.classification}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing classifications:', error.message);
    process.exit(1);
  }
}

// Run the processor
if (require.main === module) {
  processClassifications();
}

module.exports = { processClassifications, countyClassifications, ncFipsCodes };