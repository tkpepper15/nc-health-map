// Test script to verify data pipeline
const fs = require('fs');

async function testDataPipeline() {
  console.log('🔍 Testing NC Healthcare Data Pipeline...\n');
  
  // 1. Check raw data files
  console.log('1. Checking raw data files:');
  const medicaidFile = './data/raw/medicaid/nc_medicaid_enrollment_jun_2025.csv';
  const sviFile = './data/raw/svi/svi_nc.csv';
  
  try {
    const medicaidExists = fs.existsSync(medicaidFile);
    const sviExists = fs.existsSync(sviFile);
    
    console.log(`   ✅ Medicaid CSV: ${medicaidExists ? 'Found' : 'Missing'}`);
    console.log(`   ✅ SVI CSV: ${sviExists ? 'Found' : 'Missing'}`);
    
    if (medicaidExists) {
      const medicaidContent = fs.readFileSync(medicaidFile, 'utf-8');
      const medicaidLines = medicaidContent.split('\n').length - 1;
      console.log(`   📊 Medicaid records: ${medicaidLines}`);
    }
    
    if (sviExists) {
      const sviContent = fs.readFileSync(sviFile, 'utf-8');  
      const sviLines = sviContent.split('\n').length - 1;
      console.log(`   📊 SVI records: ${sviLines}`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading files: ${error.message}`);
  }
  
  // 2. Test API endpoints
  console.log('\n2. Testing API endpoints:');
  
  try {
    // Process data
    console.log('   🔄 Processing raw data...');
    const processResponse = await fetch('http://localhost:3000/api/process-data', {
      method: 'POST',
    });
    
    if (processResponse.ok) {
      const processResult = await processResponse.json();
      console.log('   ✅ Data processing:', processResult.message);
      console.log(`   📈 Records processed: ${processResult.counts.combined_records}`);
    } else {
      console.log('   ❌ Processing failed:', processResponse.statusText);
    }
    
    // Get processed data
    console.log('   📡 Fetching processed healthcare data...');
    const dataResponse = await fetch('http://localhost:3000/api/healthcare-data');
    
    if (dataResponse.ok) {
      const dataResult = await dataResponse.json();
      console.log('   ✅ Healthcare data API working');
      console.log(`   📊 Counties returned: ${dataResult.data.length}`);
      
      // Show sample data
      if (dataResult.data.length > 0) {
        const sample = dataResult.data[0];
        console.log('\n3. Sample processed county data:');
        console.log(`   📍 County: ${sample.countyName}`);
        console.log(`   🔢 FIPS: ${sample.fips_code}`);
        console.log(`   ⚕️ HCVI Score: ${sample.hcvi_composite}`);
        console.log(`   ⚠️ Risk Category: ${sample.vulnerability_category}`);
        console.log(`   💊 Medicaid Enrollment: ${sample.medicaid_total_enrollment?.toLocaleString()}`);
        console.log(`   📊 Enrollment Rate: ${sample.medicaid_enrollment_rate?.toFixed(1)}%`);
        
        if (sample.svi_data) {
          console.log(`   🌍 SVI Overall: ${(sample.svi_data.svi_overall_percentile * 100).toFixed(1)}%`);
        }
      }
      
      // Check data quality
      console.log('\n4. Data quality check:');
      const complete = dataResult.data.filter(d => d.hcvi_composite > 0);
      const withMedicaid = dataResult.data.filter(d => d.medicaid_total_enrollment > 0);
      const withSVI = dataResult.data.filter(d => d.svi_data);
      
      console.log(`   ✅ Records with HCVI scores: ${complete.length}/${dataResult.data.length}`);
      console.log(`   ✅ Records with Medicaid data: ${withMedicaid.length}/${dataResult.data.length}`);
      console.log(`   ✅ Records with SVI data: ${withSVI.length}/${dataResult.data.length}`);
      
      // Distribution analysis
      const categories = {
        low: dataResult.data.filter(d => d.vulnerability_category === 'low').length,
        moderate: dataResult.data.filter(d => d.vulnerability_category === 'moderate').length,
        high: dataResult.data.filter(d => d.vulnerability_category === 'high').length,
        extreme: dataResult.data.filter(d => d.vulnerability_category === 'extreme').length
      };
      
      console.log('\n5. Vulnerability distribution:');
      console.log(`   🟢 Low risk: ${categories.low} counties`);
      console.log(`   🟡 Moderate risk: ${categories.moderate} counties`);
      console.log(`   🟠 High risk: ${categories.high} counties`);
      console.log(`   🔴 Extreme risk: ${categories.extreme} counties`);
      
    } else {
      console.log('   ❌ Healthcare data API failed:', dataResponse.statusText);
    }
    
  } catch (error) {
    console.log(`   ❌ API test error: ${error.message}`);
  }
  
  console.log('\n🎉 Data pipeline test complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Open browser to http://localhost:3000');  
  console.log('   2. Check browser console for "✅ Using real processed data from backend"');
  console.log('   3. Click "Update Data" button in sidebar');
  console.log('   4. Verify map shows real HCVI scores from CSV processing');
}

testDataPipeline().catch(console.error);