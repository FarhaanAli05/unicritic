import {
  parse_search_response,
  parse_details_response,
  parse_offers_for_countries_response,
  prepare_search_request,
  prepare_details_request,
  prepare_offers_for_countries_request,
} from "./query.js";

const _GRAPHQL_API_URL = "https://apis.justwatch.com/graphql";

/**
 * Search JustWatch for a title
 * @param {string} title
 * @param {string} country
 * @param {string} language
 * @param {number} count
 * @param {boolean} best_only
 * @returns {Promise<any[]>}
 */
export async function search(
  title,
  country = "US",
  language = "en",
  count = 4,
  best_only = true,
) {
  const request = prepare_search_request(
    title,
    country,
    language,
    count,
    best_only,
  );
  const resp = await fetch(_GRAPHQL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(
      `JustWatch API returned HTTP ${resp.status}: ${text}`,
    );
    err.status = resp.status;
    throw err;
  }
  const json = await resp.json();
  return parse_search_response(json);
}

/**
 * Get details for a node id
 * @param {string} node_id
 * @param {string} country
 * @param {string} language
 * @param {boolean} best_only
 * @returns {Promise<any|null>}
 */
export async function details(
  node_id,
  country = "US",
  language = "en",
  best_only = true,
) {
  const request = prepare_details_request(
    node_id,
    country,
    language,
    best_only,
  );
  const resp = await fetch(_GRAPHQL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(
      `JustWatch API returned HTTP ${resp.status}: ${text}`,
    );
    err.status = resp.status;
    throw err;
  }
  const json = await resp.json();
  return parse_details_response(json);
}

/**
 * Get offers for multiple countries for a node id
 * @param {string} node_id
 * @param {Iterable<string>|string[]} countries - set or array of country codes
 * @param {string} language
 * @param {boolean} best_only
 * @returns {Promise<Object<string, any[]>>}
 */
export async function offersForCountries(
  node_id,
  countries,
  language = "en",
  best_only = true,
) {
  const countryArray = Array.isArray(countries)
    ? countries
    : Array.from(countries || []);
  if (!countryArray || countryArray.length === 0) return {};
  const request = prepare_offers_for_countries_request(
    node_id,
    countryArray,
    language,
    best_only,
  );
  const resp = await fetch(_GRAPHQL_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(
      `JustWatch API returned HTTP ${resp.status}: ${text}`,
    );
    err.status = resp.status;
    throw err;
  }
  const json = await resp.json();
  return parse_offers_for_countries_response(json, countryArray);
}

export default { search, details, offersForCountries };
