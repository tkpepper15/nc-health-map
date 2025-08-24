/**
 * Environment Configuration
 * Centralizes all environment variable handling with proper validation
 */

export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  app: {
    environment: 'development' | 'staging' | 'production';
    baseUrl: string;
    version: string;
  };
  features: {
    enableHospitalLayer: boolean;
    enableSVI: boolean;
    enableAnalytics: boolean;
  };
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfig(): EnvironmentConfig {
    return {
      supabase: {
        url: this.getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
        anonKey: this.getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      app: {
        environment: (process.env.NODE_ENV as any) || 'development',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      },
      features: {
        enableHospitalLayer: process.env.NEXT_PUBLIC_ENABLE_HOSPITAL_LAYER === 'true',
        enableSVI: process.env.NEXT_PUBLIC_ENABLE_SVI !== 'false',
        enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      },
    };
  }

  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is missing`);
    }
    return value;
  }

  private validateConfig(): void {
    const { supabase } = this.config;
    
    if (!supabase.url.startsWith('https://')) {
      throw new Error('Supabase URL must be HTTPS');
    }

    if (supabase.anonKey.length < 20) {
      throw new Error('Supabase anonymous key appears to be invalid');
    }
  }

  public get(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
}

export const env = Environment.getInstance().get();
export const { isDevelopment, isProduction } = Environment.getInstance();