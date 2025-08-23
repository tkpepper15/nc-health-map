import { NextRequest, NextResponse } from 'next/server';
import { getHealthcareData } from '../../utils/database';
import { promises as fs } from 'fs';
import path from 'path';
import { HealthcareMetrics } from '../../types/healthcare';

// GET endpoint to serve processed healthcare data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const counties = searchParams.get('counties'); // comma-separated FIPS codes
    const aggregated = searchParams.get('aggregated') === 'true';
    
    let data;
    let dataSource = 'database';
    
    // Try to get data from Supabase first
    const filters = {
      counties: counties ? counties.split(',').map(c => c.trim()) : undefined,
      aggregated
    };
    
    const dbResult = await getHealthcareData(filters);
    
    if (dbResult.error || dbResult.data.length === 0) {
      console.log('No database data found, falling back to files');
      
      // Try to load processed data from files
      const processedDir = path.join(process.cwd(), 'data', 'processed');
      const latestFile = path.join(processedDir, 'hcvi_latest.json');
      
      try {
        const fileContent = await fs.readFile(latestFile, 'utf-8');
        data = JSON.parse(fileContent);
        dataSource = 'file';
        
        // Filter by counties if specified
        if (counties) {
          const countyList = counties.split(',').map(c => c.trim());
          data = (data as HealthcareMetrics[]).filter((item: HealthcareMetrics) => countyList.includes(item.fips_code));
        }
        
        // Return aggregated data for map display (performance optimization)
        if (aggregated) {
          data = (data as HealthcareMetrics[]).map((item: HealthcareMetrics) => ({
            fips_code: item.fips_code,
            county_name: item.countyName,
            hcvi_composite: item.hcvi_composite,
            vulnerability_category: item.vulnerability_category,
            vulnerability_color: getVulnerabilityColor(item.vulnerability_category),
            medicaid_enrollment_rate: item.medicaid_enrollment_rate,
            is_rural: (item.population_2020 || 0) < 50000
          }));
        }
      } catch {
        console.log('No processed data found, no fallback available');
        // No fallback data available
        return NextResponse.json({
          error: 'No healthcare data available',
          message: 'Database connection failed and no processed data files found'
        }, { status: 503 });
      }
    } else {
      data = dbResult.data;
    }
    
    const response = {
      data,
      metadata: {
        source: dataSource,
        count: data.length,
        timestamp: new Date().toISOString(),
        aggregated,
        server_info: {
          environment: process.env.NODE_ENV,
          is_vercel: !!process.env.VERCEL,
          supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          api_endpoint: process.env.NEXT_PUBLIC_API_URL || '/api',
          server_region: process.env.VERCEL_REGION || 'local'
        },
        ...(dbResult.error && { fallback_reason: dbResult.error })
      }
    };
    
    // Return appropriate format
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="nc_healthcare_data_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Failed to serve healthcare data:', error);
    
    return NextResponse.json({
      error: 'Failed to load healthcare data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to get vulnerability colors
function getVulnerabilityColor(category: string): string {
  const colors = {
    'low': '#2E8B57',      // Sea Green
    'moderate': '#FFA500', // Orange  
    'high': '#FF6347',     // Tomato
    'extreme': '#DC143C'   // Crimson
  };
  
  return colors[category as keyof typeof colors] || '#e5e7eb';
}

// Convert data to CSV format
function convertToCSV(data: HealthcareMetrics[]): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = (row as unknown as Record<string, unknown>)[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}