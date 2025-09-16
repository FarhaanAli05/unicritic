// Converted from query.py to Node.js (ES module)
// Provides helpers to build JustWatch GraphQL request bodies and parse responses.

const _DETAILS_URL = "https://justwatch.com";
const _IMAGES_URL = "https://images.justwatch.com";

const _GRAPHQL_DETAILS_QUERY = `
query GetTitleNode(
  $nodeId: ID!,
  $language: Language!,
  $country: Country!,
  $formatPoster: ImageFormat,
  $formatOfferIcon: ImageFormat,
  $profile: PosterProfile,
  $backdropProfile: BackdropProfile,
  $filter: OfferFilter!,
) {
  node(id: $nodeId) {
    ...TitleDetails
    __typename
  }
  __typename
}
`;

const _GRAPHQL_SEARCH_QUERY = `
query GetSearchTitles(
  $searchTitlesFilter: TitleFilter!,
  $country: Country!,
  $language: Language!,
  $first: Int!,
  $formatPoster: ImageFormat,
  $formatOfferIcon: ImageFormat,
  $profile: PosterProfile,
  $backdropProfile: BackdropProfile,
  $filter: OfferFilter!,
) {
  popularTitles(
    country: $country
    filter: $searchTitlesFilter
    first: $first
    sortBy: POPULAR
    sortRandomSeed: 0
  ) {
    edges {
      node {
        ...TitleDetails
        __typename
      }
      __typename
    }
    __typename
  }
}
`;

const _GRAPHQL_OFFERS_BY_COUNTRY_QUERY = `
query GetTitleOffers(
  $nodeId: ID!,
  $language: Language!,
  $formatOfferIcon: ImageFormat,
  $filter: OfferFilter!,
) {{
  node(id: $nodeId) {{
    ... on MovieOrShow {{
      {country_entries}
      __typename
    }}
    __typename
  }}
  __typename
}}
`;

const _GRAPHQL_DETAILS_FRAGMENT = `
fragment TitleDetails on MovieOrShow {
  id
  objectId
  objectType
  content(country: $country, language: $language) {
    title
    fullPath
    originalReleaseYear
    originalReleaseDate
    runtime
    shortDescription
    genres {
      shortName
      __typename
    }
    externalIds {
      imdbId
      tmdbId
      __typename
    }
    posterUrl(profile: $profile, format: $formatPoster)
    backdrops(profile: $backdropProfile, format: $formatPoster) {
      backdropUrl
      __typename
    }
    ageCertification
    scoring {
      imdbScore
      imdbVotes
      tmdbPopularity
      tmdbScore
      tomatoMeter
      certifiedFresh
      jwRating
      __typename
    }
    interactions {
      likelistAdditions
      dislikelistAdditions
      __typename
    }
    __typename
  }
  streamingCharts(country: $country) {
    edges {
      streamingChartInfo {
        rank
        trend
        trendDifference
        daysInTop3
        daysInTop10
        daysInTop100
        daysInTop1000
        topRank
        updatedAt
        __typename
      }
      __typename
    }
    __typename
  }
  offers(country: $country, platform: WEB, filter: $filter) {
    ...TitleOffer
  }
  __typename
}
`;

const _GRAPHQL_OFFER_FRAGMENT = `
fragment TitleOffer on Offer {
  id
  monetizationType
  presentationType
  retailPrice(language: $language)
  retailPriceValue
  currency
  lastChangeRetailPriceValue
  type
  package {
    id
    packageId
    clearName
    technicalName
    icon(profile: S100, format: $formatOfferIcon)
    __typename
  }
  standardWebURL
  elementCount
  availableTo
  deeplinkRoku: deeplinkURL(platform: ROKU_OS)
  subtitleLanguages
  videoTechnology
  audioTechnology
  audioLanguages
  __typename
}
`;

const _GRAPHQL_COUNTRY_OFFERS_ENTRY = `
      {country_code}: offers(country: {country_code}, platform: WEB, filter: $filter) {{
        ...TitleOffer
        __typename
      }}
`;

