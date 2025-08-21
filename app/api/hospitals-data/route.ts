import { NextRequest, NextResponse } from 'next/server';
import { getHospitalData } from '../../utils/database';
import { promises as fs } from 'fs';
import path from 'path';

// GET endpoint to serve hospital data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const countyFips = searchParams.get('county_fips');

    let hospitalsData;
    let dataSource = 'database';
    
    // Try to get data from Supabase first
    const dbResult = await getHospitalData(countyFips || undefined);
    
    if (dbResult.error || dbResult.data.length === 0) {
      console.log('No database data found, falling back to file');
      dataSource = 'file';
      
      // Load hospital GeoJSON data from file
      const hospitalsFile = path.join(process.cwd(), 'data', 'raw', 'hospitals', 'Hospitals.geojson');
      
      try {
        const fileContent = await fs.readFile(hospitalsFile, 'utf-8');
        const geoJson = JSON.parse(fileContent);
        
        // Transform GeoJSON features into flat data structure
        hospitalsData = geoJson.features.map((feature: any, index: number) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        return {
          id: props.objectid || index + 1,
          facility_name: props.facility || 'Unknown Facility',
          alt_name: props.altfacname || props.facility,
          licensee: props.licensee || 'N/A',
          license_number: props.licno || 'N/A',
          facility_type: props.hltype || 'Hospital',
          service_type: props.stype || 'HL',
          
          // Location data
          county: props.fcounty || 'Unknown',
          city: props.fcity || 'Unknown',
          state: props.fstate || 'NC',
          zip: props.fzip || 'N/A',
          address: props.faddr1 || 'N/A',
          phone: props.fphone || 'N/A',
          latitude: coords[1],
          longitude: coords[0],
          
          // Capacity data (licensed beds)
          general_beds: props.hgenlic || 0,
          rehab_beds: props.rehabhlic || 0,
          psych_beds: props.psylic || 0,
          substance_abuse_beds: props.salic || 0,
          nursing_facility_beds: props.nfgenlic || 0,
          
          // Operating room data
          cardiac_surgery_rooms: props.orheart_hl || 0,
          cesarean_rooms: props.orcsect_hl || 0,
          ambulatory_surgery_rooms: props.oramsu_hl || 0,
          shared_rooms: props.orshare_hl || 0,
          endoscopy_rooms: props.orendo_hl || 0,
          other_surgery_rooms: props.orother_hl || 0,
          
          // Calculated metrics
          total_beds: (props.hgenlic || 0) + (props.rehabhlic || 0) + (props.psylic || 0) + (props.nfgenlic || 0),
          total_surgery_rooms: (props.orheart_hl || 0) + (props.orcsect_hl || 0) + (props.oramsu_hl || 0) + 
                              (props.orshare_hl || 0) + (props.orendo_hl || 0) + (props.orother_hl || 0),
          
          // Facility classification
          is_major_hospital: (props.hgenlic || 0) >= 100,
          is_specialty: props.hltype === 'S',
          is_emergency_dept: props.hltype === 'ED',
          is_ltac: props.hltype === 'LTAC',
          is_rehab: props.hltype === 'Rehab',
          
          last_updated: new Date().toISOString()
        };
        });
        
        console.log(`✅ Loaded ${hospitalsData.length} hospital facilities from file`);
        
      } catch (error) {
        console.error('Failed to load hospital data:', error);
        return NextResponse.json({
          error: 'Failed to load hospital data',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      hospitalsData = dbResult.data;
      console.log(`✅ Loaded ${hospitalsData.length} hospital facilities from database`);
    }

    const response = {
      data: hospitalsData,
      metadata: {
        source: dataSource === 'database' ? 'database' : 'file',
        source_description: dataSource === 'database' ? 'Supabase Database' : 'NC Division of Health Service Regulation',
        type: 'hospitals',
        count: hospitalsData.length,
        timestamp: new Date().toISOString(),
        data_vintage: '2024',
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
      const csv = convertToCSV(hospitalsData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="nc_hospitals_data_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to serve hospital data:', error);
    
    return NextResponse.json({
      error: 'Failed to load hospital data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Convert data to CSV format
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
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