#!/usr/bin/env node
const { migrateCountyDataWithSVI, migrateHospitalData } = require('./update-supabase-data')

const args = process.argv.slice(2)
const command = args[0]

async function showHelp() {
    console.log(`
🏥 NC Healthcare Map - Supabase Data Update CLI

Usage:
  node scripts/cli-update.js [command]

Commands:
  counties    Update county health and SVI data only
  hospitals   Update hospital data only  
  all         Update all data (counties + hospitals)
  help        Show this help message

Examples:
  node scripts/cli-update.js all        # Full data update
  node scripts/cli-update.js counties   # Update county data with latest SVI
  node scripts/cli-update.js hospitals  # Update hospital data only

Requirements:
  - .env.local with Supabase credentials configured
  - Data files in data/processed/ and data/raw/ directories
  - Supabase schema already created

The CLI will automatically:
  ✅ Merge your latest processed HCVI data
  ✅ Integrate SVI data from CSV files  
  ✅ Update hospital information
  ✅ Handle data validation and error recovery
`)
}

async function main() {
    console.log('🏥 NC Healthcare Map Data Updater\n')
    
    switch (command) {
        case 'counties':
            console.log('🔄 Updating county health and SVI data...')
            await migrateCountyDataWithSVI()
            break
            
        case 'hospitals':
            console.log('🔄 Updating hospital data...')
            await migrateHospitalData()
            break
            
        case 'all':
        case undefined:
            console.log('🔄 Updating all data (counties + hospitals)...')
            await migrateCountyDataWithSVI()
            await migrateHospitalData()
            break
            
        case 'help':
        case '--help':
        case '-h':
            await showHelp()
            return
            
        default:
            console.error(`❌ Unknown command: ${command}`)
            console.log('Run "node scripts/cli-update.js help" for usage information')
            process.exit(1)
    }
    
    console.log('\n✅ Data update completed!')
    console.log('🚀 Your Supabase database is now up to date')
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Update failed:', error)
        process.exit(1)
    })
}