export type ZipCrosswalkEntry = {
  zip: string
  county: string
  countyFips: string
  state: string
  msa?: string
  primaryCity: string
  neighborhoods: string[]
  latitude?: number
  longitude?: number
}

const ZIP_CROSSWALK: Record<string, ZipCrosswalkEntry> = {
  '78701': {
    zip: '78701',
    county: 'Travis County',
    countyFips: '48453',
    state: 'TX',
    msa: 'Austin-Round Rock-Georgetown, TX',
    primaryCity: 'Austin',
    neighborhoods: ['Downtown Austin', 'Market District'],
    latitude: 30.2672,
    longitude: -97.7431
  },
  '94102': {
    zip: '94102',
    county: 'San Francisco County',
    countyFips: '06075',
    state: 'CA',
    msa: 'San Francisco-Oakland-Berkeley, CA',
    primaryCity: 'San Francisco',
    neighborhoods: ['Civic Center', 'Hayes Valley'],
    latitude: 37.7793,
    longitude: -122.4192
  },
  '80202': {
    zip: '80202',
    county: 'Denver County',
    countyFips: '08031',
    state: 'CO',
    msa: 'Denver-Aurora-Lakewood, CO',
    primaryCity: 'Denver',
    neighborhoods: ['LoDo', 'Union Station'],
    latitude: 39.7527,
    longitude: -104.9998
  },
  '60611': {
    zip: '60611',
    county: 'Cook County',
    countyFips: '17031',
    state: 'IL',
    msa: 'Chicago-Naperville-Elgin, IL-IN-WI',
    primaryCity: 'Chicago',
    neighborhoods: ['Streeterville', 'Magnificent Mile'],
    latitude: 41.8936,
    longitude: -87.6244
  },
  '85004': {
    zip: '85004',
    county: 'Maricopa County',
    countyFips: '04013',
    state: 'AZ',
    msa: 'Phoenix-Mesa-Chandler, AZ',
    primaryCity: 'Phoenix',
    neighborhoods: ['Downtown Phoenix', 'Roosevelt Row'],
    latitude: 33.4511,
    longitude: -112.0703
  },
  '30309': {
    zip: '30309',
    county: 'Fulton County',
    countyFips: '13121',
    state: 'GA',
    msa: 'Atlanta-Sandy Springs-Alpharetta, GA',
    primaryCity: 'Atlanta',
    neighborhoods: ['Midtown Atlanta', 'Ansley Park'],
    latitude: 33.798,
    longitude: -84.3867
  },
  '98109': {
    zip: '98109',
    county: 'King County',
    countyFips: '53033',
    state: 'WA',
    msa: 'Seattle-Tacoma-Bellevue, WA',
    primaryCity: 'Seattle',
    neighborhoods: ['South Lake Union', 'Queen Anne'],
    latitude: 47.6265,
    longitude: -122.3382
  },
  '97205': {
    zip: '97205',
    county: 'Multnomah County',
    countyFips: '41051',
    state: 'OR',
    msa: 'Portland-Vancouver-Hillsboro, OR-WA',
    primaryCity: 'Portland',
    neighborhoods: ['Goose Hollow', 'Downtown Portland'],
    latitude: 45.5226,
    longitude: -122.6857
  },
  '33131': {
    zip: '33131',
    county: 'Miami-Dade County',
    countyFips: '12086',
    state: 'FL',
    msa: 'Miami-Fort Lauderdale-West Palm Beach, FL',
    primaryCity: 'Miami',
    neighborhoods: ['Brickell', 'Downtown Miami'],
    latitude: 25.7666,
    longitude: -80.1913
  },
  '75214': {
    zip: '75214',
    county: 'Dallas County',
    countyFips: '48113',
    state: 'TX',
    msa: 'Dallas-Fort Worth-Arlington, TX',
    primaryCity: 'Dallas',
    neighborhoods: ['Lakewood', 'Lake Highlands'],
    latitude: 32.8233,
    longitude: -96.7443
  },
  '28207': {
    zip: '28207',
    county: 'Mecklenburg County',
    countyFips: '37119',
    state: 'NC',
    msa: 'Charlotte-Concord-Gastonia, NC-SC',
    primaryCity: 'Charlotte',
    neighborhoods: ['Myers Park', 'Eastover'],
    latitude: 35.2038,
    longitude: -80.8271
  },
  '02116': {
    zip: '02116',
    county: 'Suffolk County',
    countyFips: '25025',
    state: 'MA',
    msa: 'Boston-Cambridge-Newton, MA-NH',
    primaryCity: 'Boston',
    neighborhoods: ['Back Bay', 'Bay Village'],
    latitude: 42.3503,
    longitude: -71.0735
  }
}

export function getZipGeography(zip: string): ZipCrosswalkEntry | null {
  const normalized = zip?.trim()
  if (!normalized) {
    return null
  }
  return ZIP_CROSSWALK[normalized] ?? null
}

export function getZipCrosswalk(): ZipCrosswalkEntry[] {
  return Object.values(ZIP_CROSSWALK)
}