// -- JSDoc typedefs for developer ergonomics --
/**
 * @typedef {{id: string, package_id: number, name: string, technical_name: string, icon: string}} OfferPackage
 */
/**
 * @typedef {{
 *   id: string,
 *   monetization_type: string,
 *   presentation_type: string,
 *   price_string: string | null,
 *   price_value: number | null,
 *   price_currency: string | null,
 *   last_change_retail_price_value: number | null,
 *   type: string,
 *   package: OfferPackage,
 *   url: string | null,
 *   element_count: number | null,
 *   available_to: string | null,
 *   deeplink_roku: string | null,
 *   subtitle_languages: string[] | null,
 *   video_technology: string[] | null,
 *   audio_technology: string[] | null,
 *   audio_languages: string[] | null
 * }} Offer
 */

/**
 * @typedef {{
 *   imdb_score: number | null,
 *   imdb_votes: number | null,
 *   tmdb_popularity: number | null,
 *   tmdb_score: number | null,
 *   tomatometer: number | null,
 *   certified_fresh: boolean | null,
 *   jw_rating: number | null
 * }} Scoring
 */

/**
 * @typedef {{likes: number | null, dislikes: number | null}} Interactions
 */

/**
 * @typedef {{
 *  rank: number,
 *  trend: string,
 *  trend_difference: number,
 *  top_rank: number,
 *  days_in_top_3: number,
 *  days_in_top_10: number,
 *  days_in_top_100: number,
 *  days_in_top_1000: number,
 *  updated: string
 * }} StreamingCharts
 */

/**
 * @typedef {{
 *  entry_id: string,
 *  object_id: number,
 *  object_type: string,
 *  title: string,
 *  url: string,
 *  release_year: number | null,
 *  release_date: string | null,
 *  runtime_minutes: number | null,
 *  short_description: string | null,
 *  genres: string[],
 *  imdb_id: string | null,
 *  tmdb_id: string | null,
 *  poster: string | null,
 *  backdrops: string[],
 *  age_certification: string | null,
 *  scoring: Scoring | null,
 *  interactions: Interactions | null,
 *  streaming_charts: StreamingCharts | null,
 *  offers: Offer[]
 * }} MediaEntry
 */

// -- Exported functions --

/**
 * Prepare search request body for JustWatch GraphQL API
 * @param {string} title
 * @param {string} country
 * @param {string} language
 * @param {number} count
 * @param {boolean} best_only
 * @returns {Object}
 */
export function prepare_search_request(title, country, language, count, best_only) {
  _assert_country_code_is_valid(country);
  return {
    operationName: "GetSearchTitles",
    variables: {
      first: count,
      searchTitlesFilter: { searchQuery: title },
      language,
      country: country.toUpperCase(),
      formatPoster: "JPG",
      formatOfferIcon: "PNG",
      profile: "S718",
      backdropProfile: "S1920",
      filter: { bestOnly: best_only },
    },
    query: _GRAPHQL_SEARCH_QUERY + _GRAPHQL_DETAILS_FRAGMENT + _GRAPHQL_OFFER_FRAGMENT,
  };
}

/**
 * Parse search response JSON
 * @param {any} json
 * @returns {MediaEntry[]}
 */
export function parse_search_response(json) {
  if (!json || !json.data || !json.data.popularTitles || !Array.isArray(json.data.popularTitles.edges)) {
    return [];
  }
  return json.data.popularTitles.edges.map((edge) => _parse_entry(edge.node));
}

/**
 * Prepare details request body for given node id
 * @param {string} node_id
 * @param {string} country
 * @param {string} language
 * @param {boolean} best_only
 * @returns {Object}
 */
export function prepare_details_request(node_id, country, language, best_only) {
  _assert_country_code_is_valid(country);
  return {
    operationName: "GetTitleNode",
    variables: {
      nodeId: node_id,
      language,
      country: country.toUpperCase(),
      formatPoster: "JPG",
      formatOfferIcon: "PNG",
      profile: "S718",
      backdropProfile: "S1920",
      filter: { bestOnly: best_only },
    },
    query: _GRAPHQL_DETAILS_QUERY + _GRAPHQL_DETAILS_FRAGMENT + _GRAPHQL_OFFER_FRAGMENT,
  };
}

