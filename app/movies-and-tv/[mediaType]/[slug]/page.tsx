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
  const [services, setServices] = useState({});
  const [trailerUrl, setTrailerUrl] = useState("");

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
      fetchTrailer();
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
    setResults(filtered.slice(0, 10));
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

  const fetchTrailer = async () => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${tmdbApiKey}`);

    if (data?.results?.length > 0) {
      const trailer = data.results.find(video => video.type === "Trailer");
      setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
    }
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

  const title = data?.title || data?.name;
  const year = data?.release_date
    ? data?.release_date.split("-")[0]
    : data?.first_air_date
      ? data?.first_air_date.split("-")[0]
      : '';
  const imdbId = data?.external_ids?.imdb_id ?? '';

  // Fetch JustWatch data (streaming availability)
  const { data: jwData, error: jwError, isLoading: jwIsLoading } = useSWRImmutable(
    title && tmdbId && `/api/justwatch?title=${title}&tmdbId=${tmdbId}&country=CA`
    , fetcher, { shouldRetryOnError: false });
  const hasJwData = jwData && jwData.offers.length > 0;
  const shouldRenderJw = jwIsLoading || hasJwData;

  useEffect(() => {
    if (hasJwData) {
      const offers = jwData.offers;
      const stream = [];
      const rent = [];
      const buy = [];
      offers.forEach((offer) => {
        if (offer.monetization_type === "FLATRATE" || offer.monetization_type === "ADS") stream.push(offer);
        if (offer.monetization_type === "RENT") rent.push(offer);
        if (offer.monetization_type === "BUY") buy.push(offer);
      });
      stream.sort((a, b) => a.package.name.localeCompare(b.package.name));
      rent.sort((a, b) => a.package.name.localeCompare(b.package.name));
      buy.sort((a, b) => a.package.name.localeCompare(b.package.name));
      setServices({ stream, rent, buy });
    }
  }, [jwData, hasJwData]);

  useEffect(() => {
    console.log("justwatch data", services);
  }, [services]);

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
      setUniscore(Math.round(total / counter));
    } else {
      setCount(0);
      setUniscore(-1);
    }
  }, [metric, omdbData, omdbError, lbData, lbError, mubiData, mubiError, serializdData, serializdError, mediaType, imdbId]);

  const formatPrice = (priceValue, currencyCode) => {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0
    }).format(priceValue);
  };

  const getYear = (date: string) => {
    return date?.split("-")[0] ?? '';
  };

  const firstAirDate = data?.first_air_date ? getYear(data.first_air_date) : "";
  const lastAirDate = data?.last_air_date ? getYear(data?.last_air_date) : "";
  const status = data?.status;
  const yearRange =
    firstAirDate && lastAirDate && status
      ? status === "Returning Series"
        ? firstAirDate
        : firstAirDate === lastAirDate
          ? firstAirDate
          : `${firstAirDate}\u2013${lastAirDate}`
      : '';

  return (
    <>
      <div className="flex items-center">
        <Link href={"/movies-and-tv"}>
          <div className="flex items-center gap-x-3">
            <Image
              src="/icons/unicritic-logo.svg"
              alt="Unicritic Logo"
              width={39}
              height={44}
              priority
            />
            <h1>Unicritic</h1>
          </div>
        </Link>
        <SearchBar
          type={"movies-and-tv"}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
        <nav>
          <ul className='flex gap-x-6'>
            <li><Link href={"/movies-and-tv"}>Movies & TV</Link></li>
            <li><Link href={"/music"}>Music</Link></li>
            <li><Link href={"/game"}>Games</Link></li>
            <li><Link href={"/book"}>Books</Link></li>
          </ul>
        </nav>
      </div>

      {data?.title && (
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
            <div>
              {data.genres.length > 0 && data.genres.map((genre, id) => {
                return (
                  <p key={id}>{genre.name}</p>
                )
              })}
            </div>
            {trailerUrl && (
              <a href={trailerUrl}>
                <Image
                  src="/icons/play-button-icon.svg"
                  width={24}
                  height={24}
                  alt="Play Button Icon"
                />
                <h2>Play Trailer</h2>
                <Image
                  src="/icons/right-arrow.svg"
                  width={13}
                  height={7}
                  alt="Right Arrow"
                />
              </a>
            )}
          </div>
          <div>
            <h1>{data.title}</h1>
            <h1>
              {count > -1
                ? count === 0
                  ? "N/A"
                  : `${uniscore}`
                : <Image
                  src="/icons/loading-spinner.gif"
                  width={50}
                  height={50}
                  alt="Loading Spinner"
                  unoptimized
                />}
            </h1>
          </div>
          <p>
            {`${!data.release_date ? "" : ` ${data.release_date?.split("-")[0]}`} ${data.genres.length > 0 ? `• ${data.genres[0].name}` : ""} ${data?.runtime > 0 ? `• ${data?.runtime} min` : ""}`}
          </p>
          <p>
            {director.length > 0 ? `Directed by ${director.join(", ")}` : ''}
          </p>
          <p>
            {data.overview ? data.overview : ""}
          </p>
          <div>
            <div>
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
                      <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                      <span>{omdbData.imdbRating}</span>
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
                      <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                      <span>{omdbData.Metascore}</span>
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
                      <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                      <span>{rating.Value}</span>
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
                    {lbIsLoading ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized /> :
                      hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                  </span>
                </div>
              )}
              {!mubiError && shouldRenderMubi && (
                <div>
                  <Image
                    src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                    alt="Mubi Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>
                    {mubiIsLoading
                      ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                      : hasRatingMubi
                        ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}`
                        : null}
                  </span>
                </div>
              )}
              {/* <Image />
              <h1></h1> */}
            </div>
          </div>
          {jwIsLoading ? (
            <Image
              src="/icons/loading-spinner.gif" width={50}
              height={50}
              alt="Loading Spinner"
              unoptimized
            />
          ) : (
            <div>
              <div>
                <h2>Where to Watch (CA)</h2>
                <div>
                  {/* <Image /> */}
                  <div></div> {/* flag */}
                  <p>US</p>
                  {/* <Image /> */}
                  <div></div> {/* dropdown icon */}
                </div>
              </div>
              <div>
                {/* Stream */}
                {services?.stream?.length > 0 && (
                  <div>
                    <p>Stream</p>
                    {services.stream.map((service, i) => (
                      <a href={service?.url} key={i} target='_blank'>
                        <Image
                          src={service.package.icon}
                          width={70}
                          height={70}
                          alt={`${service.package.name} Logo`}
                        />
                        <p>
                          {`${service.presentation_type === "_4K"
                            ? "4K"
                            : service.presentation_type === "HD"
                              ? "HD"
                              : "SD"
                            } • ${service.monetization_type === "FLATRATE" ? "Subs" : "Ads"
                            }`}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
                {/* Rent */}
                {services?.rent?.length > 0 && (
                  <div>
                    <p>Rent</p>
                    {services.rent.map((service, i) => (
                      <a href={service.url} key={i} target='_blank'>
                        <Image
                          src={service.package.icon}
                          width={70}
                          height={70}
                          alt={`${service.package.name} Logo`}
                        />
                        <p>
                          {`${service.presentation_type === "_4K"
                            ? "4K"
                            : service.presentation_type === "HD"
                              ? "HD"
                              : "SD"
                            } • ${formatPrice(service.price_value, service.price_currency)}`}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
                {/* Buy */}
                {services?.buy?.length > 0 && (
                  <div>
                    <p>Buy</p>
                    {services.buy.map((service, i) => (
                      <div key={i}>
                        <Image
                          src={service.package.icon}
                          width={70}
                          height={70}
                          alt={`${service.package.name} Logo`}
                        />
                        <p>
                          {`${service.presentation_type === "_4K"
                            ? "4K"
                            : service.presentation_type === "HD"
                              ? "HD"
                              : "SD"
                            } • ${formatPrice(service.price_value, service.price_currency)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {data?.name && (
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
            <div>
              {data.genres.length > 0 && data.genres.map((genre, id) => {
                return (
                  <p key={id}>{genre.name}</p>
                )
              })
              }
            </div>
            {trailerUrl && (
              <a href={trailerUrl}>
                <Image
                  src="/icons/play-button-icon.svg"
                  width={24}
                  height={24}
                  alt="Play Button Icon"
                />
                <h2>Play Trailer</h2>
                <Image
                  src="/icons/right-arrow.svg"
                  width={13}
                  height={7}
                  alt="Right Arrow"
                />
              </a>
            )}
          </div>
          <div>
            <div>
              <h1>
                {data.name}
              </h1>
              <h1>
                {count > -1
                  ? count === 0
                    ? "N/A"
                    : `${uniscore}`
                  : <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />}
              </h1>
            </div>
            <p>
              {`
                ${yearRange !== '' ? ` ${yearRange}` : ''}
                ${data.genres.length > 0 ? ` • ${data.genres[0].name}` : ''}
                ${data?.number_of_seasons > 0
                  ? ` • ${data.number_of_seasons} season${data.number_of_seasons > 1 ? 's' : ''}`
                  : ''
                }
              `}
            </p>
            <p>
              {creator.length > 0 ? `Created by ${creator.join(", ")}` : ''}
            </p>
            <p>
              {data.overview ? data.overview : ""}
            </p>
            <div>
              <div>
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
                        <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                        <span>{omdbData.imdbRating}</span>
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
                        <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                        <span>{omdbData.Metascore}</span>
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
                        <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
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
                        <span>{rating.Value}</span>
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
                      {lbIsLoading ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized /> :
                        hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                    </span>
                  </div>
                )}
                {!mubiError && shouldRenderMubi && (
                  <div>
                    <Image
                      src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                      alt="Mubi Logo"
                      width={100}
                      height={100}
                      priority
                    />
                    <span>
                      {mubiIsLoading
                        ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        : hasRatingMubi
                          ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}`
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
                      {serializdIsLoading
                        ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        : hasRatingSerializd
                          ? ` ${filmDataSerializd.ratingValue}`
                          : null}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2>Where to Watch (US)</h2>
              <div>
                {/* <Image /> */}
                <div></div> {/* flag */}
                <p>US</p>
                {/* <Image /> */}
                <div></div> {/* dropdown icon */}
              </div>
            </div>
            <div>
              {/* Stream */}
              {services?.stream?.length > 0 && (
                <div>
                  <p>Stream</p>
                  {services.stream.map((service, i) => (
                    <a href={service?.url} key={i} target='_blank'>
                      <Image
                        src={service.package.icon}
                        width={70}
                        height={70}
                        alt={`${service.package.name} Logo`}
                      />
                      <p>
                        {`${service.presentation_type === "_4K"
                          ? "4K"
                          : service.presentation_type === "HD"
                            ? "HD"
                            : "SD"
                          } • ${service.monetization_type === "FLATRATE" ? "Subs" : "Ads"
                          }`}
                      </p>
                    </a>
                  ))}
                </div>
              )}
              {/* Rent */}
              {services?.rent?.length > 0 && (
                <div>
                  <p>Rent</p>
                  {services.rent.map((service, i) => (
                    <a href={service.url} key={i} target='_blank'>
                      <Image
                        src={service.package.icon}
                        width={70}
                        height={70}
                        alt={`${service.package.name} Logo`}
                      />
                      <p>
                        {`${service.presentation_type === "_4K"
                          ? "4K"
                          : service.presentation_type === "HD"
                            ? "HD"
                            : "SD"
                          } • ${formatPrice(service.price_value, service.price_currency)}`}
                      </p>
                    </a>
                  ))}
                </div>
              )}
              {/* Buy */}
              {services?.buy?.length > 0 && (
                <div>
                  <p>Buy</p>
                  {services.buy.map((service, i) => (
                    <div key={i}>
                      <Image
                        src={service.package.icon}
                        width={70}
                        height={70}
                        alt={`${service.package.name} Logo`}
                      />
                      <p>
                        {`${service.presentation_type === "_4K"
                          ? "4K"
                          : service.presentation_type === "HD"
                            ? "HD"
                            : "SD"
                          } • ${formatPrice(service.price_value, service.price_currency)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}