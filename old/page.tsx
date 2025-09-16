'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import axios from 'axios';
import useSWRImmutable from 'swr/immutable';
import fetcher from '@/utils/fetcher';
import { TMDbData, TMDbResults } from '@/types/tmdb';

interface Metric {
  [key: string]: any
  IMDb?: string
  RottenTomatoes?: string
  Metacritic?: string
  Letterboxd?: number
  Mubi?: number
}

export default function MovieOrTvPage() {
  const hasRun = useRef(false); // remove in prod

  const [data, setData] = useState<TMDbData | null>(null);
  const [results, setResults] = useState<TMDbResults[]>([]);
  const [posterUrl, setPosterUrl] = useState("");
  const [director, setDirector] = useState<string[]>([]);
  const [creator, setCreator] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>({});
  const [count, setCount] = useState(-1);
  const [uniscore, setUniscore] = useState(-1);

  const [tmdbId, setTmdbId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv" | null>(null);

  const router = useRouter();
  const params = useParams();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;
  const omdbApiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  useEffect(() => {
    // remove in prod
    if (hasRun.current) return;
    hasRun.current = true;

    if (!params) return;

    let slug = params["slug"];

    if (!slug) return;

    if (typeof slug === 'string') {
      slug = slug.split("-");
    }

    const id = slug.pop();
    if (!id) return;

    let type;
    if (params.mediaType === "movie" || params.mediaType === "tv") {
      type = params.mediaType
      setMediaType(params.mediaType);
    } else {
      setMediaType(null)
    }

    setTmdbId(id);

    fetchData(type, id);
  }, []);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      fetchPoster(data);
      getData();
      if ("created_by" in data) {
        fetchCreator(data);
      } else {
        fetchDirector(data);
      }
    }
  }, [data]);

  const fetchResults = async (search: string) => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${search}`);
    let filtered = data.results.filter((item: TMDbResults) => item.media_type !== "person" && item.poster_path !== null);
    setResults(filtered);
  };

  const goToDetails = (result: TMDbResults) => {
    const title = result.title || result.name;
    const slugTitle = title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const mediaType = result.media_type;
    const tmdbId = result.id
    const slug = `${slugTitle}-${tmdbId}`
    setResults([]);
    router.push(`/movies-and-tv/${mediaType}/${slug}`);
  };

  const fetchData = async (mediaType: string | undefined, tmdbId: string) => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids`);
    setData(data);
  };

  const fetchPoster = (data: TMDbData) => {
    setPosterUrl(`https://image.tmdb.org/t/p/w500/${data.poster_path}`);
  };

  const fetchDirector = (data: TMDbData) => {
    const directors = data.credits.crew
      .filter(member => member.job === "Director")
      .map(director => director.name);
    setDirector(directors);
  };

  const fetchCreator = (data: TMDbData) => {
    const creators = data?.created_by?.map(person => person.name) ?? [];
    setCreator(creators);
  };

  async function getData() {
    console.log("title", title);
    const res = await fetch(`/api/justwatch?title=${title}&country=CA`);
    const search = await res.json();
    console.log("justwatch search", search);
  }

  const title = data?.title || data?.name;
  const year = data?.release_date
    ? data?.release_date.split("-")[0]
    : data?.first_air_date
      ? data?.first_air_date.split("-")[0]
      : '';
  const imdbId = data?.external_ids?.imdb_id ?? '';

  // Fetch OMDb data
  interface OMDbData {
    Ratings: {
      Source?: string,
      Value?: String
    }[]
    Metascore: string
    imdbRating: string
    imdbVotes: string
    imdbID: string
    Response: string
  }

  const { data: omdbData, error: omdbError, isLoading: omdbIsLoading } = useSWRImmutable<OMDbData>(
    imdbId ? `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${imdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const hasOmdbData = omdbData && omdbData.Response === "True";
  const shouldRenderOmdb = omdbIsLoading || hasOmdbData;

  useEffect(() => {
    if (hasOmdbData) {
      const rt = omdbData.Ratings?.find(rating => rating.Source === "Rotten Tomatoes");
      setMetric(prev => ({
        ...prev,
        IMDb: omdbData.imdbRating.replace(".", "") ?? undefined,
        RottenTomatoes: rt && rt?.Value?.replace("%", ""),
        Metacritic: omdbData.Metascore ?? undefined
      }));
    }
  }, [omdbData, hasOmdbData]);

  // Fetch Letterboxd data
  interface LbData {
    type: string
    score: number
    film?: {
      name: string
      link: string
      rating?: number
    }
  }

  const { data: lbData, error: lbError, isLoading: lbIsLoading } = useSWRImmutable<LbData>(
    title && tmdbId ? `/api/letterboxd?title=${title}&tmdbId=${tmdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const hasRatingLb = lbData?.film?.rating != null;
  const shouldRenderLb = lbIsLoading || hasRatingLb;

  useEffect(() => {
    if (!lbData?.film?.rating) return;

    const ratingOutOf100 = lbData.film.rating * 20;
    setMetric(prev => ({
      ...prev,
      Letterboxd: ratingOutOf100
    }));
  }, [lbData]);

  // Fetch MUBI data
  interface MubiData {
    nextData?: {
      props?: {
        initialProps?: {
          pageProps?: {
            initFilm?: {
              average_rating_out_of_ten?: number
              number_of_ratings?: number
            }
          }
        }
      }
    }
    url: string
  }

  const { data: mubiData, error: mubiError, isLoading: mubiIsLoading } = useSWRImmutable<MubiData>(
    title && year && mediaType === "tv"
      ? `/api/mubi?title=${title}&director=&year=${year}`
      : title && year && director?.length > 0
        ? `/api/mubi?title=${title}&director=${director[0]}&year=${year}`
        : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const filmDataMubi = mubiData?.nextData?.props?.initialProps?.pageProps?.initFilm;
  const hasRatingMubi = filmDataMubi?.average_rating_out_of_ten != null;
  const shouldRenderMubi = mubiIsLoading || hasRatingMubi;

  useEffect(() => {
    if (!filmDataMubi?.average_rating_out_of_ten) return;

    const ratingOutOf100 = filmDataMubi.average_rating_out_of_ten * 10;
    setMetric(prev => ({
      ...prev,
      Mubi: ratingOutOf100
    }));
  }, [mubiData]);

  // Fetch Serializd data
  interface SerializdData {
    ratingData: {
      aggregateRating?: {
        ratingValue?: string
        ratingCount?: string
      }
    }
    url: string
  }

  const { data: serializdData, error: serializdError, isLoading: serializdIsLoading } = useSWRImmutable<SerializdData>(
    title && tmdbId && mediaType === "tv" ? `/api/serializd?title=${title}&tmdbId=${tmdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const filmDataSerializd = serializdData?.ratingData?.aggregateRating;
  const hasRatingSerializd = filmDataSerializd?.ratingValue != null;
  const shouldRenderSerializd = serializdIsLoading || hasRatingSerializd;

  useEffect(() => {
    if (!filmDataSerializd?.ratingValue) return;

    const ratingOutOf100 = Number(filmDataSerializd.ratingValue) * 20;
    setMetric(prev => ({
      ...prev,
      Serializd: ratingOutOf100
    }));
  }, [serializdData, hasRatingSerializd]);

  // Calculate Uniscore
  useEffect(() => {
    const done = (lbData || lbError) &&
      (year ? (mubiData || mubiError) : true) &&
      (imdbId ? (omdbData || omdbError) : true) &&
      (mediaType === "tv" ? (serializdData || serializdError) : true);

    if (!done) return;

    let counter = 0;
    let total = 0;
    console.log("metric", metric);

    Object.keys(metric).forEach(key => {
      if (metric[key] && metric[key] !== 'N/A') {
        total += Number(metric[key]);
        counter++;
      }
    });

    if (counter > 0) {
      setCount(counter);
      setUniscore(Math.round((total / counter / 20) * 10) / 10);
    } else {
      setCount(0);
      setUniscore(-1);
    }
  }, [metric, omdbData, omdbError, lbData, lbError, mubiData, mubiError, serializdData, serializdError, mediaType, imdbId]);

  const getYear = (date: string) => {
    return date?.split("-")[0] ?? '';
  };

  const firstAirDate = data?.first_air_date ? getYear(data.first_air_date) : "";
  const lastAirDate = data?.last_air_date ? getYear(data?.last_air_date) : "";
  const status = data?.status;
  const yearRange =
    firstAirDate && lastAirDate && status
      ? status === "Returning Series"
        ? `${firstAirDate}\u2013`
        : firstAirDate === lastAirDate
          ? firstAirDate
          : `${firstAirDate}\u2013${lastAirDate}`
      : '';

  return (
    <>
      <div className="logo-container">
        <Link href={"/movies-and-tv"}>Unicritic</Link>
      </div>
      <div>
        <nav>
          <ul>
            <li><Link href={"/movies-and-tv"}>Movies/TV</Link></li>
            <li><Link href={"/music"}>Music</Link></li>
            <li><Link href={"/game"}>Games</Link></li>
            <li><Link href={"/book"}>Books</Link></li>
          </ul>
        </nav>
      </div>
      <div>
        <SearchBar
          type={"movies-and-tv"}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
        {data?.title &&
          <>
            <div>
              <div>
                {posterUrl && (
                  <Image
                    src={posterUrl}
                    alt="Poster"
                    width={300}
                    height={444}
                    priority
                  />
                )}
              </div>
              <div>
                <div>
                  <h1>{data.title}{!data.release_date ? '' : ` (${data.release_date?.split("-")[0]})`}</h1>
                </div>
                <div>
                  <h3>{director.length > 0 ? `Directed by ${director.join(", ")}` : ''}</h3>
                </div>
                <div>
                  <h3>Uniscore:</h3>
                </div>
                <div>
                  <h1>
                    {count > -1
                      ? count === 0
                        ? "N/A"
                        : `${uniscore}/5`
                      : "Loading..."}
                  </h1>
                </div>
                <div>
                  <span>{count === 1 ? `Based on ${count} major review site` : count > 1 ? `Based on ${count} major review sites` : ""}</span>
                </div>
                <div></div>
              </div>
            </div>
            <div>
              <div>
                {count > 0 && 'Ratings:'}
              </div>
              {!omdbError && shouldRenderOmdb && (
                <>
                  {/* IMDb */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>IMDb: Loading...</span>
                    </div>
                  ) : omdbData?.imdbRating && omdbData.imdbRating !== "N/A" && (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>IMDb: {omdbData.imdbRating}/10 from {omdbData.imdbVotes} votes</span>
                    </div>
                  )}

                  {/* Metacritic */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Metacritic: Loading...</span>
                    </div>
                  ) : omdbData?.Metascore && omdbData.Metascore !== "N/A" && (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Metacritic: {omdbData.Metascore}/100</span>
                    </div>
                  )}

                  {/* Rotten Tomatoes */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                        alt="Rotten Tomatoes Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Rotten Tomatoes: Loading...</span>
                    </div>
                  ) : omdbData?.Ratings?.map((rating, index) => rating.Source === "Rotten Tomatoes" &&
                    <div key={index}>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                        alt="Rotten Tomatoes Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Rotten Tomatoes: {rating.Value}</span>
                    </div>
                  )}
                </>
              )}
              {!lbError && shouldRenderLb && (
                <div>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                    alt="Letterboxd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    Letterboxd:
                    {lbIsLoading ? " Loading..." :
                      hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                  </span>
                </div>
              )}
              {!mubiError && shouldRenderMubi && (
                <div>
                  <Image
                    src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/videos/mubi-bu9bsufjk96nkmbnvhtat.png/mubi-c4bymuk2b2nbaykhwmx68u.png?_a=DATAg1AAZAA0"
                    alt="Mubi Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    Mubi:
                    {mubiIsLoading
                      ? " Loading..."
                      : hasRatingMubi
                        ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}/10 based on ${filmDataMubi?.number_of_ratings} ratings`
                        : null}
                  </span>
                </div>
              )}
            </div>
            <nav>
              <ul>
                <li>Graph</li>
                <li>Stats</li>
              </ul>
            </nav>
          </>
        }
        {data?.name &&
          <>
            <div>
              <div>
                {posterUrl && (
                  <Image
                    src={posterUrl}
                    alt="Poster"
                    width={300}
                    height={444}
                    priority
                  />
                )}
              </div>
              <div>
                <div>
                  <h1>
                    {data.name}{yearRange !== '' ? ` (${yearRange})` : ''}
                  </h1>
                </div>
                <div>
                  <h3>{creator.length > 0 ? `Created by ${creator.join(", ")}` : ''}</h3>
                </div>
                <div>
                  <h3>Uniscore:</h3>
                </div>
                <div>
                  <h1>
                    {count > -1
                      ? count === 0
                        ? "N/A"
                        : `${uniscore}/5`
                      : "Loading..."}
                  </h1>
                </div>
                <div>
                  <span>{count === 1 ? `Based on ${count} major review site` : count > 1 ? `Based on ${count} major review sites` : ""}</span>
                </div>
                <div></div>
              </div>
            </div>
            <div>
              <div>
                {count > 0 && 'Ratings:'}
              </div>
              {!omdbError && shouldRenderOmdb && (
                <>
                  {/* IMDb */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>IMDb: Loading...</span>
                    </div>
                  ) : omdbData?.imdbRating && omdbData.imdbRating !== "N/A" && (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>IMDb: {omdbData.imdbRating}/10 from {omdbData.imdbVotes} votes</span>
                    </div>
                  )}

                  {/* Metacritic */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Metacritic: Loading...</span>
                    </div>
                  ) : omdbData?.Metascore && omdbData.Metascore !== "N/A" && (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                        alt="IMDb Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Metacritic: {omdbData.Metascore}/100</span>
                    </div>
                  )}

                  {/* Rotten Tomatoes */}
                  {omdbIsLoading ? (
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                        alt="Rotten Tomatoes Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Rotten Tomatoes: Loading...</span>
                    </div>
                  ) : omdbData?.Ratings?.map((rating, index) => rating.Source === "Rotten Tomatoes" &&
                    <div key={index}>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                        alt="Rotten Tomatoes Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Rotten Tomatoes: {rating.Value}</span>
                    </div>
                  )}
                </>
              )}
              {!lbError && shouldRenderLb && (
                <div>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                    alt="Letterboxd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    Letterboxd:
                    {lbIsLoading ? " Loading..." :
                      hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                  </span>
                </div>
              )}
              {!mubiError && shouldRenderMubi && (
                <div>
                  <Image
                    src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/videos/mubi-bu9bsufjk96nkmbnvhtat.png/mubi-c4bymuk2b2nbaykhwmx68u.png?_a=DATAg1AAZAA0"
                    alt="Mubi Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    Mubi:
                    {mubiIsLoading
                      ? " Loading..."
                      : hasRatingMubi
                        ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}/10 based on ${filmDataMubi?.number_of_ratings} ratings`
                        : null}
                  </span>
                </div>
              )}
              {!serializdError && shouldRenderSerializd && (
                <div>
                  <Image
                    src="https://media.imgcdn.org/repo/2024/02/serializd/65cb301c74859-serializd-Icon.webp"
                    alt="Serializd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    Serializd:
                    {serializdIsLoading
                      ? " Loading..."
                      : hasRatingSerializd
                        ? ` ${filmDataSerializd.ratingValue} based on ${filmDataSerializd?.ratingCount} ratings`
                        : null}
                  </span>
                </div>
              )}
            </div>
            <nav>
              <ul>
                <li>Graph</li>
                <li>Stats</li>
              </ul>
            </nav>
          </>
        }
      </div>
    </>
  );
}