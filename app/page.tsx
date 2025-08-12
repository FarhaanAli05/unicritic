'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Image from "next/image";

export default function Home() {
  interface tmdbResults {
    page: number,
    results: {
      adult: boolean,
      backdrop_path: string,
      genre_ids: [
        number
      ],
      id: number,
      original_language: string,
      origingal_title: string,
      overview: string,
      popularity: number,
      poster_path: string,
      release_date: string,
      title: string,
      video: boolean,
      vote_average: number,
      vote_count: number
    }[],
    total_pages: number,
    total_results: number
  };

  interface OMDbData {
    Title: string,
    Year: string,
    Rated: string,
    Released: string,
    Runtime: string,
    Genre: string,
    Director: string,
    Writer: string,
    Actors: string,
    Plot: string,
    Language: string,
    Country: string,
    Awards: string,
    Poster: string,
    Ratings: {
      Source: string,
      Value: string
    }[],
    Metascore: string,
    imdbRating: string,
    imdbVotes: string,
    imdbID: string,
    Type: string,
    DVD: string,
    BoxOffice: string,
    Production: string,
    Website: string,
    Response: string
  };

  const emptyMovie: OMDbData = {
    Title: '',
    Year: '',
    Rated: '',
    Released: '',
    Runtime: '',
    Genre: '',
    Director: '',
    Writer: '',
    Actors: '',
    Plot: '',
    Language: '',
    Country: '',
    Awards: '',
    Poster: '',
    Ratings: [],
    Metascore: '',
    imdbRating: '',
    imdbVotes: '',
    imdbID: '',
    Type: '',
    DVD: '',
    BoxOffice: '',
    Production: '',
    Website: '',
    Response: ''
  };

  const [data, setData] = useState({});
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [director, setDirector] = useState([]);
  const [creator, setCreator] = useState([]);
  const [omdbData, setOmdbData] = useState<OMDbData>(emptyMovie);
  const [lbData, setLbData] = useState({});
  const [mubiData, setMubiData] = useState({});

  const inputRef = useRef(null);

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;
  const omdbApiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      fetchResults(search);
    }
  }, [search]);

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

  const fetchResults = async (search: string) => {
    const response = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${search}`);
    const items = response.data.results;
    let filteredResults = items.filter(item => item.media_type !== "person" && item.poster_path !== null);
    filteredResults = filteredResults.slice(0, 10);
    setResults(filteredResults);
  };

  const fetchData = async (result) => {
    const id = result.id;
    const title = result.title || result.name;
    const year = result.release_date
      ? result.release_date.split("-")[0]
      : result.first_air_date.split("-")[0];
    const mediaType = result.media_type;
    const response = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${tmdbApiKey}&append_to_response=credits,external_ids`);
    const data = response.data;
    const imdbId = data.external_ids.imdb_id;
    setData(data);
    fetchOmdbData(imdbId);
    fetchLbData(title, id);
    fetchMubiData(title, year);
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

  const fetchOmdbData = async (imdbId: string) => {
    const response = await axios.get(`http://www.omdbapi.com/?apikey=${omdbApiKey}&i=${imdbId}`);
    setOmdbData(response.data);
  };

  const fetchLbData = async (title: string, tmdbId: string) => {
    try {
      const response = await axios.get(`/api/letterboxd`, {
        params: {
          title,
          tmdbId
        }
      });
      const filmData = response.data;
      setLbData({ link: filmData.film.link, rating: filmData.film.rating })
    } catch (error) {
      console.error('Error fetching Letterboxd data:', error);
      setLbData({});
    }
  };

  const fetchMubiData = async (title: string, year: string) => {
    // const fetcher = async ([url, title, year, director]) => {
    //   const res = await fetch(`${url}?title=${title}&year=${year}&director=${director}`);
    //   return res.json();
    // };
    // const { data, error, isLoading } = useSWR(`/api/mubi`, fetcher);
    // if (error) setMubiData({});
    // if (isLoading) setMubiData({ loading: true });
    try {
      const response = await axios.get(`/api/mubi`, {
        params: {
          title,
          year
        }
      });

      const filmData = response?.data?.props?.initialProps?.pageProps?.initFilm;

      if (!filmData) {
        console.warn('No film data found for:', { title, year });
        setMubiData({});
        return;
      }

      setMubiData({ rating: filmData.average_rating_out_of_ten, votes: filmData.number_of_ratings });
    } catch (error) {
      console.error('Error fetching Mubi data:', error);
      setMubiData({});
    }
  };

  const clearData = () => {
    setDirector([]);
    setCreator([]);
    setResults([]);
    setLbData({});
    setMubiData({});
  };

  const getYear = (date) => {
    return date?.split("-")[0] ?? '';
  };

  const firstAirDate = getYear(data.first_air_date);
  const lastAirDate = getYear(data.last_air_date);
  const yearRange =
    firstAirDate && lastAirDate
      ? firstAirDate === lastAirDate
        ? firstAirDate
        : `${firstAirDate}\u2013${lastAirDate}`
      : '';

  return (
    <>
      <div className="logo-container">
        <p>Unicritic</p>
      </div>
      <div>
        <nav>
          <ul>
            <li>Movie/TV</li>
            <li>Music</li>
            <li>Game</li>
            <li>Book</li>
          </ul>
        </nav>
      </div>
      <div>
        <input type="text" placeholder="Search movie/TV" ref={inputRef} onChange={(e) => {
          setSearch(e.target.value);
        }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (results.length > 0) {
                inputRef.current.value = "";
                inputRef.current.focus();
                const firstResult = results[0];
                clearData();
                fetchData(firstResult);
              }
            }
          }}
        />
        <div>
          {results.length > 0 && results.map((result) => {
            return (
              result.media_type === "movie" ? (
                <div key={result.id} onClick={() => {
                  inputRef.current.value = "";
                  inputRef.current.focus();
                  fetchData(result);
                  clearData();
                }}>
                  <div>
                    <img src={`https://image.tmdb.org/t/p/w200/${result.poster_path}`} />
                  </div>
                  <div>
                    <div>
                      {result.title}
                    </div>
                    <div>
                      {result.release_date.split("-")[0] + " \u00B7 " + result.media_type}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={result.id} onClick={() => {
                  inputRef.current.value = "";
                  inputRef.current.focus();
                  fetchData(result);
                  clearData();
                }}>
                  <div>
                    <img src={`https://image.tmdb.org/t/p/w200/${result.poster_path}`} />
                  </div>
                  <div>
                    <div>
                      {result.name}
                    </div>
                    <div>
                      {result.first_air_date.split("-")[0] + " \u00B7 " + result.media_type}
                    </div>
                  </div>
                </div>
              ));
          })}
        </div>
      </div>
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
                <h1>{data.title} ({data.release_date.split("-")[0]})</h1>
              </div>
              <div>
                <h3>Directed by {director.join(", ")}</h3>
              </div>
              <div>
                <h3>Uniscore:</h3>
              </div>
              <div>
                <h1>68%</h1>
              </div>
              <div>
                <span>Based on 7 major review sites</span>
              </div>
              <div></div>
            </div>
          </div>
          <div>
            <div>
              Ratings:
            </div>
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
            {omdbData.Ratings.some(rating => rating.Source === "Rotten Tomatoes") &&
              <div>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                  alt="Rotten Tomatoes Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>Rotten Tomatoes: {omdbData.Ratings[1].Value}</span>
              </div>
            }
            {lbData.rating !== undefined &&
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
            }
            {mubiData.rating !== undefined &&
              <div>
                <Image
                  src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                  alt="Mubi Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>Mubi: {mubiData.rating.toFixed(1)}/10 based on {mubiData.votes} ratings</span>
              </div>
            }
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
                  {data.name} ({yearRange})
                </h1>
              </div>
              <div>
                <h3>Created by {creator.join(", ")}</h3>
              </div>
              <div>
                <h3>Uniscore:</h3>
              </div>
              <div>
                <h1>68%</h1>
              </div>
              <div>
                <span>Based on 7 major review sites</span>
              </div>
              <div></div>
            </div>
          </div>
          <div>
            <div>
              Ratings:
            </div>
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
            {omdbData.Ratings.some(rating => rating.Source === "Rotten Tomatoes") &&
              <div>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Rotten_Tomatoes.svg/237px-Rotten_Tomatoes.svg.png"
                  alt="Rotten Tomatoes Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>Rotten Tomatoes: {omdbData.Ratings[1].Value}</span>
              </div>
            }
            {lbData.rating !== undefined &&
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
            }
            {mubiData.rating !== undefined &&
              <div>
                <Image
                  src="https://yt3.googleusercontent.com/ytc/AIdro_mWJBgDplMrbUXtqSqE2RJcgHEsfQtT1DJK6AtAqwYtML4=s900-c-k-c0x00ffffff-no-rj"
                  alt="Mubi Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>Mubi: {mubiData.rating.toFixed(1)}/10 based on {mubiData.votes} ratings</span>
              </div>
            }
          </div>
          <nav>
            <ul>
              <li>Graph</li>
              <li>Stats</li>
            </ul>
          </nav>
        </>
      }
    </>
  );
}