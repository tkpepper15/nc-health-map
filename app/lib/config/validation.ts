/**
 * Environment Configuration Validation
 * Validates and provides default values for environment variables
 */

interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  defaultValue?: string | number | boolean;
  validator?: (value: string) => boolean;
  transform?: (value: string) => any;
}

const ENV_RULES: Record<string, ValidationRule> = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    type: 'string',
    validator: (value: string) => value.startsWith('https://') && value.includes('.supabase.co')
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    type: 'string',
    validator: (value: string) => value.length > 20
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false,
    type: 'string'
  },

  // App Configuration
  NODE_ENV: {
    required: false,
    type: 'string',
    defaultValue: 'development',
    validator: (value: string) => ['development', 'production', 'test'].includes(value)
  },
  NEXT_PUBLIC_BASE_URL: {
    required: false,
    type: 'string',
    defaultValue: 'http://localhost:3000'
  },
  NEXT_PUBLIC_APP_VERSION: {
    required: false,
    type: 'string',
    defaultValue: '1.0.0'
  },

  // Feature Flags
  NEXT_PUBLIC_ENABLE_HOSPITAL_LAYER: {
    required: false,
    type: 'boolean',
    defaultValue: false,
    transform: (value: string) => value === 'true'
  },
  NEXT_PUBLIC_ENABLE_SVI: {
    required: false,
    type: 'boolean',
    defaultValue: true,
    transform: (value: string) => value !== 'false'
  },
  NEXT_PUBLIC_ENABLE_ANALYTICS: {
    required: false,
    type: 'boolean',
    defaultValue: false,
    transform: (value: string) => value === 'true'
  }
};

export interface ValidationError {
  key: string;
  message: string;
  value?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  config: Record<string, any>;
}

/**
 * Validate environment variables against defined rules
 */
export function validateEnvironment(): ValidationResult {
  const errors: ValidationError[] = [];
  const config: Record<string, any> = {};

  for (const [key, rule] of Object.entries(ENV_RULES)) {
    const rawValue = process.env[key];

    // Check required fields
    if (rule.required && !rawValue) {
      errors.push({
        key,
        message: `Required environment variable ${key} is missing`
      });
      continue;
    }

    // Use default value if not provided
    const value = rawValue || rule.defaultValue;

    if (value === undefined) {
      continue; // Skip optional fields without defaults
    }

    // Validate value format
    if (rule.validator && !rule.validator(String(value))) {
      errors.push({
        key,
        message: `Environment variable ${key} has invalid format`,
        value: String(value)
      });
      continue;
    }

    // Transform value if needed
    if (rule.transform) {
      config[key] = rule.transform(String(value));
    } else {
      config[key] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    config
  };
}

/**
 * Get a validated environment variable with type safety
 */
export function getEnvVar<T = string>(
  key: string,
  defaultValue?: T,
  required: boolean = false
): T {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Required environment variable ${key} is missing`);
  }

  return (value as T) || defaultValue as T;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Get the current environment info
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isVercel: isVercel(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    region: process.env.VERCEL_REGION || 'local',
    timestamp: new Date().toISOString()
  };
}