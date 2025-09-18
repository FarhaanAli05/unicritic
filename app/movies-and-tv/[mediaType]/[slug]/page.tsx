'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import useSWRImmutable from 'swr/immutable';
import fetcher from '@/utils/fetcher';
import { TMDbData, TMDbResults } from '@/types/tmdb';
import { COUNTRIES } from '@/components/country-picker/countries';
import CountrySelector from '@/components/country-picker/selector';
import { useCountry } from '@/components/CountryProvider';
import Navbar from '@/components/Navbar';
import Container from '@/components/Container';
import { SelectMenuOption } from '@/components/country-picker/types';

interface Metric {
  [key: string]: number | string | undefined | null;
  IMDb?: string
  RottenTomatoes?: string
  Metacritic?: string
  Letterboxd?: number
  Mubi?: number
}

export default function MovieOrTvPage() {
  const [data, setData] = useState<TMDbData | null>(null);
  const [results, setResults] = useState<TMDbResults[]>([]);
  const [posterUrl, setPosterUrl] = useState("");
  const [director, setDirector] = useState<string[]>([]);
  const [creator, setCreator] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>({});
  const [count, setCount] = useState(-1);
  const [uniscore, setUniscore] = useState(-1);
  const [services, setServices] = useState<ServicesState>({
    stream: [],
    rent: [],
    buy: [],
  });
  const [trailerUrl, setTrailerUrl] = useState("");

  const [tmdbId, setTmdbId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv" | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const { country, setCountry } = useCountry();

  const router = useRouter();
  const params = useParams();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;
  const omdbApiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  useEffect(() => {
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
    const filtered = data.results.filter((item: TMDbResults) => item.media_type !== "person" && item.poster_path !== null);
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

  interface tmdbVideo {
    type?: string
  }

  const fetchTrailer = async () => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}/videos?api_key=${tmdbApiKey}`);

    if (data?.results?.length > 0) {
      const trailers = data.results.filter((video: tmdbVideo) => video.type === "Trailer");
      const trailer = trailers.pop();
      if (trailer?.key) {
        setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
      }
    }
  };

  const fetchDirector = (data: TMDbData) => {
    const crew = data.credits?.crew || [];
    const directors = crew
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

  interface JwPackage {
    name: string;
    icon: string;
  }

  interface JwOffer {
    monetization_type?: string;
    presentation_type?: string;
    package: JwPackage;
    url?: string;
    price_value?: number;
    price_currency?: string;
  }

  interface JwData {
    title?: string;
    tmdb_id?: string | number;
    offers?: JwOffer[];
  }

  type ServicesState = {
    stream: JwOffer[];
    rent: JwOffer[];
    buy: JwOffer[];
  };

  // Fetch JustWatch data (streaming availability)
  const { data: jwData, error: jwError, isLoading: jwIsLoading } = useSWRImmutable<JwData>(
    title && tmdbId && country && `/api/justwatch?title=${title}&tmdbId=${tmdbId}&country=${country}`
    , fetcher, { shouldRetryOnError: false });
  const hasJwData = jwData && Array.isArray(jwData.offers) && jwData.offers.length > 0;

  useEffect(() => {
    if (hasJwData) {
      const offers: JwOffer[] = jwData.offers || [];
      const stream: JwOffer[] = [];
      const rent: JwOffer[] = [];
      const buy: JwOffer[] = [];
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

  // Fetch OMDb data
  interface OMDbData {
    Ratings: {
      Source?: string
      Value?: string
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
            series?: {
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
  const filmDataMubi = mubiData?.nextData?.props?.initialProps?.pageProps?.initFilm || mubiData?.nextData?.props?.initialProps?.pageProps?.series;
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

  const formatPrice = (priceValue?: number | null, currencyCode?: string | null): string => {
    if (priceValue == null || !currencyCode) return "";

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

  const selectedCountry = COUNTRIES.find(option => option.value === country);

  return (
    <div className='py-10'>
      <Container>
        <Navbar
          page={"movies-and-tv"}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
        {data?.title && (
          <div className='flex gap-x-10 mt-10 flex-col lg:flex-row'>
            <div className='flex-1'>
              {posterUrl && (
                <Image
                  src={posterUrl}
                  className='rounded-[10px] border-[0.5px] border-[#606060] border-solid mx-auto'
                  alt="Poster"
                  width={343}
                  height={519}
                  priority
                />
              )}
              <div className='flex flex-wrap gap-x-3 mt-5 mb-3 justify-center lg:justify-start'>
                {(data.genres ?? []).map((genre, id) => {
                  return (
                    <p key={id} className='!text-white rounded-[10px] border-[0.5px] border-[#606060] border-solid w-fit py-2 px-4 bg-[#18191D] mb-3'>{genre.name}</p>
                  )
                })}
              </div>
              {trailerUrl && (
                <a href={trailerUrl} target="_blank" className='flex gap-x-3 bg-[#AA1B63] w-fit mx-auto px-4 py-2 rounded-full mb-5 lg:mb-0'>
                  <Image
                    src="/icons/play-button-icon.svg"
                    width={24}
                    height={24}
                    alt="Play Button Icon"
                  />
                  <h2>Play Trailer</h2>
                  <Image
                    src="/icons/arrow-right.svg"
                    width={13}
                    height={7}
                    alt="Right Arrow"
                  />
                </a>
              )}
            </div>
            <div className='flex-2 [&>p]:my-5'>
              <div className='flex justify-between'>
                <h1>{data.title}</h1>
                <div className="flex items-center justify-center mt-10 ml-13 h-0">
                  <Image
                    src="/icons/hexagon.svg"
                    alt=""
                    width={95}
                    height={91}
                    aria-hidden
                    draggable={false}
                    className={`absolute ${count > -1 ? (count === 0 ? "hidden" : "inline-block") : "inline-block"
                      } mt-10`}
                  />
                  <h1 className="relative z-10 text-white mt-10">
                    {count > -1 ? (
                      count === 0 ? "" : uniscore
                    ) : (
                      <Image
                        src="/icons/loading-spinner.gif"
                        width={50}
                        height={50}
                        alt="Loading Spinner"
                        unoptimized
                      />
                    )}
                  </h1>
                </div>
              </div>
              <p className='!mt-4'>
                {`${!data.release_date ? "" : ` ${data.release_date?.split("-")[0]}`} ${data.genres?.length ? `• ${data.genres[0].name}` : ""} ${data?.runtime ? `• ${data.runtime} min` : ""}`}
              </p>
              <p>
                {director.length > 0 ? (
                  <>
                    Directed by <strong>{director.join(", ")}</strong>
                  </>
                ) : (
                  ""
                )}
              </p>
              <p>
                {data.tagline ? data.tagline : ""}
              </p>
              <div>
                <div className='[&_div]:rounded-[10px] [&_div]:border-[0.5px] [&_div]:border-[#606060] [&_div]:border-solid [&_div]:bg-[#18191D] [&_div]:w-fit [&_div]:py-4 [&_div]:px-5 [&_div]:justify-center [&_div]:flex [&_div]:flex-col [&_div]:items-center [&_div]:gap-y-1 flex gap-x-4 my-7 flex flex-wrap gap-y-4'>
                  {!omdbError && shouldRenderOmdb && (
                    <>
                      {/* IMDb */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                            alt="IMDb Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.imdbRating && omdbData.imdbRating !== "N/A" && imdbId && (
                        <a
                          href={`https://www.imdb.com/title/${imdbId}/`}
                          target='_blank'
                          rel="noopener noreferrer"
                        >
                          <div>
                            <Image
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                              alt="IMDb Logo"
                              width={70}
                              height={70}
                              priority
                            />
                            <h1>{omdbData.imdbRating}</h1>
                          </div>
                        </a>
                      )}

                      {/* Metacritic */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                            alt="Metacritic Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.Metascore && omdbData.Metascore !== "N/A" && (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                            alt="Metacritic Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <h1>{omdbData.Metascore}</h1>
                        </div>
                      )}

                      {/* Rotten Tomatoes */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                            alt="Rotten Tomatoes Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.Ratings?.map((rating, index) => rating.Source === "Rotten Tomatoes" &&
                        <div key={index}>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                            alt="Rotten Tomatoes Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <h1>{rating.Value}</h1>
                        </div>
                      )}
                    </>
                  )}
                  {!lbError && shouldRenderLb && (
                    <a
                      href={lbData?.film?.link ?? "#"}
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      <div>
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                          alt="Letterboxd Logo"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1>
                          {lbIsLoading ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized /> :
                            hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                        </h1>
                      </div>
                    </a>
                  )}
                  {!mubiError && shouldRenderMubi && (
                    <a
                      href={mubiData?.url ?? '#'}
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      <div>
                        <Image
                          src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                          className='rounded-[10px]'
                          alt="Mubi Logo"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1>
                          {mubiIsLoading
                            ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                            : hasRatingMubi
                              ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}`
                              : null}
                        </h1>
                      </div>
                    </a>
                  )}
                </div>
              </div>
              {jwIsLoading ? (
                <Image
                  src="/icons/loading-spinner.gif"
                  className='mt-7'
                  width={50}
                  height={50}
                  alt="Loading Spinner"
                  unoptimized
                />
              ) : (
                <div>
                  <div className="flex items-center gap-x-4 my-5">
                    <h2>Where to Watch</h2>
                    <CountrySelector
                      id={'countries'}
                      open={isOpen}
                      onToggle={() => setIsOpen(!isOpen)}
                      onChange={val => setCountry(val)}
                      selectedValue={selectedCountry as SelectMenuOption}
                    />
                  </div>

                  {jwError || !services || (
                    (!services.stream?.length &&
                      !services.rent?.length &&
                      !services.buy?.length)
                  ) || !hasJwData ? (
                    <p className="my-4">
                      No offers available for {selectedCountry?.title ?? "your country"}.
                    </p>
                  ) : (
                    <div className="space-y-7">
                      {/* Stream */}
                      {services?.stream?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Stream</p>
                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.stream.map((service, i) => (
                              <a
                                href={service?.url}
                                key={`stream-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"} • ${service.monetization_type === "FLATRATE" ? "Subs" : "Ads"}`}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rent */}
                      {services?.rent?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Rent</p>

                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.rent.map((service, i) => (
                              <a
                                href={service.url}
                                key={`rent-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="text-sm mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"}${formatPrice(service.price_value, service.price_currency) ? ` • ${formatPrice(service.price_value, service.price_currency)}` : ""}`}

                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Buy */}
                      {services?.buy?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Buy</p>

                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.buy.map((service, i) => (
                              <a
                                href={service.url}
                                key={`buy-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"} • ${formatPrice(service.price_value, service.price_currency)}`}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {data?.name && (
          <div className='flex gap-x-10 mt-10 flex-col lg:flex-row'>
            <div className='flex-1'>
              {posterUrl && (
                <Image
                  src={posterUrl}
                  className='rounded-[10px] border-[0.5px] border-[#606060] border-solid mx-auto'
                  alt="Poster"
                  width={300}
                  height={444}
                  priority
                />
              )}
              <div className='flex flex-wrap gap-x-3 mt-5 mb-3 justify-center lg:justify-start'>
                {(data.genres ?? []).map((genre, id) => {
                  return (
                    <p key={id} className='!text-white rounded-[10px] border-[0.5px] border-[#606060] border-solid w-fit py-2 px-4 bg-[#18191D] mb-3'>{genre.name}</p>
                  )
                })
                }
              </div>
              {trailerUrl && (
                <a href={trailerUrl} target="_blank" className='flex gap-x-3 bg-[#AA1B63] w-fit mx-auto px-4 py-2 rounded-full mb-5 lg:mb-0'>
                  <Image
                    src="/icons/play-button-icon.svg"
                    width={24}
                    height={24}
                    alt="Play Button Icon"
                  />
                  <h2>Play Trailer</h2>
                  <Image
                    src="/icons/arrow-right.svg"
                    width={13}
                    height={7}
                    alt="Right Arrow"
                  />
                </a>
              )}
            </div>
            <div className='flex-2 [&>p]:my-5'>
              <div className='flex justify-between'>
                <h1>{data.name}</h1>
                <div className="flex items-center justify-center mt-10 ml-13 h-0">
                  <Image
                    src="/icons/hexagon.svg"
                    alt=""
                    width={95}
                    height={91}
                    aria-hidden
                    draggable={false}
                    className={`absolute ${count > -1 ? (count === 0 ? "hidden" : "inline-block") : "inline-block"
                      } mt-10`}
                  />
                  <h1 className="relative z-10 text-white mt-10">
                    {count > -1 ? (
                      count === 0 ? "" : uniscore
                    ) : (
                      <Image
                        src="/icons/loading-spinner.gif"
                        width={50}
                        height={50}
                        alt="Loading Spinner"
                        unoptimized
                      />
                    )}
                  </h1>
                </div>
              </div>
              <p className='!mt-4'>
                {`
                ${yearRange !== '' ? ` ${yearRange}` : ''}
                ${data?.genres?.length ? ` • ${data.genres[0].name}` : ''}
                ${data?.number_of_seasons
                    ? ` • ${data.number_of_seasons} season${data.number_of_seasons > 1 ? 's' : ''}`
                    : ''
                  }
              `}
              </p>
              <p>
                {creator.length > 0 ? (
                  <>
                    Created by <strong>{creator.join(", ")}</strong>
                  </>
                ) : (
                  ""
                )}
              </p>
              <p>
                {data.tagline ? data.tagline : ""}
              </p>
              <div>
                <div className='[&_div]:rounded-[10px] [&_div]:border-[0.5px] [&_div]:border-[#606060] [&_div]:border-solid [&_div]:bg-[#18191D] [&_div]:w-fit [&_div]:py-4 [&_div]:px-5 [&_div]:justify-center [&_div]:flex [&_div]:flex-col [&_div]:items-center [&_div]:gap-y-1 flex gap-x-4 my-7 flex flex-wrap gap-y-4'>
                  {!omdbError && shouldRenderOmdb && (
                    <>
                      {/* IMDb */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                            alt="IMDb Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.imdbRating && omdbData.imdbRating !== "N/A" && imdbId && (
                        <a
                          href={`https://www.imdb.com/title/${imdbId}/`}
                          target='_blank'
                          rel="noopener noreferrer"
                        >
                          <div>
                            <Image
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                              alt="IMDb Logo"
                              width={70}
                              height={70}
                              priority
                            />
                            <h1>{omdbData.imdbRating}</h1>
                          </div>
                        </a>
                      )}

                      {/* Metacritic */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                            alt="Metacritic Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.Metascore && omdbData.Metascore !== "N/A" && (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                            alt="Metacritic Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <h1>{omdbData.Metascore}</h1>
                        </div>
                      )}

                      {/* Rotten Tomatoes */}
                      {omdbIsLoading ? (
                        <div>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                            alt="Rotten Tomatoes Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                        </div>
                      ) : omdbData?.Ratings?.map((rating, index) => rating.Source === "Rotten Tomatoes" &&
                        <div key={index}>
                          <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                            alt="Rotten Tomatoes Logo"
                            width={70}
                            height={70}
                            priority
                          />
                          <h1>{rating.Value}</h1>
                        </div>
                      )}
                    </>
                  )}
                  {!lbError && shouldRenderLb && (
                    <a
                      href={lbData?.film?.link ?? "#"}
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      <div>
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                          alt="Letterboxd Logo"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1>
                          {lbIsLoading ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized /> :
                            hasRatingLb && lbData?.film?.rating ? ` ${lbData.film.rating.toFixed(1)}` : null}
                        </h1>
                      </div>
                    </a>
                  )}
                  {!mubiError && shouldRenderMubi && (
                    <a
                      href={mubiData?.url ?? '#'}
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      <div>
                        <Image
                          src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                          className='rounded-[10px]'
                          alt="Mubi Logo"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1>
                          {mubiIsLoading
                            ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                            : hasRatingMubi
                              ? ` ${filmDataMubi.average_rating_out_of_ten?.toFixed(1)}`
                              : null}
                        </h1>
                      </div>
                    </a>
                  )}
                  {!serializdError && shouldRenderSerializd && (
                    <a
                      href={serializdData?.url ?? '#'}
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      <div>
                        <Image
                          src="https://media.imgcdn.org/repo/2024/02/serializd/65cb301c74859-serializd-Icon.webp"
                          alt="Serializd Logo"
                          width={70}
                          height={70}
                          priority
                        />
                        <h1>
                          {serializdIsLoading
                            ? <Image src="/icons/loading-spinner.gif" width={50} height={50} alt="Loading Spinner" unoptimized />
                            : hasRatingSerializd
                              ? ` ${filmDataSerializd.ratingValue}`
                              : null}
                        </h1>
                      </div>
                    </a>
                  )}
                </div>
              </div>
              {jwIsLoading ? (
                <Image
                  src="/icons/loading-spinner.gif"
                  className='mt-7'
                  width={50}
                  height={50}
                  alt="Loading Spinner"
                  unoptimized
                />
              ) : (
                <div>
                  <div className="flex items-center gap-x-4 my-5">
                    <h2>Where to Watch</h2>
                    <CountrySelector
                      id={'countries'}
                      open={isOpen}
                      onToggle={() => setIsOpen(!isOpen)}
                      onChange={val => setCountry(val)}
                      selectedValue={selectedCountry as SelectMenuOption}
                    />
                  </div>

                  {jwError || !services || (
                    (!services.stream?.length &&
                      !services.rent?.length &&
                      !services.buy?.length)
                  ) || !hasJwData ? (
                    <p className="my-4">
                      No offers available for {selectedCountry?.title ?? "your country"}.
                    </p>
                  ) : (
                    <div className="space-y-7">
                      {/* Stream */}
                      {services?.stream?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Stream</p>
                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.stream.map((service, i) => (
                              <a
                                href={service?.url}
                                key={`stream-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"} • ${service.monetization_type === "FLATRATE" ? "Subs" : "Ads"}`}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rent */}
                      {services?.rent?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Rent</p>

                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.rent.map((service, i) => (
                              <a
                                href={service.url}
                                key={`rent-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="text-sm mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"} • ${formatPrice(service.price_value, service.price_currency)}`}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Buy */}
                      {services?.buy?.length > 0 && (
                        <div className="flex items-start">
                          <p className="py-6 w-20 shrink-0">Buy</p>

                          <div className="flex flex-wrap gap-x-7 gap-y-4">
                            {services.buy.map((service, i) => (
                              <a
                                href={service.url}
                                key={`buy-${i}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center w-[70px] text-center"
                              >
                                <Image
                                  src={service.package.icon}
                                  className="rounded-[10px]"
                                  width={70}
                                  height={70}
                                  alt={`${service.package.name} Logo`}
                                />
                                <span className="mt-2">
                                  {`${service.presentation_type === "_4K" ? "4K" : service.presentation_type === "HD" ? "HD" : "SD"} • ${formatPrice(service.price_value, service.price_currency)}`}
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}