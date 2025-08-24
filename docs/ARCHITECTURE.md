# Architecture Documentation

## Overview

The North Carolina Healthcare Impact Analysis application follows a modern, scalable architecture built with Next.js, TypeScript, and Supabase. This document outlines the architectural decisions, patterns, and best practices implemented in the codebase.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client UI     │◄──►│   Next.js API    │◄──►│   Supabase DB   │
│   (React/TS)    │    │   Routes         │    │   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Service       │    │   Performance    │
│   Layer         │    │   & Caching      │
└─────────────────┘    └──────────────────┘
```

## Core Architectural Principles

### 1. Separation of Concerns
- **Service Layer**: Centralized data access logic
- **UI Components**: Focused on presentation and user interaction
- **API Routes**: Handle HTTP requests and data transformation
- **Utilities**: Reusable helper functions and performance tools

### 2. Type Safety
- Comprehensive TypeScript definitions for all data structures
- Strict typing across service layer, API routes, and UI components
- Runtime validation where necessary

### 3. Performance First
- Multiple caching strategies (memory, localStorage, HTTP)
- Debouncing and throttling for user interactions
- Lazy loading and code splitting
- Performance monitoring and metrics collection

### 4. Scalability
- Modular component architecture
- Service-oriented data access patterns
- Configurable environment management
- Horizontal scaling capabilities through Supabase

## Directory Structure

```
app/
├── api/                    # Next.js API routes
│   ├── healthcare-data/    # Healthcare data endpoints
│   └── hospitals-data/     # Hospital data endpoints
├── components/             # React components
│   ├── Map/               # Map-related components
│   ├── Layout/            # Layout components
│   └── UI/                # Reusable UI components
├── lib/                   # Core library code
│   ├── components/        # Reusable lib components
│   │   └── map/          # Map component library
│   ├── config/           # Configuration management
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Data service layer
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── types/                # Application-specific types
└── utils/                # Legacy utilities (to be migrated)
```

## Service Layer Architecture

### Healthcare Service (`healthcareService`)

```typescript
interface HealthcareService {
  getHealthcareData(filters?: Filters, options?: Options): Promise<ServiceResponse>
  getCountyHealthcareData(fipsCode: string): Promise<ServiceResponse>
  getHealthcareSummary(): Promise<ServiceResponse>
}
```

**Responsibilities:**
- Supabase data querying and filtering
- Data transformation and validation
- Error handling and response formatting
- Caching integration

### Hospital Service (`hospitalService`)

```typescript
interface HospitalService {
  getHospitalData(filters?: Filters, options?: Options): Promise<ServiceResponse>
  getHospitalsInBounds(bounds: GeoBounds): Promise<ServiceResponse>
  getHospitalSummary(): Promise<ServiceResponse>
}
```

**Responsibilities:**
- Hospital data management
- Geographic querying capabilities
- Facility filtering and search
- Statistical aggregation

## Component Architecture

### Map Components

The map system is built with a layered component architecture:

1. **InteractiveMap**: Core map wrapper with Leaflet integration
2. **CountyTooltip**: Hover information display
3. **MapLegend**: Dynamic legend based on selected metrics
4. **HospitalLayer**: Hospital marker management

**Key Features:**
- Dynamic Leaflet loading for SSR compatibility
- Event-driven county selection
- Performance-optimized rendering
- Responsive design patterns

### Data Management Hooks

#### `useHealthcareData`
- Centralized healthcare data fetching
- Built-in caching and error handling
- Filter and search capabilities
- Auto-refresh functionality

#### `useHospitalData`
- Hospital-specific data management
- Geographic bounds querying
- Lazy loading support

## Caching Strategy

### Multi-Layer Caching

1. **Memory Cache** (L1)
   - Fast, in-memory storage
   - TTL-based expiration
   - LRU eviction policy
   - Used for frequently accessed data

2. **Local Storage Cache** (L2)
   - Browser-based persistence
   - Survives page reloads
   - Used for user preferences and static data

3. **HTTP Cache** (L3)
   - CDN and browser caching
   - Optimized cache headers
   - Long-term static asset caching

### Cache Implementation

```typescript
// Memory cache for healthcare data
const healthcareDataCache = new MemoryCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50
});

