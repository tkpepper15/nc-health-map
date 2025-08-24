# API Documentation

## Overview

The North Carolina Healthcare Impact Analysis API provides RESTful endpoints for accessing healthcare data, hospital information, and geographic data across North Carolina's 100 counties.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Currently, the API is public and does not require authentication. Authentication will be added in future versions.

## Response Format

All API responses follow a consistent format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    count?: number;
    source?: string;
    timestamp?: string;
    filters?: Record<string, any>;
    server_info?: {
      environment?: string;
      timestamp?: string;
    };
  };
  error?: string;
  message?: string;
}
```

## Healthcare Data API

### Get Healthcare Data

Retrieve healthcare vulnerability data for North Carolina counties.

**Endpoint**: `GET /api/healthcare-data`

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `format` | string | Response format (`json`, `csv`) | `json` |
| `county` | string | Filter by county name (partial match) | - |
| `fips` | string | Filter by FIPS code | - |
| `rural` | boolean | Filter by rural classification | - |
| `vulnerability` | string | Filter by vulnerability category (`low`, `moderate`, `high`, `extreme`) | - |
| `limit` | number | Maximum number of results | - |
| `aggregated` | boolean | Return simplified data for performance | `false` |

#### Example Request

```bash
curl "http://localhost:3000/api/healthcare-data?vulnerability=high&limit=10&format=json"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "countyId": "37033",
      "countyName": "Caswell County",
      "fips_code": "37033",
      "vulnerability_category": "high",
      "vulnerability_color": "#ef4444",
      "hcvi_composite": 7.2,
      "medicaid_enrollment_rate": 28.5,
      "population_2020": 22736,
      "is_rural": true,
      "svi_data": {
        "svi_overall_percentile": 0.85,
        "poverty_150_pct": 32.1,
        "unemployment_pct": 8.2
      },
      "healthcareAccess": {
        "score": 3.2
      },
      "policyRisk": {
        "score": 8.1
      },
      "economicVulnerability": {
        "score": 6.8
      }
    }
  ],
  "metadata": {
    "source": "supabase",
    "count": 1,
    "timestamp": "2024-01-15T10:30:00Z",
    "filters": {
      "vulnerability": "high",
      "limit": 10
    }
  }
}
```

#### CSV Export

When `format=csv` is specified, the response will be a CSV file:

```csv
fips_code,county_name,hcvi_composite,vulnerability_category,medicaid_enrollment_rate,population_2020,is_rural
37033,Caswell County,7.2,high,28.5,22736,true
```

### Get County Healthcare Data

Retrieve detailed healthcare data for a specific county.

**Endpoint**: `GET /api/healthcare-data?fips={fips_code}`

#### Example Request

```bash
curl "http://localhost:3000/api/healthcare-data?fips=37033"
```

## Hospital Data API

### Get Hospital Data

Retrieve hospital and healthcare facility data.

**Endpoint**: `GET /api/hospitals-data`

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `format` | string | Response format (`json`, `csv`) | `json` |
| `county` | string | Filter by county name | - |
| `city` | string | Filter by city name | - |
| `type` | string | Filter by facility type | - |
| `emergency` | boolean | Filter by emergency department availability | - |
| `major` | boolean | Filter by major hospital status | - |
| `min_beds` | number | Minimum bed count | - |
| `max_beds` | number | Maximum bed count | - |
| `limit` | number | Maximum number of results | - |
| `bounds` | string | Geographic bounds (`north,south,east,west`) | - |

#### Example Request

```bash
curl "http://localhost:3000/api/hospitals-data?county=Wake&emergency=true"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "H001",
      "facility_name": "WakeMed Raleigh Campus",
      "county": "Wake",
      "city": "Raleigh",
      "facility_type": "General Acute Care Hospital",
      "total_beds": 870,
      "is_major_hospital": true,
      "is_emergency_dept": true,
      "latitude": 35.7796,
      "longitude": -78.6382,
      "address": "3000 New Bern Ave",
      "phone": "(919) 350-8000"
    }
  ],
  "metadata": {
    "source": "supabase",
    "count": 1,
    "filters": {
      "county": "Wake",
      "emergency": true
    }
  }
}
```

### Get Hospitals in Geographic Bounds

Retrieve hospitals within a specific geographic area.

**Endpoint**: `GET /api/hospitals-data?bounds={north},{south},{east},{west}`

#### Example Request

```bash
curl "http://localhost:3000/api/hospitals-data?bounds=36.0,-78.0,35.5,-78.5"
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Invalid parameter",
  "message": "The 'bounds' parameter must be in the format 'north,south,east,west'"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error |
