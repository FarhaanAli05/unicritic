'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import axios from 'axios';
import useSWRImmutable from 'swr/immutable';
import fetcher from '@/utils/fetcher';

export default function MovieOrTvPage() {
  const hasRun = useRef(false); // remove in prod

  const [data, setData] = useState({});
  const [results, setResults] = useState([]);
  const [posterUrl, setPosterUrl] = useState("");
  const [director, setDirector] = useState([]);
  const [creator, setCreator] = useState([]);
  // const [omdbData, setOmdbData] = useState({});
  // const [mubiParams, setMubiParams] = useState({});
  // const [mubiData, setMubiData] = useState({});
  // const [serialzdData, setSerializdData] = useState({});
  const [metric, setMetric] = useState({});
  const [count, setCount] = useState(0);
  const [uniscore, setUniscore] = useState(-1);

  const [tmdbId, setTmdbId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;
  const omdbApiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  useEffect(() => {
    // remove in prod
    if (hasRun.current) return;
    hasRun.current = true;

    const slug = params["slug"].split("-");
    const id = slug.pop();
    const type = params["mediaType"];

    setTmdbId(id);
    setMediaType(type);

    fetchData(type, id);
  }, []);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      fetchPoster(data);
      if ("created_by" in data) {
        fetchCreator(data);
      } else {
        fetchDirector(data);
      }
    }
  }, [data]);

  // useEffect(() => {
  //   setMubiParams(prev => ({
  //     ...prev,
  //     director: director[0]
  //   }));
  // }, [director]);

  // useEffect(() => {
  //   if (mubiParams.title !== "" && mubiParams.year !== "" && mubiParams.director?.length > 0) {
  //     fetchMubiData(mubiParams.title, mubiParams.director, mubiParams.year);
  //   }
  // }, [mubiParams]);

  useEffect(() => {
    let counter = 0;
    let total = 0;
    console.log("metric", metric);
    Object.keys(metric).forEach(key => {
      if (metric[key] && metric[key] !== 'N/A') {
        total += Number(metric[key]);
        counter++;
      }
    });
    setCount(counter);
    setUniscore(Math.round((total / counter / 20) * 10) / 10);
  }, [metric]);

  const fetchResults = async (search: string) => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${search}`);
    let filtered = data.results.filter(item => item.media_type !== "person" && item.poster_path !== null);
    setResults(filtered.slice(0, 10));
  };

  const goToDetails = (result) => {
    const title = result.title || result.name;
    const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const mediaType = result.media_type;
    const tmdbId = result.id
    const slug = `${slugTitle}-${tmdbId}`
    setResults({});
    router.push(`/movies-and-tv/${mediaType}/${slug}`);
  };

  const fetchData = async (mediaType: string, tmdbId: string) => {
    const { data } = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids`);
    // const title = data.title || data.name;
    // const imdbId = data.external_ids.imdb_id;
    setData(data);
    // if (mediaType === 'tv') {
    // fetchMubiData(title, '', year);
    //   fetchSerializdData(title, tmdbId);
    // }
    // setMubiParams(prev => ({
    //   ...prev,
    //   title,
    //   year
    // }));
    // fetchOmdbData(imdbId);
    // fetchLbData(title, tmdbId);
  };

  const fetchPoster = (data) => {
    setPosterUrl(`https://image.tmdb.org/t/p/w500/${data.poster_path}`);
  };

  const fetchDirector = (data) => {
    const directors = data.credits.crew
      .filter(member => member.job === "Director")
      .map(director => director.name);
    setDirector(directors);
  };

  const fetchCreator = (data) => {
    const creators = data.created_by.map(person => person.name);
    setCreator(creators);
  };

  // const fetchLbData = async (title: string, tmdbId: string) => {
  //   try {
  //     const { data } = await axios.get(`/api/letterboxd`, {
  //       params: {
  //         title,
  //         tmdbId
  //       }
  //     });
  //     setLbData({ link: data.film.link, rating: data.film.rating });
  //     const ratingOutOf100 = data.film.rating * 20;
  //     setMetric(prev => ({
  //       ...prev,
  //       Letterboxd: ratingOutOf100
  //     }));
  //   } catch (error) {
  //     console.error('Error fetching Letterboxd data:', error);
  //     setLbData({});
  //   }
  // };

  const title = data.title || data.name;
  const year = data.release_date
    ? data.release_date.split("-")[0]
    : data.first_air_date
      ? data.first_air_date.split("-")[0]
      : '';
  const imdbId = data?.external_ids?.imdb_id ?? '';

  // Fetch OMDb data
  const { data: omdbData, error: omdbError, isLoading: omdbIsLoading } = useSWRImmutable(
    imdbId ? `http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${imdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  console.log(omdbData);
  const hasOmdbData = omdbData && omdbData.Response === "True";
  const shouldRenderOmdb = omdbIsLoading || hasOmdbData;

  useEffect(() => {
    if (hasOmdbData) {
      const rt = omdbData.Ratings?.find(rating => rating.Source === "Rotten Tomatoes");
      setMetric(prev => ({
        ...prev,
        IMDb: omdbData.imdbRating.replace(".", "") ?? undefined,
        RottenTomatoes: rt && rt.Value.replace("%", ""),
        Metacritic: omdbData.Metascore ?? undefined
      }));
    }
  }, [omdbData, hasOmdbData]);

  // const fetchOmdbData = async (imdbId: string) => {
  //   try {
  //     const { data } = await axios.get(`http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${imdbId}`);
  //     if (data.Response === "False") {
  //       console.error('Error fetching OMDb data');
  //       setOmdbData({});
  //       return;
  //     }
  //     setOmdbData(data);
  //     const rt = data.Ratings.find(rating => rating.Source === "Rotten Tomatoes");
  //     setMetric(prev => ({
  //       ...prev,
  //       IMDb: data.imdbRating.replace(".", "") ?? '',
  //       RottenTomatoes: rt && rt.Value.replace("%", ""),
  //       Metacritic: data.Metascore ?? ''
  //     }));
  //   } catch (error) {
  //     console.error('Error fetchng OMDb data:', error);
  //     setOmdbData({});
  //   }
  // };

  // Fetch Letterboxd data
  const { data: lbData, error: lbError, isLoading: lbIsLoading } = useSWRImmutable(
    title && tmdbId ? `/api/letterboxd?title=${title}&tmdbId=${tmdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const hasRatingLb = lbData?.film?.rating != null;
  const shouldRenderLb = lbIsLoading || hasRatingLb;

  useEffect(() => {
    if (hasRatingLb) {
      const ratingOutOf100 = lbData.film.rating * 20;
      setMetric(prev => ({
        ...prev,
        Letterboxd: ratingOutOf100
      }));
    }
  }, [lbData, hasRatingLb]);

  // Fetch MUBI data
  const { data: mubiData, error: mubiError, isLoading: mubiIsLoading } = useSWRImmutable(
    title && year && mediaType === "tv"
      ? `/api/mubi?title=${title}&director=&year=${year}`
      : title && year && director?.length > 0
        ? `/api/mubi?title=${title}&director=${director[0]}&year=${year}`
        : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const filmDataMubi = mubiData?.nextData?.props?.initialProps?.pageProps?.initFilm;
  const hasRatingMubi = filmDataMubi != null;
  const shouldRenderMubi = mubiIsLoading || hasRatingMubi;

  useEffect(() => {
    if (hasRatingMubi) {
      const ratingOutOf100 = filmDataMubi.average_rating_out_of_ten * 10;
      setMetric(prev => ({
        ...prev,
        Mubi: ratingOutOf100
      }));
    }
  }, [mubiData, hasRatingMubi]);

  // const fetchMubiData = async (title: string, director: string, year: string) => {
  //   try {
  //     const { data } = await axios.get(`/api/mubi`, {
  //       params: {
  //         title,
  //         director,
  //         year
  //       }
  //     });

  //     const filmData = data?.nextData?.props?.initialProps?.pageProps?.initFilm;

  //     if (!filmData) {
  //       console.warn('No MUBI data found for:', { title, year });
  //       setMubiData({});
  //       return;
  //     }

  //     setMubiData({
  //       rating: filmData.average_rating_out_of_ten,
  //       ratingCount: filmData.number_of_ratings
  //     });
  //     setMetric(prev => ({
  //       ...prev,
  //       Mubi: filmData.average_rating_out_of_ten * 10
  //     }));
  //   } catch (error) {
  //     console.error('Error fetching Mubi data:', error);
  //     setMubiData({});
  //   }
  // };

  // Fetch Serializd data
  const { data: serializdData, error: serializdError, isLoading: serializdIsLoading } = useSWRImmutable(
    title && tmdbId && mediaType === "tv" ? `/api/serializd?title=${title}&tmdbId=${tmdbId}` : null,
    fetcher,
    { shouldRetryOnError: false }
  );
  const filmDataSerializd = serializdData?.ratingData?.aggregateRating;
  const hasRatingSerializd = filmDataSerializd != null;
  const shouldRenderSerializd = serializdIsLoading || hasRatingSerializd;

  useEffect(() => {
    if (hasRatingSerializd) {
      const ratingOutOf100 = filmDataSerializd.ratingValue * 20;
      setMetric(prev => ({
        ...prev,
        Serializd: ratingOutOf100
      }));
    }
  }, [serializdData, hasRatingSerializd]);

  // const fetchSerializdData = async (title: String, tmdbId) => {
  //   try {
  //     const { data } = await axios.get('/api/serializd', {
  //       params: {
  //         title,
  //         tmdbId
  //       }
  //     });

  //     const filmData = data?.ratingData?.aggregateRating;

  //     if (!filmData) {
  //       console.warn('No Serializd data found for:', { title });
  //       setSerializdData({});
  //       return;
  //     }

  //     setSerializdData({
  //       rating: filmData.ratingValue,
  //       ratingCount: filmData.ratingCount
  //     });
  //     setMetric(prev => ({
  //       ...prev,
  //       Serializd: filmData.ratingValue * 20
  //     }));
  //   } catch (error) {
  //     console.error('Error fetching Serializd data', error);
  //     setSerializdData({});
  //   }
  // };

  const getYear = (date) => {
    return date?.split("-")[0] ?? '';
  };

  const firstAirDate = getYear(data.first_air_date);
  const lastAirDate = getYear(data.last_air_date);
  const status = data.status;
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
        {data.title &&
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
                  <h1>{uniscore > -1 ? uniscore + '/5' : 'TBD'}</h1>
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
              {/* {Object.keys(omdbData).length > 0 && (
                <>
                  {omdbData.imdbRating !== "N/A" &&
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
                  }
                  {omdbData.Metascore !== "N/A" &&
                    <div>
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                        alt="Metacritic Logo"
                        width={100}
                        height={100}
                        priority
                      />
                      <span>Metacritic: {omdbData.Metascore}/100</span>
                    </div>
                  }
                  {omdbData.Ratings.map((rating, index) => rating.Source === "Rotten Tomatoes" &&
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
              )} */}
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
                      hasRatingLb ? ` ${lbData.film.rating.toFixed(1)}` : null}
                  </span>
                </div>
              )}
              {/* {lbData.rating &&
                <div>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                    alt="Letterboxd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>Letterboxd: {lbData.rating.toFixed(1)}</span>
                </div>
              } */}
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
              {/* {mubiData.rating &&
                <div>
                  <Image
                    src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/videos/mubi-bu9bsufjk96nkmbnvhtat.png/mubi-c4bymuk2b2nbaykhwmx68u.png?_a=DATAg1AAZAA0"
                    alt="Mubi Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>Mubi: {mubiData.rating.toFixed(1)}/10 based on {mubiData.ratingCount} ratings</span>
                </div>
              } */}
            </div>
            <nav>
              <ul>
                <li>Graph</li>
                <li>Stats</li>
              </ul>
            </nav>
          </>
        }
        {data.name &&
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
                  <h1>{uniscore > -1 ? uniscore + '/5' : 'TBD'}</h1>
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
                      hasRatingLb ? ` ${lbData.film.rating.toFixed(1)}` : null}
                  </span>
                </div>
              )}
              {/* {lbData.rating &&
                <div>
                  <Image
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
                    alt="Letterboxd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>Letterboxd: {lbData.rating.toFixed(1)}</span>
                </div>
              } */}
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
              {/* {mubiData.rating &&
                <div>
                  <Image
                    src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/videos/mubi-bu9bsufjk96nkmbnvhtat.png/mubi-c4bymuk2b2nbaykhwmx68u.png?_a=DATAg1AAZAA0"
                    alt="Mubi Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>Mubi: {mubiData.rating.toFixed(1)}/10 based on {mubiData.ratingCount} ratings</span>
                </div>
              } */}
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
              {/* {serialzdData.rating &&
                <div>
                  <Image
                    src="https://media.imgcdn.org/repo/2024/02/serializd/65cb301c74859-serializd-Icon.webp"
                    alt="Serializd Logo"
                    width={100}
                    height={100}
                    priority
                  />
                  <span>Serializd: {serialzdData.rating} based on {serialzdData.ratingCount} ratings</span>
                </div>
              } */}
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