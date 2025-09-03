const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning county data - removing invalid FIPS codes...');

// Read the HCVI processed data
const hcviPath = path.join(__dirname, '../data/processed/hcvi_processed_2025-08-21T17-08-31-214Z.json');
const data = JSON.parse(fs.readFileSync(hcviPath, 'utf8'));

console.log(`📊 Original record count: ${data.length}`);

// Remove invalid FIPS codes (37999 is not a valid NC county)
const validData = data.filter(record => {
  const fips = record.fips_code;
  
  // Valid NC county FIPS codes are 37001, 37003, 37005, ..., 37199 (odd numbers only)
  // Also exclude any non-standard FIPS like 37999
  const isValidNCFips = /^37[0-1][0-9][13579]$/.test(fips) && fips <= '37199';
  
  if (!isValidNCFips) {
    console.log(`❌ Removing invalid FIPS: ${fips} (${record.countyName || 'Unknown'})`);
    return false;
  }
  
  return true;
});

console.log(`✅ Cleaned record count: ${validData.length}`);

// Write cleaned data
const cleanedPath = path.join(__dirname, '../data/processed/hcvi_processed_cleaned.json');
fs.writeFileSync(cleanedPath, JSON.stringify(validData, null, 2));

console.log(`💾 Cleaned data written to: ${cleanedPath}`);

// Verify we have exactly 100 NC counties
if (validData.length === 100) {
  console.log('✅ Perfect! Exactly 100 NC counties as expected.');
} else {
  console.log(`⚠️  Warning: Found ${validData.length} counties, expected 100.`);
}