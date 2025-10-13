import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

test.describe('Market Data API Tests', () => {
  const baseURL = 'http://localhost:3000';

  test.describe('Redfin API', () => {
    test('should return Redfin data for states', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin?state=CA`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('data');
      
      // Check required fields
      if (data.data && data.data.length > 0) {
        const firstRecord = data.data[0];
        testData.expectedApiResponse.redfin.requiredFields.forEach(field => {
          expect(firstRecord).toHaveProperty(field);
        });
      }
    });

    test('should return Redfin data for cities', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin?city=Los Angeles`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('city');
      expect(data).toHaveProperty('data');
    });

    test('should return Redfin data for ZIP codes', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin?zip=90210`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('zip');
      expect(data).toHaveProperty('data');
    });

    test('should handle invalid Redfin requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin?state=INVALID`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should return Redfin data within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}/api/market/redfin?state=TX`);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(testData.performance.apiResponseTime);
    });
  });

  test.describe('Census API', () => {
    test('should return Census data for states', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/census?state=CA`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('data');
      
      // Check required fields
      if (data.data) {
        testData.expectedApiResponse.census.requiredFields.forEach(field => {
          expect(data.data).toHaveProperty(field);
        });
      }
    });

    test('should return Census data for all states', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/census`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('should handle invalid Census requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/census?state=INVALID`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('FRED Economic API', () => {
    test('should return FRED economic data', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/economic`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      
      // Check required fields
      if (data.data) {
        testData.expectedApiResponse.fred.requiredFields.forEach(field => {
          expect(data.data).toHaveProperty(field);
        });
      }
    });

    test('should return current economic indicators', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/economic`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('lastUpdated');
      
      // Check if data is recent (within last 24 hours)
      if (data.lastUpdated) {
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        expect(hoursDiff).toBeLessThan(24);
      }
    });
  });

  test.describe('HUD API', () => {
    test('should return HUD data for states', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/hud?state=CA`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('data');
    });

    test('should return HUD data for all states', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/hud`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();
      expect(data.data.length).toBeGreaterThan(0);
    });
  });

  test.describe('Comprehensive API', () => {
    test('should return comprehensive market data', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/comprehensive?state=CA`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('redfin');
      expect(data).toHaveProperty('census');
      expect(data).toHaveProperty('economic');
      expect(data).toHaveProperty('hud');
      expect(data).toHaveProperty('insights');
    });

    test('should return market insights and scoring', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/comprehensive?state=TX`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('insights');
      
      if (data.insights) {
        expect(data.insights).toHaveProperty('marketHealthScore');
        expect(data.insights).toHaveProperty('affordabilityScore');
        expect(data.insights).toHaveProperty('investmentPotential');
        expect(data.insights).toHaveProperty('riskFactors');
      }
    });

    test('should handle comprehensive data for cities', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/comprehensive?city=Los Angeles`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('city');
      expect(data).toHaveProperty('redfin');
      expect(data).toHaveProperty('census');
      expect(data).toHaveProperty('economic');
    });

    test('should return comprehensive data within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${baseURL}/api/market/comprehensive?state=FL`);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(testData.performance.apiResponseTime * 2); // Allow more time for comprehensive data
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle malformed requests gracefully', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin?invalid=parameter`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle missing parameters', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/market/redfin`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle concurrent requests', async ({ request }) => {
      const promises = [
        request.get(`${baseURL}/api/market/redfin?state=CA`),
        request.get(`${baseURL}/api/market/census?state=CA`),
        request.get(`${baseURL}/api/market/economic`),
        request.get(`${baseURL}/api/market/hud?state=CA`)
      ];
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });
});
