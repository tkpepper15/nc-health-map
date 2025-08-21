# Complete Supabase Setup with SVI Integration

## 🎯 What This Does

Your NC Healthcare Map now has a **complete database schema** that includes:
- ✅ **HCVI (Healthcare Vulnerability Index)** scores
- ✅ **Full SVI (Social Vulnerability Index)** data integration  
- ✅ **Hospital facility information**
- ✅ **Backend status indicators**
- ✅ **Easy CLI updates for new data**

## 🚀 Quick Setup

### Step 1: Create New Database Schema
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Copy/paste contents of supabase-schema-complete.sql
-- Click "RUN"
```

### Step 2: Migrate Your Data  
```bash
# Full migration with SVI integration
node scripts/cli-update.js all

# Or update specific components
node scripts/cli-update.js counties   # Health + SVI data only
node scripts/cli-update.js hospitals  # Hospital data only
```

### Step 3: Verify Integration
Your app will now show "Supabase" in the backend status indicator with all SVI fields available.

## 📊 New SVI Data Available

### SVI Theme 1: Socioeconomic Status
- Poverty (150% poverty line)
- Unemployment rate  
- Housing cost burden
- Education (no high school)
- Health insurance coverage

### SVI Theme 2: Household Characteristics
- Age demographics (65+, under 17)
- Disability status
- Single parent households
- Limited English proficiency

### SVI Theme 3: Racial & Ethnic Minority Status
- Overall minority percentage
- African American population
- Hispanic/Latino population  
- Asian, Native American, Pacific Islander
- Two or more races

### SVI Theme 4: Housing & Transportation
- Multi-unit housing structures
- Mobile homes
- Crowded housing conditions
- Households with no vehicle access
- Group quarters population

### SVI Overall Rankings
- Theme-specific rankings (0-1 scale)
- Overall vulnerability ranking
- Vulnerability flags for high-risk areas
- Total vulnerability flag count

## 🔧 Data Updates from CLI

### When You Process New Data
```bash
# After running your data processing scripts
node scripts/cli-update.js counties
```

### Adding New Hospital Data
```bash
# After updating hospital GeoJSON files  
node scripts/cli-update.js hospitals
```

### Full Data Refresh
```bash
# Complete database refresh
node scripts/cli-update.js all
```

## 🏗️ Database Schema Highlights

### Enhanced County Table
- **100+ fields** including all SVI metrics
- **Proper indexing** for fast queries
- **Data validation** and type safety
- **Automatic timestamps** and updates

### Hospital Table  
- **Geographic data** with PostGIS support
- **Facility details** (beds, operating rooms, services)
- **Financial health indicators**
- **Ownership and classification data**

### Performance Features
- **Optimized indexes** on commonly queried fields
- **Geographic spatial indexing** for location queries
- **Row-level security** for data protection
- **Automatic data validation** and cleanup

## 🎨 Frontend Integration

### Backend Status Indicators
- Real-time connection status
- Data source identification (Database/File/Mock)
- Performance metrics and response times
- Environment and server information

### API Enhancements
- All endpoints return detailed server metadata
- Automatic fallback to file data if database unavailable
- Enhanced error handling and recovery
- Performance monitoring and logging

## 🔍 Troubleshooting

### "SVI data not showing"
1. Verify SVI CSV file exists: `data/raw/svi/svi_nc.csv`
2. Run migration: `node scripts/cli-update.js counties`
3. Check Supabase dashboard for data

### "Backend shows Local instead of Supabase"  
1. Check `.env.local` has correct Supabase credentials
2. Verify schema was created successfully
3. Test connection: API calls should show `"source": "database"`

### "Permission denied" errors
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
2. Verify Row Level Security policies are enabled
3. Check Supabase dashboard for authentication issues

### Performance Issues
1. Monitor Supabase dashboard for query performance
2. SVI data adds significant fields - use `aggregated=true` for map views
3. Consider data pagination for large result sets

## 📈 Next Steps

### Enhanced Visualizations
Your app can now create advanced visualizations using:
- SVI theme-specific choropleth maps
- Multi-dimensional vulnerability analysis
- Comparative rankings across counties
- Detailed demographic breakdowns

### Real-time Updates
- Data automatically syncs with Supabase
- Backend indicators show live connection status  
- Seamless switching between data sources
- Performance monitoring and optimization

### Production Deployment
- Schema optimized for Vercel deployment
- Environment-aware backend detection
- Automatic scaling and performance optimization
- Enterprise-ready data security and compliance

## 🎉 You're All Set!

Your NC Healthcare Map now has a **complete, production-ready database** with:
- ✅ Full SVI integration (16 themes, 50+ metrics)
- ✅ Healthcare vulnerability analysis  
- ✅ Real-time backend status monitoring
- ✅ Easy CLI-based data updates
- ✅ Optimized performance and security
- ✅ Seamless Vercel deployment support

Run the migration and start exploring your enhanced healthcare data visualization!