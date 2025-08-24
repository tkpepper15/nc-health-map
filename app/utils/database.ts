import { supabase } from './supabase'

export interface CountyHealthData {
  fips_code: string
  county_name: string
  hcvi_composite: number
  vulnerability_category: string
  medicaid_enrollment_rate?: number
  total_population?: number
  population_2020?: number
  is_rural?: boolean
  healthcare_access_score?: number
  policy_risk_score?: number
  economic_vulnerability_score?: number
  [key: string]: unknown
}

export interface Hospital {
  id: string
  name: string
  county_fips: string
  latitude: number
  longitude: number
  hospital_type: string
  operating_margin?: number
  closure_risk?: string
  [key: string]: unknown
}

export async function getHealthcareData(filters?: {
  counties?: string[]
  aggregated?: boolean
}): Promise<{ data: CountyHealthData[], error?: string }> {
  try {
    let query = supabase
      .from('county_health_data')
      .select('*')

    if (filters?.counties && filters.counties.length > 0) {
      query = query.in('fips_code', filters.counties)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return { data: [], error: error.message }
    }

    let processedData = data || []

    // Return aggregated data for performance if requested
    if (filters?.aggregated) {
      processedData = processedData.map(item => ({
        fips_code: item.fips_code,
        county_name: item.county_name,
        hcvi_composite: item.hcvi_composite,
        vulnerability_category: item.vulnerability_category,
        vulnerability_color: getVulnerabilityColor(item.vulnerability_category),
        medicaid_enrollment_rate: item.medicaid_enrollment_rate,
        is_rural: (item.total_population || item.population_2020) < 50000
      }))
    }

    return { data: processedData }
  } catch (error) {
    console.error('Failed to fetch healthcare data:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    }
  }
}

export async function getHospitalData(countyFips?: string): Promise<{ data: Hospital[], error?: string }> {
  try {
    let query = supabase
      .from('hospitals')
      .select('*')

    if (countyFips) {
      query = query.eq('county_fips', countyFips)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Failed to fetch hospital data:', error)
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    }
  }
}

// Helper function to get vulnerability colors
function getVulnerabilityColor(category: string): string {
  const colors = {
    'low': '#2E8B57',      // Sea Green
    'moderate': '#FFA500', // Orange  
    'high': '#FF6347',     // Tomato
    'extreme': '#DC143C'   // Crimson
  }
  
  return colors[category as keyof typeof colors] || '#e5e7eb'
}