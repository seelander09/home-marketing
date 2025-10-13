export const testData = {
  // Sample form data for testing
  contactForm: {
    valid: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      company: 'Test Company',
      message: 'This is a test message for the contact form.'
    },
    invalid: {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      phone: '123',
      company: '',
      message: ''
    }
  },

  // Sample market data for API testing
  marketData: {
    states: ['CA', 'TX', 'FL', 'NY', 'WA'],
    cities: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Seattle'],
    zipCodes: ['90210', '77001', '33101', '10001', '98101']
  },

  // Expected API response structure
  expectedApiResponse: {
    redfin: {
      requiredFields: ['state', 'city', 'medianPrice', 'daysOnMarket', 'inventory'],
      dataTypes: {
        state: 'string',
        city: 'string',
        medianPrice: 'number',
        daysOnMarket: 'number',
        inventory: 'number'
      }
    },
    census: {
      requiredFields: ['state', 'housingUnits', 'ownershipRate', 'medianHomeValue'],
      dataTypes: {
        state: 'string',
        housingUnits: 'number',
        ownershipRate: 'number',
        medianHomeValue: 'number'
      }
    },
    fred: {
      requiredFields: ['mortgageRate', 'unemployment', 'gdp', 'inflation'],
      dataTypes: {
        mortgageRate: 'number',
        unemployment: 'number',
        gdp: 'number',
        inflation: 'number'
      }
    }
  },

  // Test URLs
  urls: {
    home: '/',
    about: '/about',
    contact: '/contact',
    products: '/products',
    resources: '/resources',
    api: {
      redfin: '/api/market/redfin',
      census: '/api/market/census',
      fred: '/api/market/economic',
      hud: '/api/market/hud',
      comprehensive: '/api/market/comprehensive'
    }
  },

  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // 3 seconds
    apiResponseTime: 2000, // 2 seconds
    firstContentfulPaint: 1500, // 1.5 seconds
    largestContentfulPaint: 2500 // 2.5 seconds
  }
};
