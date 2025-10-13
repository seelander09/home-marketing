# API Keys Setup Guide

This document provides instructions for obtaining API keys for the additional housing data sources.

## Required API Keys

### 1. Census API Key (FREE)
- **Website**: https://api.census.gov/data/key_signup.html
- **Cost**: Free
- **Rate Limits**: 500 requests per day
- **Documentation**: https://www.census.gov/data/developers/data-sets.html
- **Environment Variable**: `CENSUS_API_KEY`

**Steps to get Census API key:**
1. Visit https://api.census.gov/data/key_signup.html
2. Fill out the form with your information
3. Check your email for the API key
4. Add to your `.env` file: `CENSUS_API_KEY=your_key_here`

### 2. FRED API Key (FREE)
- **Website**: https://fred.stlouisfed.org/docs/api/api_key.html
- **Cost**: Free
- **Rate Limits**: 120 requests per minute
- **Documentation**: https://fred.stlouisfed.org/docs/api/fred/
- **Environment Variable**: `FRED_API_KEY`

**Steps to get FRED API key:**
1. Visit https://fred.stlouisfed.org/docs/api/api_key.html
2. Click "Request API Key"
3. Fill out the registration form
4. Check your email for the API key
5. Add to your `.env` file: `FRED_API_KEY=your_key_here`

### 3. HUD API Key (FREE)
- **Website**: https://www.huduser.gov/portal/dataset/fmr-api.html
- **Cost**: Free
- **Rate Limits**: Varies by endpoint
- **Documentation**: https://www.huduser.gov/portal/dataset/fmr-api.html
- **Environment Variable**: `HUD_API_KEY`

**Steps to get HUD API key:**
1. Visit https://www.huduser.gov/portal/dataset/fmr-api.html
2. Click "Request API Access"
3. Fill out the application form
4. Wait for approval (usually within 24-48 hours)
5. Add to your `.env` file: `HUD_API_KEY=your_key_here`

## Environment Configuration

Create a `.env.local` file in your project root with the following structure:

```env
# Existing API Keys
REALIE_API_URL=
REALIE_API_KEY=

# New Data Source API Keys
CENSUS_API_KEY=your_census_api_key_here
FRED_API_KEY=your_fred_api_key_here
HUD_API_KEY=your_hud_api_key_here

# Optional: Custom cache directories
REDFIN_DATA_DIR=
REDFIN_CACHE_DIR=
CENSUS_CACHE_DIR=
HUD_CACHE_DIR=
FRED_CACHE_DIR=
```

## Testing API Keys

Once you have your API keys, you can test them by running the cache build scripts:

```bash
# Test Census API
npm run census:build-cache

# Test FRED API
npm run fred:build-cache

# Test HUD API
npm run hud:build-cache
```

## Rate Limiting and Best Practices

### Census API
- **Limit**: 500 requests per day
- **Best Practice**: Cache data for 24-48 hours
- **Implementation**: Built-in caching with daily refresh

### FRED API
- **Limit**: 120 requests per minute
- **Best Practice**: Batch requests when possible
- **Implementation**: Single request per series with caching

### HUD API
- **Limit**: Varies by endpoint
- **Best Practice**: Cache data for weekly refresh
- **Implementation**: Weekly cache refresh cycle

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correctly copied
   - Check for extra spaces or characters
   - Ensure the key is active (some APIs require activation)

2. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Increase cache duration
   - Batch requests when possible

3. **Data Not Updating**
   - Check API endpoint URLs
   - Verify data series IDs are correct
   - Check API documentation for changes

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
```

This will show detailed API request/response information in the console.