/**
 * Parse details response JSON
 * @param {any} json
 * @returns {MediaEntry | null}
 */
export function parse_details_response(json) {
  if (!json || json.errors) return null;
  return _parse_entry(json.data.node);
}

/**
 * Prepare offers request for multiple countries
 * @param {string} node_id
 * @param {Set<string>|string[]} countries
 * @param {string} language
 * @param {boolean} best_only
 * @returns {Object}
 */
export function prepare_offers_for_countries_request(node_id, countries, language, best_only) {
  const countryArray = Array.isArray(countries) ? countries : Array.from(countries);
  if (!countryArray || countryArray.length === 0) throw new Error("Cannot prepare offers request without specified countries");
  countryArray.forEach((c) => _assert_country_code_is_valid(c));
  return {
    operationName: "GetTitleOffers",
    variables: {
      nodeId: node_id,
      language,
      formatPoster: "JPG",
      formatOfferIcon: "PNG",
      profile: "S718",
      backdropProfile: "S1920",
      filter: { bestOnly: best_only },
    },
    query: _prepare_offers_for_countries_entry(countryArray),
  };
}

/**
 * Parse offers-for-countries response
 * @param {any} json
 * @param {Set<string>|string[]} countries
 * @returns {Object<string, Offer[]>}
 */
export function parse_offers_for_countries_response(json, countries) {
  const countryArray = Array.isArray(countries) ? countries : Array.from(countries);
  const offers_node = json && json.data ? json.data.node : {};
  const result = {};
  countryArray.forEach((country) => {
    const key = country.toUpperCase();
    const offersList = offers_node[key] || [];
    result[country] = offersList.map((offer) => _parse_offer(offer));
  });
  return result;
}

// -- internal helpers --
function _assert_country_code_is_valid(code) {
  if (!code || String(code).length !== 2) throw new Error(`Invalid country code: ${code}, code must be 2 characters long`);
}

function _prepare_offers_for_countries_entry(countries) {
  const offer_requests = countries.map((country_code) =>
    _GRAPHQL_COUNTRY_OFFERS_ENTRY.replace(/{country_code}/g, country_code.toUpperCase())
  );
  const main_body = _GRAPHQL_OFFERS_BY_COUNTRY_QUERY.replace('{country_entries}', offer_requests.join('\n'));
  return main_body + _GRAPHQL_OFFER_FRAGMENT;
}

function _parse_entry(json) {
  if (!json) return null;
  const entry_id = json.id;
  const object_id = json.objectId;
  const object_type = json.objectType;
  const content = json.content || {};
  const title = content.title;
  const url = content.fullPath ? _DETAILS_URL + content.fullPath : null;
  const year = content.originalReleaseYear ?? null;
  const date = content.originalReleaseDate ?? null;
  const runtime_minutes = content.runtime ?? null;
  const short_description = content.shortDescription ?? null;
  const genres = (content.genres || []).filter(Boolean).map((g) => g.shortName);
  const external_ids = content.externalIds || {};
  const imdb_id = external_ids.imdbId ?? null;
  const tmdb_id = external_ids.tmdbId ?? null;
  const poster_url_field = content.posterUrl;
  const poster = poster_url_field ? _IMAGES_URL + poster_url_field : null;
  const backdrops = (content.backdrops || []).filter(Boolean).map((bd) => (_IMAGES_URL + bd.backdropUrl));
  const age_certification = content.ageCertification ?? null;
  const scoring = _parse_scores(content.scoring);
  const interactions = _parse_interactions(content.interactions);
  const streaming_charts = _parse_streaming_charts(json);
  const offers = (json.offers || []).filter(Boolean).map((o) => _parse_offer(o));

  return {
    entry_id,
    object_id,
    object_type,
    title,
    url,
    release_year: year,
    release_date: date,
    runtime_minutes,
    short_description,
    genres,
    imdb_id,
    tmdb_id,
    poster,
    backdrops,
    age_certification,
    scoring,
    interactions,
    streaming_charts,
    offers,
  };
}

