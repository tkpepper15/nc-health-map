/**
 * Supabase Client Configuration
 * Provides properly configured Supabase clients for different contexts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/environment';

export type Database = {
  public: {
    Tables: {
      healthcare_data: {
        Row: {
          fips_code: string;
          county_name: string;
          hcvi_composite: number | null;
          vulnerability_category: string | null;
          medicaid_enrollment_rate: number | null;
          population_2020: number | null;
          is_rural: boolean | null;
          created_at: string;
          updated_at: string;
          svi_overall_percentile: number | null;
          socioeconomic_percentile: number | null;
          household_composition_percentile: number | null;
          racial_minority_percentile: number | null;
          housing_transport_percentile: number | null;
        };
        Insert: Omit<Database['public']['Tables']['healthcare_data']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['healthcare_data']['Insert']>;
      };
      hospitals: {
        Row: {
          id: string;
          facility_name: string;
          alt_name: string | null;
          county: string;
          city: string;
          facility_type: string;
          total_beds: number | null;
          general_beds: number | null;
          total_surgery_rooms: number | null;
          is_major_hospital: boolean;
          is_emergency_dept: boolean;
          latitude: number;
          longitude: number;
          address: string | null;
          phone: string | null;
          licensee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hospitals']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>;
      };
    };
    Views: {
      // Define views here if needed
    };
    Functions: {
      // Define functions here if needed
    };
  };
};

/**
 * Public client for client-side operations
 * Uses anon key and RLS policies
 */
export const supabaseClient: SupabaseClient<Database> = createClient(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Application-Name': 'NC-Health-Map',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Admin client for server-side operations
 * Uses service role key - NEVER expose to client
 */
export const supabaseAdmin: SupabaseClient<Database> | null = env.supabase.serviceRoleKey
  ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'X-Application-Name': 'NC-Health-Map-Admin',
        },
      },
    })
  : null;

/**
 * Health check for Supabase connection
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    const { error } = await supabaseClient
      .from('healthcare_data')
      .select('fips_code')
      .limit(1);
      
    if (error) {
      return { connected: false, error: error.message };
    }
    
    const latency = Date.now() - start;
    return { connected: true, latency };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}