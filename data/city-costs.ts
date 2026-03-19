export type CityCost = {
  city: string;
  state: string;
  stateCode: string;
  rent: number;        // avg 1-bed monthly (HUD FMR-aligned, 2025)
  other: number;       // food + transport + misc monthly
  lifestyle: "budget" | "balanced" | "premium";
  seoWeight: number;   // search demand proxy (1–5)
};

export const CITY_COSTS = {
  alabama: [
    { city: "Birmingham",  state: "Alabama", stateCode: "AL", rent: 1200, other: 950,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Huntsville",  state: "Alabama", stateCode: "AL", rent: 1300, other: 970,  lifestyle: "balanced", seoWeight: 3 },
    { city: "Mobile",      state: "Alabama", stateCode: "AL", rent: 1050, other: 910,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Montgomery",  state: "Alabama", stateCode: "AL", rent: 1000, other: 900,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Tuscaloosa",  state: "Alabama", stateCode: "AL", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Auburn",      state: "Alabama", stateCode: "AL", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 1 },
  ],

  alaska: [
    { city: "Anchorage",   state: "Alaska", stateCode: "AK", rent: 1800, other: 1400, lifestyle: "balanced", seoWeight: 3 },
    { city: "Fairbanks",   state: "Alaska", stateCode: "AK", rent: 1500, other: 1350, lifestyle: "balanced", seoWeight: 2 },
    { city: "Juneau",      state: "Alaska", stateCode: "AK", rent: 1650, other: 1380, lifestyle: "balanced", seoWeight: 2 },
    { city: "Sitka",       state: "Alaska", stateCode: "AK", rent: 1600, other: 1370, lifestyle: "balanced", seoWeight: 1 },
    { city: "Ketchikan",   state: "Alaska", stateCode: "AK", rent: 1600, other: 1370, lifestyle: "balanced", seoWeight: 1 },
    { city: "Wasilla",     state: "Alaska", stateCode: "AK", rent: 1400, other: 1300, lifestyle: "budget",   seoWeight: 1 },
  ],

  arizona: [
    { city: "Phoenix",     state: "Arizona", stateCode: "AZ", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 5 },
    { city: "Tucson",      state: "Arizona", stateCode: "AZ", rent: 1700, other: 950,  lifestyle: "balanced", seoWeight: 3 },
    { city: "Mesa",        state: "Arizona", stateCode: "AZ", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Chandler",    state: "Arizona", stateCode: "AZ", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "Scottsdale",  state: "Arizona", stateCode: "AZ", rent: 2600, other: 1200, lifestyle: "premium",  seoWeight: 3 },
    { city: "Tempe",       state: "Arizona", stateCode: "AZ", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
  ],

  arkansas: [
    { city: "Little Rock",  state: "Arkansas", stateCode: "AR", rent: 1100, other: 900, lifestyle: "budget",   seoWeight: 3 },
    { city: "Fort Smith",   state: "Arkansas", stateCode: "AR", rent: 950,  other: 870, lifestyle: "budget",   seoWeight: 2 },
    { city: "Fayetteville", state: "Arkansas", stateCode: "AR", rent: 1300, other: 950, lifestyle: "budget",   seoWeight: 2 },
    { city: "Springdale",   state: "Arkansas", stateCode: "AR", rent: 1200, other: 930, lifestyle: "budget",   seoWeight: 1 },
    { city: "Jonesboro",    state: "Arkansas", stateCode: "AR", rent: 1000, other: 890, lifestyle: "budget",   seoWeight: 1 },
    { city: "Conway",       state: "Arkansas", stateCode: "AR", rent: 1050, other: 895, lifestyle: "budget",   seoWeight: 1 },
  ],

  california: [
    { city: "Los Angeles",   state: "California", stateCode: "CA", rent: 3000, other: 1300, lifestyle: "premium",  seoWeight: 5 },
    { city: "San Diego",     state: "California", stateCode: "CA", rent: 2700, other: 1200, lifestyle: "premium",  seoWeight: 4 },
    { city: "San Jose",      state: "California", stateCode: "CA", rent: 3300, other: 1400, lifestyle: "premium",  seoWeight: 4 },
    { city: "San Francisco", state: "California", stateCode: "CA", rent: 3800, other: 1400, lifestyle: "premium",  seoWeight: 5 },
    { city: "Sacramento",    state: "California", stateCode: "CA", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "Fresno",        state: "California", stateCode: "CA", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Oakland",       state: "California", stateCode: "CA", rent: 2900, other: 1300, lifestyle: "premium",  seoWeight: 3 },
    { city: "Irvine",        state: "California", stateCode: "CA", rent: 3100, other: 1200, lifestyle: "premium",  seoWeight: 3 },
  ],

  colorado: [
    { city: "Denver",           state: "Colorado", stateCode: "CO", rent: 2500, other: 1200, lifestyle: "balanced", seoWeight: 5 },
    { city: "Colorado Springs", state: "Colorado", stateCode: "CO", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Aurora",           state: "Colorado", stateCode: "CO", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Fort Collins",     state: "Colorado", stateCode: "CO", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Lakewood",         state: "Colorado", stateCode: "CO", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Boulder",          state: "Colorado", stateCode: "CO", rent: 2800, other: 1250, lifestyle: "premium",  seoWeight: 3 },
  ],

  connecticut: [
    { city: "Bridgeport", state: "Connecticut", stateCode: "CT", rent: 1900, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "New Haven",  state: "Connecticut", stateCode: "CT", rent: 1800, other: 1080, lifestyle: "balanced", seoWeight: 3 },
    { city: "Hartford",   state: "Connecticut", stateCode: "CT", rent: 1700, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Stamford",   state: "Connecticut", stateCode: "CT", rent: 2900, other: 1350, lifestyle: "premium",  seoWeight: 4 },
    { city: "Waterbury",  state: "Connecticut", stateCode: "CT", rent: 1500, other: 1000, lifestyle: "balanced", seoWeight: 1 },
    { city: "Norwalk",    state: "Connecticut", stateCode: "CT", rent: 2700, other: 1300, lifestyle: "premium",  seoWeight: 2 },
  ],

  delaware: [
    { city: "Wilmington",  state: "Delaware", stateCode: "DE", rent: 1700, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Dover",       state: "Delaware", stateCode: "DE", rent: 1500, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Newark",      state: "Delaware", stateCode: "DE", rent: 1600, other: 1020, lifestyle: "balanced", seoWeight: 2 },
    { city: "Middletown",  state: "Delaware", stateCode: "DE", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 1 },
    { city: "Smyrna",      state: "Delaware", stateCode: "DE", rent: 1600, other: 1020, lifestyle: "balanced", seoWeight: 1 },
    { city: "Milford",     state: "Delaware", stateCode: "DE", rent: 1550, other: 1010, lifestyle: "balanced", seoWeight: 1 },
  ],

  florida: [
    { city: "Miami",          state: "Florida", stateCode: "FL", rent: 2900, other: 1200, lifestyle: "premium",  seoWeight: 5 },
    { city: "Orlando",        state: "Florida", stateCode: "FL", rent: 2200, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Tampa",          state: "Florida", stateCode: "FL", rent: 2100, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Jacksonville",   state: "Florida", stateCode: "FL", rent: 1800, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "St Petersburg",  state: "Florida", stateCode: "FL", rent: 2300, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "Fort Lauderdale",state: "Florida", stateCode: "FL", rent: 2600, other: 1150, lifestyle: "premium",  seoWeight: 3 },
  ],

  georgia: [
    { city: "Atlanta",   state: "Georgia", stateCode: "GA", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "Savannah",  state: "Georgia", stateCode: "GA", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Augusta",   state: "Georgia", stateCode: "GA", rent: 1200, other: 920,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Columbus",  state: "Georgia", stateCode: "GA", rent: 1050, other: 900,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Macon",     state: "Georgia", stateCode: "GA", rent: 1050, other: 900,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Athens",    state: "Georgia", stateCode: "GA", rent: 1350, other: 950,  lifestyle: "budget",   seoWeight: 2 },
  ],

  hawaii: [
    { city: "Honolulu",   state: "Hawaii", stateCode: "HI", rent: 2800, other: 1500, lifestyle: "premium",  seoWeight: 5 },
    { city: "Hilo",       state: "Hawaii", stateCode: "HI", rent: 1900, other: 1350, lifestyle: "balanced", seoWeight: 2 },
    { city: "Kailua",     state: "Hawaii", stateCode: "HI", rent: 3000, other: 1550, lifestyle: "premium",  seoWeight: 2 },
    { city: "Pearl City", state: "Hawaii", stateCode: "HI", rent: 2500, other: 1450, lifestyle: "premium",  seoWeight: 1 },
    { city: "Waipahu",    state: "Hawaii", stateCode: "HI", rent: 2300, other: 1420, lifestyle: "balanced", seoWeight: 1 },
    { city: "Kaneohe",    state: "Hawaii", stateCode: "HI", rent: 2700, other: 1480, lifestyle: "premium",  seoWeight: 1 },
  ],

  idaho: [
    { city: "Boise",       state: "Idaho", stateCode: "ID", rent: 1800, other: 1000, lifestyle: "balanced", seoWeight: 4 },
    { city: "Meridian",    state: "Idaho", stateCode: "ID", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Nampa",       state: "Idaho", stateCode: "ID", rent: 1600, other: 970,  lifestyle: "balanced", seoWeight: 2 },
    { city: "Idaho Falls", state: "Idaho", stateCode: "ID", rent: 1400, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Pocatello",   state: "Idaho", stateCode: "ID", rent: 1300, other: 940,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Caldwell",    state: "Idaho", stateCode: "ID", rent: 1500, other: 960,  lifestyle: "balanced", seoWeight: 1 },
  ],

  illinois: [
    { city: "Chicago",     state: "Illinois", stateCode: "IL", rent: 2400, other: 1200, lifestyle: "balanced", seoWeight: 5 },
    { city: "Aurora",      state: "Illinois", stateCode: "IL", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Naperville",  state: "Illinois", stateCode: "IL", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Joliet",      state: "Illinois", stateCode: "IL", rent: 1700, other: 1020, lifestyle: "balanced", seoWeight: 2 },
    { city: "Rockford",    state: "Illinois", stateCode: "IL", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Springfield", state: "Illinois", stateCode: "IL", rent: 1500, other: 970,  lifestyle: "balanced", seoWeight: 2 },
  ],

  indiana: [
    { city: "Indianapolis", state: "Indiana", stateCode: "IN", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Fort Wayne",   state: "Indiana", stateCode: "IN", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Evansville",   state: "Indiana", stateCode: "IN", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 2 },
    { city: "South Bend",   state: "Indiana", stateCode: "IN", rent: 1150, other: 930,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Carmel",       state: "Indiana", stateCode: "IN", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Bloomington",  state: "Indiana", stateCode: "IN", rent: 1350, other: 960,  lifestyle: "budget",   seoWeight: 2 },
  ],

  iowa: [
    { city: "Des Moines",   state: "Iowa", stateCode: "IA", rent: 1300, other: 960, lifestyle: "budget",   seoWeight: 3 },
    { city: "Cedar Rapids", state: "Iowa", stateCode: "IA", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 2 },
    { city: "Davenport",    state: "Iowa", stateCode: "IA", rent: 1150, other: 930, lifestyle: "budget",   seoWeight: 2 },
    { city: "Sioux City",   state: "Iowa", stateCode: "IA", rent: 1050, other: 910, lifestyle: "budget",   seoWeight: 1 },
    { city: "Waterloo",     state: "Iowa", stateCode: "IA", rent: 1000, other: 900, lifestyle: "budget",   seoWeight: 1 },
    { city: "Iowa City",    state: "Iowa", stateCode: "IA", rent: 1350, other: 960, lifestyle: "budget",   seoWeight: 2 },
  ],

  kansas: [
    { city: "Wichita",      state: "Kansas", stateCode: "KS", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 3 },
    { city: "Overland Park",state: "Kansas", stateCode: "KS", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Kansas City",  state: "Kansas", stateCode: "KS", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Topeka",       state: "Kansas", stateCode: "KS", rent: 1000, other: 900,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Olathe",       state: "Kansas", stateCode: "KS", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Lawrence",     state: "Kansas", stateCode: "KS", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
  ],

  kentucky: [
    { city: "Louisville",    state: "Kentucky", stateCode: "KY", rent: 1300, other: 950, lifestyle: "budget",   seoWeight: 4 },
    { city: "Lexington",     state: "Kentucky", stateCode: "KY", rent: 1400, other: 970, lifestyle: "budget",   seoWeight: 3 },
    { city: "Bowling Green", state: "Kentucky", stateCode: "KY", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 2 },
    { city: "Owensboro",     state: "Kentucky", stateCode: "KY", rent: 1100, other: 920, lifestyle: "budget",   seoWeight: 1 },
    { city: "Covington",     state: "Kentucky", stateCode: "KY", rent: 1300, other: 950, lifestyle: "budget",   seoWeight: 1 },
    { city: "Richmond",      state: "Kentucky", stateCode: "KY", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 1 },
  ],

  louisiana: [
    { city: "New Orleans",  state: "Louisiana", stateCode: "LA", rent: 1700, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Baton Rouge",  state: "Louisiana", stateCode: "LA", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 3 },
    { city: "Shreveport",   state: "Louisiana", stateCode: "LA", rent: 1050, other: 900,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Metairie",     state: "Louisiana", stateCode: "LA", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Lafayette",    state: "Louisiana", stateCode: "LA", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Lake Charles", state: "Louisiana", stateCode: "LA", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 1 },
  ],

  maine: [
    { city: "Portland",      state: "Maine", stateCode: "ME", rent: 2100, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Lewiston",      state: "Maine", stateCode: "ME", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Bangor",        state: "Maine", stateCode: "ME", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 2 },
    { city: "South Portland",state: "Maine", stateCode: "ME", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 1 },
    { city: "Auburn",        state: "Maine", stateCode: "ME", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Biddeford",     state: "Maine", stateCode: "ME", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 1 },
  ],

  maryland: [
    { city: "Baltimore",    state: "Maryland", stateCode: "MD", rent: 1700, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Rockville",    state: "Maryland", stateCode: "MD", rent: 2400, other: 1200, lifestyle: "premium",  seoWeight: 3 },
    { city: "Gaithersburg", state: "Maryland", stateCode: "MD", rent: 2200, other: 1150, lifestyle: "balanced", seoWeight: 2 },
    { city: "Bowie",        state: "Maryland", stateCode: "MD", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Frederick",    state: "Maryland", stateCode: "MD", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 2 },
    { city: "Annapolis",    state: "Maryland", stateCode: "MD", rent: 2200, other: 1150, lifestyle: "balanced", seoWeight: 2 },
  ],

  massachusetts: [
    { city: "Boston",      state: "Massachusetts", stateCode: "MA", rent: 3100, other: 1300, lifestyle: "premium",  seoWeight: 5 },
    { city: "Worcester",   state: "Massachusetts", stateCode: "MA", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "Springfield", state: "Massachusetts", stateCode: "MA", rent: 1500, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Cambridge",   state: "Massachusetts", stateCode: "MA", rent: 3300, other: 1350, lifestyle: "premium",  seoWeight: 4 },
    { city: "Lowell",      state: "Massachusetts", stateCode: "MA", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 2 },
    { city: "Brockton",    state: "Massachusetts", stateCode: "MA", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 2 },
  ],

  michigan: [
    { city: "Detroit",          state: "Michigan", stateCode: "MI", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Grand Rapids",     state: "Michigan", stateCode: "MI", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Warren",           state: "Michigan", stateCode: "MI", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Sterling Heights", state: "Michigan", stateCode: "MI", rent: 1500, other: 990,  lifestyle: "balanced", seoWeight: 2 },
    { city: "Lansing",          state: "Michigan", stateCode: "MI", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Ann Arbor",        state: "Michigan", stateCode: "MI", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 3 },
  ],

  minnesota: [
    { city: "Minneapolis",   state: "Minnesota", stateCode: "MN", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "St Paul",       state: "Minnesota", stateCode: "MN", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Rochester",     state: "Minnesota", stateCode: "MN", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Duluth",        state: "Minnesota", stateCode: "MN", rent: 1300, other: 960,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Bloomington",   state: "Minnesota", stateCode: "MN", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Brooklyn Park", state: "Minnesota", stateCode: "MN", rent: 1700, other: 1030, lifestyle: "balanced", seoWeight: 1 },
  ],

  mississippi: [
    { city: "Jackson",      state: "Mississippi", stateCode: "MS", rent: 1050, other: 900, lifestyle: "budget", seoWeight: 3 },
    { city: "Gulfport",     state: "Mississippi", stateCode: "MS", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 2 },
    { city: "Southaven",    state: "Mississippi", stateCode: "MS", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 1 },
    { city: "Hattiesburg",  state: "Mississippi", stateCode: "MS", rent: 1100, other: 920, lifestyle: "budget", seoWeight: 2 },
    { city: "Biloxi",       state: "Mississippi", stateCode: "MS", rent: 1250, other: 940, lifestyle: "budget", seoWeight: 2 },
    { city: "Meridian",     state: "Mississippi", stateCode: "MS", rent:  950, other: 880, lifestyle: "budget", seoWeight: 1 },
  ],

  missouri: [
    { city: "Kansas City",  state: "Missouri", stateCode: "MO", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 4 },
    { city: "St Louis",     state: "Missouri", stateCode: "MO", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Springfield",  state: "Missouri", stateCode: "MO", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Columbia",     state: "Missouri", stateCode: "MO", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Independence", state: "Missouri", stateCode: "MO", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Lee Summit",   state: "Missouri", stateCode: "MO", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 1 },
  ],

  montana: [
    { city: "Billings",    state: "Montana", stateCode: "MT", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 3 },
    { city: "Missoula",    state: "Montana", stateCode: "MT", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Great Falls", state: "Montana", stateCode: "MT", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Bozeman",     state: "Montana", stateCode: "MT", rent: 2100, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Butte",       state: "Montana", stateCode: "MT", rent: 1000, other: 900,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Helena",      state: "Montana", stateCode: "MT", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
  ],

  nebraska: [
    { city: "Omaha",        state: "Nebraska", stateCode: "NE", rent: 1300, other: 950, lifestyle: "budget", seoWeight: 4 },
    { city: "Lincoln",      state: "Nebraska", stateCode: "NE", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 3 },
    { city: "Bellevue",     state: "Nebraska", stateCode: "NE", rent: 1300, other: 950, lifestyle: "budget", seoWeight: 1 },
    { city: "Grand Island", state: "Nebraska", stateCode: "NE", rent: 1000, other: 900, lifestyle: "budget", seoWeight: 1 },
    { city: "Kearney",      state: "Nebraska", stateCode: "NE", rent: 1050, other: 905, lifestyle: "budget", seoWeight: 1 },
    { city: "Fremont",      state: "Nebraska", stateCode: "NE", rent: 1050, other: 905, lifestyle: "budget", seoWeight: 1 },
  ],

  nevada: [
    { city: "Las Vegas",      state: "Nevada", stateCode: "NV", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 5 },
    { city: "Henderson",      state: "Nevada", stateCode: "NV", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Reno",           state: "Nevada", stateCode: "NV", rent: 1800, other: 1030, lifestyle: "balanced", seoWeight: 4 },
    { city: "North Las Vegas", state: "Nevada", stateCode: "NV", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Sparks",         state: "Nevada", stateCode: "NV", rent: 1700, other: 1010, lifestyle: "balanced", seoWeight: 2 },
    { city: "Carson City",    state: "Nevada", stateCode: "NV", rent: 1600, other: 990,  lifestyle: "balanced", seoWeight: 2 },
  ],

  "new-hampshire": [
    { city: "Manchester", state: "New Hampshire", stateCode: "NH", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Nashua",     state: "New Hampshire", stateCode: "NH", rent: 2000, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "Concord",    state: "New Hampshire", stateCode: "NH", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Derry",      state: "New Hampshire", stateCode: "NH", rent: 1900, other: 1070, lifestyle: "balanced", seoWeight: 1 },
    { city: "Dover",      state: "New Hampshire", stateCode: "NH", rent: 1900, other: 1070, lifestyle: "balanced", seoWeight: 1 },
    { city: "Rochester",  state: "New Hampshire", stateCode: "NH", rent: 1700, other: 1030, lifestyle: "balanced", seoWeight: 1 },
  ],

  "new-jersey": [
    { city: "Newark",      state: "New Jersey", stateCode: "NJ", rent: 2200, other: 1200, lifestyle: "balanced", seoWeight: 3 },
    { city: "Jersey City", state: "New Jersey", stateCode: "NJ", rent: 3200, other: 1400, lifestyle: "premium",  seoWeight: 4 },
    { city: "Paterson",    state: "New Jersey", stateCode: "NJ", rent: 1900, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Elizabeth",   state: "New Jersey", stateCode: "NJ", rent: 2100, other: 1150, lifestyle: "balanced", seoWeight: 2 },
    { city: "Trenton",     state: "New Jersey", stateCode: "NJ", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Camden",      state: "New Jersey", stateCode: "NJ", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 1 },
  ],

  "new-mexico": [
    { city: "Albuquerque", state: "New Mexico", stateCode: "NM", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Las Cruces",  state: "New Mexico", stateCode: "NM", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Rio Rancho",  state: "New Mexico", stateCode: "NM", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 2 },
    { city: "Santa Fe",    state: "New Mexico", stateCode: "NM", rent: 1900, other: 1080, lifestyle: "balanced", seoWeight: 3 },
    { city: "Roswell",     state: "New Mexico", stateCode: "NM", rent: 1050, other: 910,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Farmington",  state: "New Mexico", stateCode: "NM", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 1 },
  ],

  "new-york": [
    { city: "New York City", state: "New York", stateCode: "NY", rent: 3800, other: 1500, lifestyle: "premium",  seoWeight: 5 },
    { city: "Buffalo",       state: "New York", stateCode: "NY", rent: 1500, other: 950,  lifestyle: "balanced", seoWeight: 3 },
    { city: "Rochester",     state: "New York", stateCode: "NY", rent: 1400, other: 950,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Yonkers",       state: "New York", stateCode: "NY", rent: 2800, other: 1300, lifestyle: "premium",  seoWeight: 3 },
    { city: "Syracuse",      state: "New York", stateCode: "NY", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Albany",        state: "New York", stateCode: "NY", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
  ],

  "north-carolina": [
    { city: "Charlotte",     state: "North Carolina", stateCode: "NC", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "Raleigh",       state: "North Carolina", stateCode: "NC", rent: 1900, other: 1000, lifestyle: "balanced", seoWeight: 4 },
    { city: "Greensboro",    state: "North Carolina", stateCode: "NC", rent: 1500, other: 970,  lifestyle: "balanced", seoWeight: 2 },
    { city: "Durham",        state: "North Carolina", stateCode: "NC", rent: 1800, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Winston Salem", state: "North Carolina", stateCode: "NC", rent: 1400, other: 960,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Fayetteville",  state: "North Carolina", stateCode: "NC", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 2 },
  ],

  "north-dakota": [
    { city: "Fargo",       state: "North Dakota", stateCode: "ND", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 3 },
    { city: "Bismarck",    state: "North Dakota", stateCode: "ND", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Grand Forks", state: "North Dakota", stateCode: "ND", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Minot",       state: "North Dakota", stateCode: "ND", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 1 },
    { city: "West Fargo",  state: "North Dakota", stateCode: "ND", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Williston",   state: "North Dakota", stateCode: "ND", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 1 },
  ],

  ohio: [
    { city: "Columbus",   state: "Ohio", stateCode: "OH", rent: 1400, other: 970, lifestyle: "budget",   seoWeight: 4 },
    { city: "Cleveland",  state: "Ohio", stateCode: "OH", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 3 },
    { city: "Cincinnati", state: "Ohio", stateCode: "OH", rent: 1400, other: 970, lifestyle: "budget",   seoWeight: 3 },
    { city: "Toledo",     state: "Ohio", stateCode: "OH", rent: 1100, other: 920, lifestyle: "budget",   seoWeight: 2 },
    { city: "Akron",      state: "Ohio", stateCode: "OH", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 2 },
    { city: "Dayton",     state: "Ohio", stateCode: "OH", rent: 1100, other: 920, lifestyle: "budget",   seoWeight: 2 },
  ],

  oklahoma: [
    { city: "Oklahoma City", state: "Oklahoma", stateCode: "OK", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 4 },
    { city: "Tulsa",         state: "Oklahoma", stateCode: "OK", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 3 },
    { city: "Norman",        state: "Oklahoma", stateCode: "OK", rent: 1200, other: 940, lifestyle: "budget",   seoWeight: 2 },
    { city: "Broken Arrow",  state: "Oklahoma", stateCode: "OK", rent: 1300, other: 950, lifestyle: "budget",   seoWeight: 1 },
    { city: "Lawton",        state: "Oklahoma", stateCode: "OK", rent: 1000, other: 900, lifestyle: "budget",   seoWeight: 1 },
    { city: "Edmond",        state: "Oklahoma", stateCode: "OK", rent: 1500, other: 980, lifestyle: "balanced", seoWeight: 2 },
  ],

  oregon: [
    { city: "Portland",  state: "Oregon", stateCode: "OR", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 5 },
    { city: "Eugene",    state: "Oregon", stateCode: "OR", rent: 1700, other: 1020, lifestyle: "balanced", seoWeight: 3 },
    { city: "Salem",     state: "Oregon", stateCode: "OR", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Gresham",   state: "Oregon", stateCode: "OR", rent: 1900, other: 1060, lifestyle: "balanced", seoWeight: 2 },
    { city: "Hillsboro", state: "Oregon", stateCode: "OR", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 2 },
    { city: "Beaverton", state: "Oregon", stateCode: "OR", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 2 },
  ],

  pennsylvania: [
    { city: "Philadelphia", state: "Pennsylvania", stateCode: "PA", rent: 2000, other: 1100, lifestyle: "balanced", seoWeight: 5 },
    { city: "Pittsburgh",   state: "Pennsylvania", stateCode: "PA", rent: 1700, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Allentown",    state: "Pennsylvania", stateCode: "PA", rent: 1600, other: 1020, lifestyle: "balanced", seoWeight: 2 },
    { city: "Erie",         state: "Pennsylvania", stateCode: "PA", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Reading",      state: "Pennsylvania", stateCode: "PA", rent: 1300, other: 950,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Scranton",     state: "Pennsylvania", stateCode: "PA", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
  ],

  "rhode-island": [
    { city: "Providence",      state: "Rhode Island", stateCode: "RI", rent: 1900, other: 1080, lifestyle: "balanced", seoWeight: 3 },
    { city: "Cranston",        state: "Rhode Island", stateCode: "RI", rent: 1900, other: 1080, lifestyle: "balanced", seoWeight: 1 },
    { city: "Warwick",         state: "Rhode Island", stateCode: "RI", rent: 1900, other: 1080, lifestyle: "balanced", seoWeight: 2 },
    { city: "Pawtucket",       state: "Rhode Island", stateCode: "RI", rent: 1800, other: 1060, lifestyle: "balanced", seoWeight: 1 },
    { city: "East Providence", state: "Rhode Island", stateCode: "RI", rent: 1800, other: 1060, lifestyle: "balanced", seoWeight: 1 },
    { city: "Woonsocket",      state: "Rhode Island", stateCode: "RI", rent: 1500, other: 1000, lifestyle: "balanced", seoWeight: 1 },
  ],

  "south-carolina": [
    { city: "Columbia",         state: "South Carolina", stateCode: "SC", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 3 },
    { city: "Charleston",       state: "South Carolina", stateCode: "SC", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "North Charleston", state: "South Carolina", stateCode: "SC", rent: 1700, other: 1030, lifestyle: "balanced", seoWeight: 2 },
    { city: "Mount Pleasant",   state: "South Carolina", stateCode: "SC", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Rock Hill",        state: "South Carolina", stateCode: "SC", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Greenville",       state: "South Carolina", stateCode: "SC", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 3 },
  ],

  "south-dakota": [
    { city: "Sioux Falls", state: "South Dakota", stateCode: "SD", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 3 },
    { city: "Rapid City",  state: "South Dakota", stateCode: "SD", rent: 1300, other: 950, lifestyle: "budget", seoWeight: 2 },
    { city: "Aberdeen",    state: "South Dakota", stateCode: "SD", rent: 1000, other: 900, lifestyle: "budget", seoWeight: 1 },
    { city: "Brookings",   state: "South Dakota", stateCode: "SD", rent: 1100, other: 920, lifestyle: "budget", seoWeight: 1 },
    { city: "Watertown",   state: "South Dakota", stateCode: "SD", rent: 1000, other: 900, lifestyle: "budget", seoWeight: 1 },
    { city: "Mitchell",    state: "South Dakota", stateCode: "SD", rent:  900, other: 880, lifestyle: "budget", seoWeight: 1 },
  ],

  tennessee: [
    { city: "Nashville",    state: "Tennessee", stateCode: "TN", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "Memphis",      state: "Tennessee", stateCode: "TN", rent: 1100, other: 920,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Knoxville",    state: "Tennessee", stateCode: "TN", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 3 },
    { city: "Chattanooga",  state: "Tennessee", stateCode: "TN", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 3 },
    { city: "Clarksville",  state: "Tennessee", stateCode: "TN", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Murfreesboro", state: "Tennessee", stateCode: "TN", rent: 1700, other: 1030, lifestyle: "balanced", seoWeight: 2 },
  ],

  texas: [
    { city: "Houston",     state: "Texas", stateCode: "TX", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "Dallas",      state: "Texas", stateCode: "TX", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 4 },
    { city: "Austin",      state: "Texas", stateCode: "TX", rent: 2200, other: 1100, lifestyle: "balanced", seoWeight: 5 },
    { city: "San Antonio", state: "Texas", stateCode: "TX", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "Fort Worth",  state: "Texas", stateCode: "TX", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "El Paso",     state: "Texas", stateCode: "TX", rent: 1400, other: 900,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Plano",       state: "Texas", stateCode: "TX", rent: 2000, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Frisco",      state: "Texas", stateCode: "TX", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
  ],

  utah: [
    { city: "Salt Lake City",  state: "Utah", stateCode: "UT", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 5 },
    { city: "West Valley City",state: "Utah", stateCode: "UT", rent: 1700, other: 1020, lifestyle: "balanced", seoWeight: 2 },
    { city: "Provo",           state: "Utah", stateCode: "UT", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 3 },
    { city: "West Jordan",     state: "Utah", stateCode: "UT", rent: 1800, other: 1040, lifestyle: "balanced", seoWeight: 2 },
    { city: "Orem",            state: "Utah", stateCode: "UT", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Ogden",           state: "Utah", stateCode: "UT", rent: 1500, other: 980,  lifestyle: "balanced", seoWeight: 2 },
  ],

  vermont: [
    { city: "Burlington",      state: "Vermont", stateCode: "VT", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 3 },
    { city: "South Burlington",state: "Vermont", stateCode: "VT", rent: 2000, other: 1080, lifestyle: "balanced", seoWeight: 1 },
    { city: "Rutland",         state: "Vermont", stateCode: "VT", rent: 1400, other: 980,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Barre",           state: "Vermont", stateCode: "VT", rent: 1300, other: 960,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Montpelier",      state: "Vermont", stateCode: "VT", rent: 1600, other: 1000, lifestyle: "balanced", seoWeight: 1 },
    { city: "Winooski",        state: "Vermont", stateCode: "VT", rent: 1900, other: 1070, lifestyle: "balanced", seoWeight: 1 },
  ],

  virginia: [
    { city: "Virginia Beach", state: "Virginia", stateCode: "VA", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Norfolk",        state: "Virginia", stateCode: "VA", rent: 1700, other: 1030, lifestyle: "balanced", seoWeight: 3 },
    { city: "Chesapeake",     state: "Virginia", stateCode: "VA", rent: 1900, other: 1060, lifestyle: "balanced", seoWeight: 2 },
    { city: "Richmond",       state: "Virginia", stateCode: "VA", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Arlington",      state: "Virginia", stateCode: "VA", rent: 2800, other: 1350, lifestyle: "premium",  seoWeight: 4 },
    { city: "Alexandria",     state: "Virginia", stateCode: "VA", rent: 2700, other: 1320, lifestyle: "premium",  seoWeight: 3 },
  ],

  washington: [
    { city: "Seattle",   state: "Washington", stateCode: "WA", rent: 2800, other: 1250, lifestyle: "premium",  seoWeight: 5 },
    { city: "Spokane",   state: "Washington", stateCode: "WA", rent: 1700, other: 1000, lifestyle: "balanced", seoWeight: 2 },
    { city: "Tacoma",    state: "Washington", stateCode: "WA", rent: 2000, other: 1050, lifestyle: "balanced", seoWeight: 3 },
    { city: "Vancouver", state: "Washington", stateCode: "WA", rent: 1900, other: 1050, lifestyle: "balanced", seoWeight: 2 },
    { city: "Bellevue",  state: "Washington", stateCode: "WA", rent: 3000, other: 1300, lifestyle: "premium",  seoWeight: 3 },
    { city: "Kent",      state: "Washington", stateCode: "WA", rent: 2100, other: 1100, lifestyle: "balanced", seoWeight: 2 },
    { city: "Redmond",   state: "Washington", stateCode: "WA", rent: 2700, other: 1200, lifestyle: "premium",  seoWeight: 3 },
  ],

  "west-virginia": [
    { city: "Charleston",  state: "West Virginia", stateCode: "WV", rent: 1100, other: 920, lifestyle: "budget", seoWeight: 2 },
    { city: "Huntington",  state: "West Virginia", stateCode: "WV", rent: 1050, other: 910, lifestyle: "budget", seoWeight: 1 },
    { city: "Parkersburg", state: "West Virginia", stateCode: "WV", rent: 1000, other: 905, lifestyle: "budget", seoWeight: 1 },
    { city: "Morgantown",  state: "West Virginia", stateCode: "WV", rent: 1400, other: 970, lifestyle: "budget", seoWeight: 2 },
    { city: "Wheeling",    state: "West Virginia", stateCode: "WV", rent: 1050, other: 910, lifestyle: "budget", seoWeight: 1 },
    { city: "Weirton",     state: "West Virginia", stateCode: "WV", rent:  950, other: 880, lifestyle: "budget", seoWeight: 1 },
  ],

  wisconsin: [
    { city: "Milwaukee",  state: "Wisconsin", stateCode: "WI", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 4 },
    { city: "Madison",    state: "Wisconsin", stateCode: "WI", rent: 1800, other: 1050, lifestyle: "balanced", seoWeight: 4 },
    { city: "Green Bay",  state: "Wisconsin", stateCode: "WI", rent: 1200, other: 940,  lifestyle: "budget",   seoWeight: 2 },
    { city: "Kenosha",    state: "Wisconsin", stateCode: "WI", rent: 1400, other: 970,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Racine",     state: "Wisconsin", stateCode: "WI", rent: 1300, other: 955,  lifestyle: "budget",   seoWeight: 1 },
    { city: "Appleton",   state: "Wisconsin", stateCode: "WI", rent: 1300, other: 955,  lifestyle: "budget",   seoWeight: 2 },
  ],

  wyoming: [
    { city: "Cheyenne",    state: "Wyoming", stateCode: "WY", rent: 1300, other: 950, lifestyle: "budget", seoWeight: 3 },
    { city: "Casper",      state: "Wyoming", stateCode: "WY", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 2 },
    { city: "Laramie",     state: "Wyoming", stateCode: "WY", rent: 1300, other: 955, lifestyle: "budget", seoWeight: 1 },
    { city: "Gillette",    state: "Wyoming", stateCode: "WY", rent: 1400, other: 960, lifestyle: "budget", seoWeight: 1 },
    { city: "Rock Springs",state: "Wyoming", stateCode: "WY", rent: 1400, other: 960, lifestyle: "budget", seoWeight: 1 },
    { city: "Sheridan",    state: "Wyoming", stateCode: "WY", rent: 1200, other: 940, lifestyle: "budget", seoWeight: 1 },
  ],

} satisfies Record<string, CityCost[]>;
