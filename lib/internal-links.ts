// export function salaryLinks(salary: number, state: string) {
//   return {
//     salaryPage: `/salary/${salary}-${state}`,
//     livingState: `/living/is-${salary}-enough-in-${state}`,
//     bestCities: `/best-cities/${state}/${salary}`,
//   };
// }

// export function cityLivingLink(
//   salary: number,
//   city: string
// ) {
//   return `/city-living/is-${salary}-enough-in-${city}`;
// }

// export function citySlug(city: string) {
//   return city.toLowerCase().replace(/\s+/g, "-");
// }


/* -----------------------------------------
   URL HELPERS (Hyphen Slug Format)
   Format: /salary/{amount}-{state}
------------------------------------------ */

export function salaryLink(
  salary: number,
  state: string,
  year?: number | string
) {
  // Optional year support
  if (year) {
    return `/salary/${salary}-${state}-${year}`;
  }

  return `/salary/${salary}-${state}`;
}

export function livingStateLink(
  salary: number,
  state: string
) {
  return `/living/is-${salary}-enough-in-${state}`;
}

export function bestCitiesLink(
  state: string,
  salary: number
) {
  return `/best-cities/${state}/${salary}`;
}

export function cityLivingLink(
  salary: number,
  city: string
) {
  return `/city-living/is-${salary}-enough-in-${citySlug(city)}`;
}

export function citySlug(city: string) {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
