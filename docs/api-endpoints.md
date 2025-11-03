# Housing Data API Endpoints

This document describes all available API endpoints for accessing comprehensive housing market data.

## Overview

The API provides access to housing market data from multiple sources:
- **Redfin**: Market trends, prices, inventory
- **Census ACS**: Demographics, housing characteristics
- **HUD**: Government housing indicators
- **FRED**: Economic indicators

## Base URL

All endpoints are prefixed with `/api/market/`

## Authentication

No authentication required for these endpoints. Rate limiting may apply based on API provider limits.

## Endpoints

### 1. Comprehensive Market Data

**GET** `/api/market/comprehensive`

Returns combined data from all sources with computed insights.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zip` | string | No* | ZIP code |
| `city` | string | No* | City name |
| `state` | string | No* | State code (required with city/county) |
| `county` | string | No* | County code |
| `metro` | string | No* | Metro area code |
| `includeInsights` | boolean | No | Include computed insights (default: true) |

*At least one location parameter is required.

#### Example Requests

```bash
# Get data for a ZIP code
GET /api/market/comprehensive?zip=12345

# Get data for a city
GET /api/market/comprehensive?city=Austin&state=TX

# Get data for a state
GET /api/market/comprehensive?state=CA

# Get data without insights
GET /api/market/comprehensive?zip=12345&includeInsights=false
```

#### Response Format

```json
{
  "regionType": "zip",
  "regionCode": "12345",
  "regionName": "12345",
  "state": "Texas",
  "stateCode": "TX",
  "redfin": {
    "regionType": "zip",
    "medianSalePrice": 450000,
    "medianDom": 25,
    "inventory": 125,
    "monthsOfSupply": 2.1,
    "soldAboveList": 0.15,
    "priceDrops": 0.12,
    "newListings": 45,
    "pendingSales": 38,
    "avgSaleToList": 0.98,
    "lastUpdated": "2025-09-26T14:45:14.874Z"
  },
  "census": {
    "geoid": "12345",
    "regionType": "zip",
    "totalHousingUnits": 2500,
    "occupiedHousingUnits": 2300,
    "ownerOccupiedUnits": 1800,
    "renterOccupiedUnits": 500,
    "medianHomeValue": 425000,
    "medianRent": 1800,
    "occupancyRate": 92.0,
    "ownerOccupiedRate": 78.3,
    "renterOccupiedRate": 21.7,
    "demographics": {
      "totalPopulation": 8500,
      "medianAge": 38.5,
      "medianHouseholdIncome": 75000,
      "povertyRate": 12.5,
      "educationLevel": {
        "highSchoolOrLess": 35.2,
        "someCollege": 28.1,
        "bachelorsOrHigher": 36.7
      },
      "employmentRate": 94.2,
      "unemploymentRate": 3.8
    }
  },
  "hud": {
    "regionType": "state",
    "housingPriceIndex": {
      "current": 285.4,
      "yearOverYearChange": 5.2,
      "quarterlyChange": 1.1
    },
    "marketConditions": {
      "affordabilityIndex": 72.3,
      "inventoryLevel": "moderate",
      "marketVelocity": 85.2,
      "priceAppreciation": 4.8
    },
    "economicIndicators": {
      "medianIncome": 78000,
      "unemploymentRate": 3.5,
      "populationGrowth": 2.1,
      "jobGrowth": 3.2
    }
  },
  "economic": {
    "mortgageRates": {
      "rate30Year": 6.8,
      "rate15Year": 6.2,
      "rate5YearARM": 6.5,
      "rate1YearARM": 6.3
    },
    "economicIndicators": {
      "gdpGrowth": 2.4,
      "inflationRate": 3.2,
      "unemploymentRate": 3.7,
      "federalFundsRate": 5.25,
      "consumerConfidenceIndex": 102.3,
      "retailSalesGrowth": 4.1
    },
    "housingEconomic": {
      "housingStarts": 1450000,
      "buildingPermits": 1500000,
      "newHomeSales": 680000,
      "existingHomeSales": 4200000,
      "homeOwnershipRate": 65.8,
      "mortgageDelinquencyRate": 2.1,
      "foreclosureRate": 0.3
    }
  },
  "insights": {
    "marketHealth": "good",
    "affordabilityScore": 68,
    "investmentPotential": 75,
    "marketVelocity": 82,
    "riskFactors": [
      "High mortgage rates"
    ],
    "opportunities": [
      "Strong seller leverage",
      "Fast market velocity",
      "Low unemployment"
    ]
  },
  "dataFreshness": {
    "redfin": "2025-09-26T14:45:14.874Z",
    "census": "2025-09-26T12:30:00.000Z",
    "hud": "2025-09-25T18:00:00.000Z",
    "economic": "2025-09-26T09:15:00.000Z",
    "overall": "2025-09-25T18:00:00.000Z"
  },
  "metadata": {
    "request": {
      "zip": "12345",
      "includeInsights": true
    },
    "timestamp": "2025-09-26T15:30:00.000Z",
    "dataSources": {
      "redfin": true,
      "census": true,
      "hud": true,
      "economic": true
    },
    "cacheStatus": {
      "redfin": "cached",
      "census": "cached",
      "hud": "cached",
      "economic": "cached"
    }
  },
  "lastUpdated": "2025-09-26T15:30:00.000Z"
}
```

### 2. Batch Requests

**POST** `/api/market/comprehensive`

Process multiple locations in a single request.

#### Request Body

```json
{
  "locations": [
    { "zip": "12345" },
    { "city": "Austin", "state": "TX" },
    { "state": "CA" }
  ],
  "includeInsights": true
}
```

#### Response Format

```json
{
  "results": [
    {
      "location": { "zip": "12345" },
      "data": { /* comprehensive market data */ },
      "success": true
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "timestamp": "2025-09-26T15:30:00.000Z"
  }
}
```

### 3. Individual Data Sources

#### Redfin Data

**GET** `/api/market/redfin`

Returns Redfin market data only (existing endpoint).

#### Census Data

**GET** `/api/market/census`

Returns Census ACS data only.

#### HUD Data

**GET** `/api/market/hud`

Returns HUD market data only.

#### Economic Data

**GET** `/api/market/economic`

Returns FRED economic data only.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found (no data for location)
- `500`: Internal Server Error

## Rate Limits

### External API Limits

- **Census API**: 500 requests/day
- **FRED API**: 120 requests/minute
- **HUD API**: Varies by endpoint
- **Redfin**: No limits (cached data)

### Application Rate Limits

The application implements rate limiting to protect API endpoints and ensure fair usage:

- **Forms**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per minute per IP
- **Market Data**: 30 requests per minute per IP
- **Territory Lookup**: 20 requests per minute per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when rate limited)

When rate limited, endpoints return `429 Too Many Requests` with these headers.

## Caching

All data is cached locally to minimize API calls:
- **Redfin**: Monthly refresh
- **Census**: Annual refresh (5-year estimates)
- **HUD**: Weekly refresh
- **FRED**: Daily refresh

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get comprehensive data for a ZIP code
const response = await fetch('/api/market/comprehensive?zip=12345')
const data = await response.json()

// Get data for multiple locations
const batchResponse = await fetch('/api/market/comprehensive', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locations: [
      { zip: '12345' },
      { zip: '67890' }
    ],
    includeInsights: true
  })
})
const batchData = await batchResponse.json()
```

### Python

```python
import requests

# Get comprehensive data
response = requests.get('/api/market/comprehensive', params={
    'zip': '12345',
    'includeInsights': True
})
data = response.json()

# Batch request
batch_data = {
    'locations': [
        {'zip': '12345'},
        {'city': 'Austin', 'state': 'TX'}
    ],
    'includeInsights': True
}
response = requests.post('/api/market/comprehensive', json=batch_data)
```

## Data Freshness

Check the `dataFreshness` object in responses to understand how recent the data is. The `overall` field shows the oldest data point across all sources.

## Support

For issues or questions:
1. Check the cache status in response metadata
2. Verify API keys are configured (see `docs/api-keys-setup.md`)
3. Check rate limits for individual data sources
4. Review error details in responses
