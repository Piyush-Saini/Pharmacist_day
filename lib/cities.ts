/**
 * City → state lookup for the autocomplete in PRD §6.4, so state auto-fills
 * from the city and the pharmacist types one field instead of two.
 *
 * This prototype carries a representative list across tier 1–3 towns. For the
 * national build, replace this with the full Census/India Post city dataset —
 * the lookup interface below does not need to change.
 */

export interface CityEntry {
  city: string;
  state: string;
}

export const CITIES: CityEntry[] = [
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Ajmer", state: "Rajasthan" },
  { city: "Aligarh", state: "Uttar Pradesh" },
  { city: "Allahabad", state: "Uttar Pradesh" },
  { city: "Amravati", state: "Maharashtra" },
  { city: "Amritsar", state: "Punjab" },
  { city: "Aurangabad", state: "Maharashtra" },
  { city: "Bareilly", state: "Uttar Pradesh" },
  { city: "Bathinda", state: "Punjab" },
  { city: "Belgaum", state: "Karnataka" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Bhagalpur", state: "Bihar" },
  { city: "Bhavnagar", state: "Gujarat" },
  { city: "Bhilai", state: "Chhattisgarh" },
  { city: "Bhiwandi", state: "Maharashtra" },
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Bikaner", state: "Rajasthan" },
  { city: "Chandigarh", state: "Chandigarh" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Cuttack", state: "Odisha" },
  { city: "Dehradun", state: "Uttarakhand" },
  { city: "Delhi", state: "Delhi" },
  { city: "Dhanbad", state: "Jharkhand" },
  { city: "Durgapur", state: "West Bengal" },
  { city: "Erode", state: "Tamil Nadu" },
  { city: "Faridabad", state: "Haryana" },
  { city: "Firozabad", state: "Uttar Pradesh" },
  { city: "Gaya", state: "Bihar" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Gorakhpur", state: "Uttar Pradesh" },
  { city: "Guntur", state: "Andhra Pradesh" },
  { city: "Gurugram", state: "Haryana" },
  { city: "Guwahati", state: "Assam" },
  { city: "Gwalior", state: "Madhya Pradesh" },
  { city: "Haridwar", state: "Uttarakhand" },
  { city: "Hubli", state: "Karnataka" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Jabalpur", state: "Madhya Pradesh" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Jalandhar", state: "Punjab" },
  { city: "Jalgaon", state: "Maharashtra" },
  { city: "Jammu", state: "Jammu and Kashmir" },
  { city: "Jamnagar", state: "Gujarat" },
  { city: "Jamshedpur", state: "Jharkhand" },
  { city: "Jhansi", state: "Uttar Pradesh" },
  { city: "Jodhpur", state: "Rajasthan" },
  { city: "Kakinada", state: "Andhra Pradesh" },
  { city: "Kalyan", state: "Maharashtra" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Karnal", state: "Haryana" },
  { city: "Kochi", state: "Kerala" },
  { city: "Kolhapur", state: "Maharashtra" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Kollam", state: "Kerala" },
  { city: "Kota", state: "Rajasthan" },
  { city: "Kozhikode", state: "Kerala" },
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Madurai", state: "Tamil Nadu" },
  { city: "Mangaluru", state: "Karnataka" },
  { city: "Mathura", state: "Uttar Pradesh" },
  { city: "Meerut", state: "Uttar Pradesh" },
  { city: "Moradabad", state: "Uttar Pradesh" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Muzaffarpur", state: "Bihar" },
  { city: "Mysuru", state: "Karnataka" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Nanded", state: "Maharashtra" },
  { city: "Nashik", state: "Maharashtra" },
  { city: "Nellore", state: "Andhra Pradesh" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Panipat", state: "Haryana" },
  { city: "Panaji", state: "Goa" },
  { city: "Patiala", state: "Punjab" },
  { city: "Patna", state: "Bihar" },
  { city: "Puducherry", state: "Puducherry" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Raipur", state: "Chhattisgarh" },
  { city: "Rajahmundry", state: "Andhra Pradesh" },
  { city: "Rajkot", state: "Gujarat" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Rohtak", state: "Haryana" },
  { city: "Rourkela", state: "Odisha" },
  { city: "Sagar", state: "Madhya Pradesh" },
  { city: "Salem", state: "Tamil Nadu" },
  { city: "Sangli", state: "Maharashtra" },
  { city: "Shimla", state: "Himachal Pradesh" },
  { city: "Siliguri", state: "West Bengal" },
  { city: "Solapur", state: "Maharashtra" },
  { city: "Srinagar", state: "Jammu and Kashmir" },
  { city: "Surat", state: "Gujarat" },
  { city: "Thane", state: "Maharashtra" },
  { city: "Thiruvananthapuram", state: "Kerala" },
  { city: "Thrissur", state: "Kerala" },
  { city: "Tiruchirappalli", state: "Tamil Nadu" },
  { city: "Tirunelveli", state: "Tamil Nadu" },
  { city: "Tirupati", state: "Andhra Pradesh" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Ujjain", state: "Madhya Pradesh" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Warangal", state: "Telangana" },
];

export const STATES: string[] = Array.from(
  new Set(CITIES.map((c) => c.state)),
).sort();

/** Prefix-first, then substring — so "pu" surfaces Pune before Rajahmundry. */
export function searchCities(query: string, limit = 6): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const prefix: CityEntry[] = [];
  const substring: CityEntry[] = [];

  for (const entry of CITIES) {
    const city = entry.city.toLowerCase();
    if (city.startsWith(q)) {
      prefix.push(entry);
    } else if (city.includes(q)) {
      substring.push(entry);
    }
  }

  return [...prefix, ...substring].slice(0, limit);
}

export function stateForCity(city: string): string | null {
  const match = CITIES.find(
    (c) => c.city.toLowerCase() === city.trim().toLowerCase(),
  );
  return match?.state ?? null;
}