| `503` | Service Unavailable - Database connection failed |

## Rate Limiting

Currently, there are no rate limits applied to the API. Rate limiting will be implemented in future versions.

## Caching

### Response Caching

API responses are cached with the following headers:

- **JSON Responses**: `Cache-Control: public, max-age=300, s-maxage=600` (5min browser, 10min CDN)
- **CSV Downloads**: `Cache-Control: public, max-age=3600` (1 hour)

### Cache Invalidation

Data caches are automatically invalidated when:
- New data is processed and uploaded
- Manual cache clearing is triggered
- TTL expires

## Data Export Formats

### JSON Format

Default format with full data structure and metadata.

### CSV Format

Simplified tabular format suitable for:
- Excel import
- Data analysis tools
- Research applications

#### CSV Headers - Healthcare Data

```csv
fips_code,county_name,hcvi_composite,vulnerability_category,vulnerability_color,medicaid_enrollment_rate,is_rural,population_2020,svi_overall_percentile,poverty_150_pct,unemployment_pct
```

#### CSV Headers - Hospital Data

```csv
id,facility_name,alt_name,county,city,facility_type,total_beds,general_beds,is_major_hospital,is_emergency_dept,latitude,longitude,address,phone
```

## CORS Policy

CORS is configured to allow requests from:
- `http://localhost:3000` (development)
- `https://your-domain.com` (production)
- All origins for OPTIONS requests

## Metadata Fields

### Healthcare Data Metadata

| Field | Description |
|-------|-------------|
| `source` | Data source (`supabase`, `file`, `cache`) |
| `count` | Number of records returned |
| `timestamp` | Response generation time |
| `filters` | Applied filters |
| `aggregated` | Whether data is aggregated |

### Hospital Data Metadata

| Field | Description |
|-------|-------------|
| `source` | Data source |
| `count` | Number of facilities returned |
| `bounds` | Geographic bounds (if applicable) |
| `filters` | Applied filters |

## Usage Examples

### Get All High Vulnerability Counties

```bash
curl "http://localhost:3000/api/healthcare-data?vulnerability=high" \
  -H "Accept: application/json"
```

### Export Rural Counties to CSV

```bash
curl "http://localhost:3000/api/healthcare-data?rural=true&format=csv" \
  -o rural_counties.csv
```

### Find Emergency Hospitals in Triangle Area

```bash
curl "http://localhost:3000/api/hospitals-data?bounds=36.0,35.5,-78.0,-79.0&emergency=true"
```

### Get Aggregated Data for Map Visualization

```bash
curl "http://localhost:3000/api/healthcare-data?aggregated=true&limit=100"
```

## SDK and Client Libraries

### JavaScript/TypeScript

```typescript
import { healthcareService, hospitalService } from './lib/services';

// Get healthcare data
const healthcareData = await healthcareService.getHealthcareData({
  vulnerabilityCategory: 'high'
});

// Get hospitals in bounds
const hospitals = await hospitalService.getHospitalsInBounds({
  north: 36.0,
  south: 35.5,
  east: -78.0,
  west: -79.0
});
```

### Python Example

```python
import requests

# Get healthcare data
response = requests.get(
    'http://localhost:3000/api/healthcare-data',
    params={'vulnerability': 'high', 'format': 'json'}
)
data = response.json()

# Export to CSV
csv_response = requests.get(
    'http://localhost:3000/api/healthcare-data',
    params={'format': 'csv', 'rural': 'true'}
)
with open('rural_data.csv', 'w') as f:
    f.write(csv_response.text)
```

### R Example

```r
library(httr)
library(jsonlite)

# Get healthcare data
response <- GET(
  "http://localhost:3000/api/healthcare-data",
  query = list(vulnerability = "high")
)

data <- fromJSON(content(response, "text"))
healthcare_df <- data$data
```

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Healthcare data endpoints
- Hospital data endpoints
- CSV export functionality
- Geographic bounds querying

### Planned Features
- Authentication and rate limiting
- Real-time data updates
- Webhook notifications
- GraphQL endpoint
- Batch data processing endpoints

## Support

For API questions or issues:
- GitHub Issues: [repository-issues-url]
- Email: [api-support-email]

---

*This API provides programmatic access to North Carolina healthcare data for research, policy analysis, and application development.*