export function salaryLinks(salary: number, state: string) {
  return {
    salaryPage: `/salary/${salary}-${state}`,
    livingState: `/living/is-${salary}-enough-in-${state}`,
    bestCities: `/best-cities/${state}/${salary}`,
  };
}

export function cityLivingLink(
  salary: number,
  city: string
) {
  return `/city-living/is-${salary}-enough-in-${city}`;
}

export function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}
