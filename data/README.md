# NC Healthcare Map - Data Sources

## 🗄️ Data Architecture

This application uses a **hybrid data architecture** with Supabase as the primary source and local files as fallback.

### **Primary: Supabase Database**
- **Healthcare Data**: `county_health_data` table with HCVI scores, SVI data, demographics
- **Hospital Data**: `hospitals` table with facility information and geospatial data
- **Real-time Updates**: Live data processing and API endpoints
- **Production Ready**: Scalable, fast queries with PostGIS support

### **Fallback: Local Files** 
- **County Boundaries**: `app/data/ncCountiesGeoJSON.ts` (essential for map rendering)
- **Mock Data**: `app/data/healthcareData.ts` (development/demo fallback)
- **Small Files Only**: Critical files under 50KB for Git repository

## 📁 Directory Structure

```
data/
├── README.md                    # This file (kept in Git)
├── raw/                        # Ignored - use Supabase instead
│   ├── medicaid/               # CSV files from NC DHHS
│   ├── svi/                    # CDC Social Vulnerability Index
│   └── hospitals/              # Healthcare facility data
└── processed/                  # Ignored - generated files

app/data/                       # Kept in Git - essential fallback files
├── ncCountiesGeoJSON.ts        # NC county boundaries (required)
└── healthcareData.ts           # Mock data for development
```

## 🔄 Data Flow

1. **Supabase First**: Application attempts to load from database
2. **Automatic Fallback**: If Supabase unavailable, uses local files
3. **Status Indicator**: Shows current data source (🟢 Supabase, 🟡 Local, 🔴 Error)
4. **Unified Format**: Same data structure regardless of source

## 📊 Data Sources

### Healthcare Vulnerability Index (HCVI)
- **Source**: Composite analysis combining multiple indicators
- **Update Frequency**: Monthly
- **Coverage**: All 100 NC counties

### Medicaid Enrollment
- **Source**: NC Department of Health and Human Services
- **Update Frequency**: Monthly
- **Latest**: June 2025 data

### Social Vulnerability Index (SVI)
- **Source**: CDC/ATSDR
- **Update Frequency**: Annual
- **Latest**: 2022 data with 16 vulnerability indicators

### Hospital Infrastructure
- **Source**: NC Division of Health Service Regulation
- **Update Frequency**: Quarterly
- **Coverage**: 150+ licensed facilities

## 🚀 Benefits of This Architecture

### **Development**
- Works offline with local data
- Fast iteration without database dependency
- Consistent interface regardless of data source

### **Production**
- Real-time data from Supabase
- Automatic fallbacks prevent downtime
- Scalable for multiple users

### **Deployment**
- Smaller Git repository (no large files)
- Faster clone/download times
- Cleaner version control

## ⚙️ Environment Setup

### **Local Development**
```bash
# App works immediately with fallback data
npm run dev
```

### **Production with Supabase**
```bash
# Set environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

npm run dev  # Will use Supabase automatically
```

## 📋 Data Management

### **Adding New Data**
1. Upload to Supabase tables using provided schema
2. Application automatically uses new data
3. No code changes required for data updates

### **Schema Updates**
- Modify `supabase-schema-complete.sql`
- Update TypeScript interfaces in `app/types/`
- Test with both Supabase and local fallback

### **Large Files**
- **Never commit** to Git (ignored by .gitignore)
- Store in Supabase or external storage
- Keep local copies for development only

This architecture ensures the application is both developer-friendly and production-ready while maintaining clean Git history and fast performance.