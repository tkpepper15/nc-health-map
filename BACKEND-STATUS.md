# Backend Status Indicators

Your NC Healthcare Map now includes comprehensive backend status indicators to help you understand which services are being used and how the application is performing.

## Status Indicators

### 1. **Header Status Badge** 
Located in the top header next to the title:
- 🟢 **Supabase** - Connected to Supabase database (production-ready)
- 🔵 **Vercel** - Running on Vercel with cloud services  
- 🟡 **Local** - Running locally with file-based data

### 2. **Detailed Status Panel**
Fixed indicator in bottom-right corner (click to expand):
- **Server Type**: Local, Vercel, or Supabase
- **Data Source**: Database, File, or Mock
- **Connection Status**: Connected, Fallback, or Error
- **Response Time**: API performance metrics
- **Environment Details**: Development/production info

## Server Types Explained

### 🟢 **Supabase Mode**
- **When**: Database connection successful
- **Data Source**: PostgreSQL database via Supabase
- **Performance**: Fastest queries, real-time updates
- **Best For**: Production deployment

### 🔵 **Vercel Mode** 
- **When**: Deployed on Vercel platform
- **Data Source**: Database or file fallbacks
- **Performance**: Global CDN, serverless functions
- **Best For**: Production with geographic distribution

### 🟡 **Local Mode**
- **When**: Running on localhost
- **Data Source**: Local files or development database
- **Performance**: Fast local access
- **Best For**: Development and testing

## Connection Status Types

### ✅ **Connected**
- Direct database connection active
- Real-time data access
- Optimal performance

### ⚠️ **Fallback** 
- Using file-based data backup
- Still functional but limited real-time updates
- Occurs when database is unavailable

### ❌ **Error**
- Connection issues detected
- May impact functionality
- Check network or configuration

## Technical Details

### API Metadata
Each API endpoint now returns detailed server information:
```json
{
  "metadata": {
    "source": "database|file|mock",
    "server_info": {
      "environment": "development|production",
      "is_vercel": false,
      "supabase_configured": true,
      "api_endpoint": "/api",
      "server_region": "local|us-east-1"
    }
  }
}
```

### Environment Variables
The indicators automatically detect:
- `VERCEL` - Vercel deployment
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase configuration
- `NODE_ENV` - Development vs production
- `VERCEL_REGION` - Deployment region

## Troubleshooting

### Status Shows "Local" When Expected "Supabase"
1. Check `.env.local` has correct Supabase credentials
2. Verify database schema is created
3. Test connection: `node test-supabase-connection.js`

### Status Shows "Fallback" 
1. Database may be temporarily unavailable
2. Check Supabase dashboard for issues
3. Application continues to work with file data

### Slow Response Times
1. Check network connection
2. Monitor Supabase dashboard performance
3. Consider database indexing for large datasets

## Benefits

- **Transparency**: Always know which backend you're using
- **Debugging**: Quick identification of connection issues  
- **Performance**: Monitor response times and optimize
- **Deployment**: Confirm correct environment configuration
- **Reliability**: Automatic fallbacks ensure app always works

The status indicators ensure you always understand your application's backend state, whether in development, testing, or production environments.