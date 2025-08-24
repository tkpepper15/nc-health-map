/**
 * Healthcare Data Service
 * Centralized service for all healthcare-related data operations
 */

import { supabaseClient } from '../supabase/client';
import { HealthcareMetrics } from '../types';
import { ServiceResponse } from './types';

export interface HealthcareDataFilters {
  county?: string;
  fipsCode?: string;
  isRural?: boolean;
  vulnerabilityCategory?: string;
  medicaidRateRange?: [number, number];
}

export interface HealthcareDataOptions {
  includeGeometry?: boolean;
  includeHospitals?: boolean;
  includeSVI?: boolean;
  orderBy?: 'county_name' | 'hcvi_composite' | 'medicaid_enrollment_rate';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
}

class HealthcareService {
  /**
   * Fetch healthcare data with optional filters and includes
   */
  async getHealthcareData(
    filters: HealthcareDataFilters = {},
    options: HealthcareDataOptions = {}
  ): Promise<ServiceResponse<HealthcareMetrics[]>> {
    try {
      let query = supabaseClient
        .from('healthcare_data')
        .select(`
          fips_code,
          county_name,
          hcvi_composite,
          vulnerability_category,
          medicaid_enrollment_rate,
          medicaid_total_enrollment,
          medicaid_expansion_enrollment,
          medicaid_traditional_enrollment,
          population_2020,
          is_rural,
          svi_overall_percentile,
          socioeconomic_percentile,
          household_composition_percentile,
          racial_minority_percentile,
          housing_transport_percentile,
          created_at,
          updated_at
        `);

      // Apply filters
      if (filters.county) {
        query = query.ilike('county_name', `%${filters.county}%`);
      }
      if (filters.fipsCode) {
        query = query.eq('fips_code', filters.fipsCode);
      }
      if (filters.isRural !== undefined) {
        query = query.eq('is_rural', filters.isRural);
      }
      if (filters.vulnerabilityCategory) {
        query = query.eq('vulnerability_category', filters.vulnerabilityCategory);
      }
      if (filters.medicaidRateRange) {
        const [min, max] = filters.medicaidRateRange;
        query = query.gte('medicaid_enrollment_rate', min).lte('medicaid_enrollment_rate', max);
      }

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch healthcare data: ${error.message}`,
          data: null,
        };
      }

      const transformedData = data.map(this.transformHealthcareData);

      return {
        success: true,
        data: transformedData,
        metadata: {
          count: transformedData.length,
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Get healthcare data for a specific county
   */
  async getCountyHealthcareData(fipsCode: string): Promise<ServiceResponse<HealthcareMetrics>> {
    const response = await this.getHealthcareData({ fipsCode });
    
    if (!response.success || !response.data?.length) {
      return {
        success: false,
        error: `No healthcare data found for FIPS code: ${fipsCode}`,
        data: null,
      };
    }

    return {
      success: true,
      data: response.data[0],
      metadata: response.metadata,
    };
  }

  /**
   * Get summary statistics for healthcare data
   */
  async getHealthcareSummary(): Promise<ServiceResponse<{
    totalCounties: number;
    averageMedicaidRate: number;
    ruralCounties: number;
    urbanCounties: number;
    highVulnerabilityCounties: number;
  }>> {
    try {
      const { data, error } = await supabaseClient
        .from('healthcare_data')
        .select('is_rural, medicaid_enrollment_rate, vulnerability_category');

      if (error) {
        return {
          success: false,
          error: `Failed to fetch summary: ${error.message}`,
          data: null,
        };
      }

      const summary = {
        totalCounties: data.length,
        averageMedicaidRate: data
          .filter(d => d.medicaid_enrollment_rate !== null)
          .reduce((sum, d) => sum + (d.medicaid_enrollment_rate || 0), 0) / data.length,
        ruralCounties: data.filter(d => d.is_rural).length,
        urbanCounties: data.filter(d => !d.is_rural).length,
        highVulnerabilityCounties: data.filter(d => 
          d.vulnerability_category === 'high' || d.vulnerability_category === 'extreme'
        ).length,
      };

      return {
        success: true,
        data: summary,
        metadata: {
          source: 'supabase',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: null,
      };
    }
  }

  /**
   * Transform raw database data to frontend format
   */
  private transformHealthcareData(rawData: any): HealthcareMetrics {
    return {
      countyId: rawData.fips_code,
      countyName: rawData.county_name,
      fips_code: rawData.fips_code,
      vulnerability_category: rawData.vulnerability_category || 'unknown',
      vulnerability_color: this.getVulnerabilityColor(rawData.vulnerability_category),
      hcvi_composite: rawData.hcvi_composite,
      
      // Medicaid data
      medicaid_enrollment_rate: rawData.medicaid_enrollment_rate,
      medicaid_total_enrollment: rawData.medicaid_total_enrollment,
      medicaid_expansion_enrollment: rawData.medicaid_expansion_enrollment,
      medicaid_traditional_enrollment: rawData.medicaid_traditional_enrollment,
      medicaid_dependency_ratio: null, // Calculate if needed
      
      // Demographics
      population_2020: rawData.population_2020,
      is_rural: rawData.is_rural || false,
      
      // SVI data
      svi_data: {
        fips_code: rawData.fips_code,
        county_name: rawData.county_name,
        svi_overall_percentile: rawData.svi_overall_percentile,
        socioeconomic_percentile: rawData.socioeconomic_percentile,
        household_composition_percentile: rawData.household_composition_percentile,
        racial_minority_percentile: rawData.racial_minority_percentile,
        housing_transport_percentile: rawData.housing_transport_percentile,
      },
      
      // Placeholder structures for complex nested data
      policy_risk_score: null,
      healthcare_access_score: null,
      economic_vulnerability_score: null,
      
      healthcareAccess: {
        providerDensity: null,
        geographicAccess: null,
        specialtyServices: null,
        insuranceCoverage: null,
        score: null,
      },
      
      policyRisk: {
        medicaidDependency: null,
        federalFundingReliance: null,
        snapVulnerability: null,
        workRequirementImpact: null,
        score: null,
      },
      
      economicVulnerability: {
        hospitalFinancialHealth: null,
        privateEquityExposure: null,
        healthcareEmployment: null,
        socialDeterminants: null,
        score: null,
      },
      
      hcvi: {
        score: rawData.hcvi_composite,
        ranking: null,
        category: this.getVulnerabilityCategory(rawData.hcvi_composite),
        color: this.getVulnerabilityColor(rawData.vulnerability_category),
      },
    };
  }

  /**
   * Get vulnerability category based on HCVI score
   */
  private getVulnerabilityCategory(score: number | null): 'low' | 'moderate' | 'high' | 'extreme' | 'unknown' {
    if (score === null) return 'unknown';
    if (score >= 8) return 'extreme';
    if (score >= 6) return 'high';
    if (score >= 4) return 'moderate';
    return 'low';
  }

  /**
   * Get color for vulnerability category
   */
  private getVulnerabilityColor(category: string | null): string {
    const colors = {
      extreme: '#dc2626', // Red
      high: '#ea580c',    // Orange
      moderate: '#d97706', // Amber
      low: '#16a34a',     // Green
      unknown: '#6b7280', // Gray
    };
    return colors[category as keyof typeof colors] || colors.unknown;
  }
}

export const healthcareService = new HealthcareService();