// Persistent cache for user preferences
const persistentCache = new LocalStorageCache('nc-health-app');
```

## Performance Optimization

### Monitoring and Metrics

The application includes comprehensive performance monitoring:

```typescript
// Performance measurement
performanceMonitor.measure('data-fetch', async () => {
  return await healthcareService.getHealthcareData();
});

// Web vitals tracking
measureWebVitals();

// Resource timing analysis
analyzeResourceTiming();
```

### Optimization Techniques

1. **Debouncing**: User input handling
2. **Throttling**: Map interaction events
3. **Memoization**: Expensive calculations
4. **Lazy Loading**: Component and data loading
5. **Code Splitting**: Route-based splitting

## Environment Configuration

### Validation System

All environment variables are validated at startup:

```typescript
const validation = validateEnvironment();
if (!validation.isValid) {
  throw new Error('Invalid environment configuration');
}
```

### Configuration Structure

- **Database**: Supabase connection settings
- **Features**: Feature flag management
- **Performance**: Cache and optimization settings
- **Monitoring**: Analytics and error tracking

## API Design

### RESTful Endpoints

All API routes follow RESTful conventions:

- `GET /api/healthcare-data` - Healthcare data with filtering
- `GET /api/hospitals-data` - Hospital data with geographic queries
- Support for JSON and CSV export formats

### Response Format

Consistent response structure across all endpoints:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    count: number;
    source: string;
    timestamp: string;
    filters?: Record<string, any>;
  };
  error?: string;
}
```

## Error Handling

### Centralized Error Management

1. **Service Layer**: Standardized error responses
2. **API Routes**: HTTP status code mapping
3. **UI Components**: User-friendly error messages
4. **Global Handlers**: Unhandled error catching

### Error Types

```typescript
interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}
```

## Testing Strategy

### Unit Testing
- Service layer testing with mocked dependencies
- Component testing with React Testing Library
- Utility function testing

### Integration Testing
- API route testing
- Database integration testing
- End-to-end user workflows

### Performance Testing
- Load testing for data endpoints
- Memory leak detection
- Rendering performance benchmarks

## Security Considerations

### Data Protection
- Supabase Row Level Security (RLS)
- Environment variable protection
- Input validation and sanitization

### Authentication Ready
- JWT token management structure
- Role-based access control preparation
- API rate limiting capabilities

## Deployment Architecture

### Vercel Integration
- Serverless function deployment
- Automatic preview environments
- Edge caching optimization

### Environment Stages
- **Development**: Local development with hot reload
- **Preview**: Branch-based preview deployments
- **Production**: Optimized production builds

## Future Enhancements

### Planned Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Analytics**: User behavior tracking
3. **Mobile App**: React Native implementation
4. **AI Integration**: Predictive modeling capabilities
5. **Multi-state Support**: Expand beyond North Carolina

### Scalability Roadmap
1. **Database Optimization**: Query performance improvements
2. **CDN Integration**: Global content delivery
3. **Microservices**: Service decomposition for scale
4. **Container Orchestration**: Kubernetes deployment

## Monitoring and Observability

### Application Metrics
- Response time tracking
- Error rate monitoring
- User engagement analytics
- Performance bottleneck identification

### Health Checks
- Database connectivity monitoring
- Service availability checks
- External dependency monitoring

## Documentation Standards

### Code Documentation
- Comprehensive TypeScript types
- JSDoc comments for complex functions
- Architecture decision records (ADRs)
- API documentation with examples

### Maintenance Guidelines
- Regular dependency updates
- Performance audit schedules
- Security vulnerability scanning
- Code quality metrics tracking

---

This architecture supports the application's mission of providing reliable, performant healthcare data visualization while maintaining code quality, scalability, and maintainability standards.