function _parse_scores(json) {
  if (!json) return null;
  const imdb_score = json.imdbScore ?? null;
  const imdb_votes = json.imdbVotes != null ? Number(json.imdbVotes) : null;
  const tmdb_popularity = json.tmdbPopularity ?? null;
  const tmdb_score = json.tmdbScore ?? null;
  const tomatometer = json.tomatoMeter != null ? Number(json.tomatoMeter) : null;
  const certified_fresh = json.certifiedFresh ?? null;
  const jw_rating = json.jwRating ?? null;
  return {
    imdb_score,
    imdb_votes,
    tmdb_popularity,
    tmdb_score,
    tomatometer,
    certified_fresh,
    jw_rating,
  };
}

function _parse_interactions(json) {
  if (!json) return null;
  const likes = json.likelistAdditions ?? null;
  const dislikes = json.dislikelistAdditions ?? null;
  return { likes, dislikes };
}

function _parse_streaming_charts(json) {
  const edges = (json && json.streamingCharts && Array.isArray(json.streamingCharts.edges)) ? json.streamingCharts.edges : null;
  if (!edges || edges.length === 0) return null;
  const info = edges[0] && edges[0].streamingChartInfo ? edges[0].streamingChartInfo : null;
  if (!info) return null;
  const rank = info.rank ?? null;
  const trend = info.trend ?? null;
  const trend_difference = info.trendDifference ?? null;
  const top_rank = info.topRank ?? null;
  const days_in_top_3 = info.daysInTop3 ?? null;
  const days_in_top_10 = info.daysInTop10 ?? null;
  const days_in_top_100 = info.daysInTop100 ?? null;
  const days_in_top_1000 = info.daysInTop1000 ?? null;
  const updated = info.updatedAt ?? null;
  return {
    rank,
    trend,
    trend_difference,
    top_rank,
    days_in_top_3,
    days_in_top_10,
    days_in_top_100,
    days_in_top_1000,
    updated,
  };
}

function _parse_offer(json) {
  if (!json) return null;
  const id = json.id;
  const monetization_type = json.monetizationType;
  const presentation_type = json.presentationType;
  const price_string = json.retailPrice ?? null;
  const price_value = json.retailPriceValue ?? null;
  const price_currency = json.currency ?? null;
  const last_change_retail_price_value = json.lastChangeRetailPriceValue ?? null;
  const type = json.type;
  const packageObj = _parse_package(json.package || {});
  const url = json.standardWebURL ?? null;
  const element_count = json.elementCount ?? null;
  const available_to = json.availableTo ?? null;
  const deeplink_roku = json.deeplinkRoku ?? null;
  const subtitle_languages = json.subtitleLanguages ?? null;
  const video_technology = json.videoTechnology ?? null;
  const audio_technology = json.audioTechnology ?? null;
  const audio_languages = json.audioLanguages ?? null;

  return {
    id,
    monetization_type,
    presentation_type,
    price_string,
    price_value,
    price_currency,
    last_change_retail_price_value,
    type,
    package: packageObj,
    url,
    element_count,
    available_to,
    deeplink_roku,
    subtitle_languages,
    video_technology,
    audio_technology,
    audio_languages,
  };
}

function _parse_package(json) {
  if (!json) return {
    id: null,
    package_id: null,
    name: null,
    technical_name: null,
    icon: null,
  };
  const id = json.id ?? null;
  const package_id = json.packageId ?? null;
  const name = json.clearName ?? null;
  const technical_name = json.technicalName ?? null;
  const icon = json.icon ? _IMAGES_URL + json.icon : null;
  return { id, package_id, name, technical_name, icon };
}

export { _DETAILS_URL, _IMAGES_URL };
