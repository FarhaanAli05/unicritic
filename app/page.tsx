'use client';

import { useState, useEffect } from 'react';
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

  // interface OMDbData {
  //   Title: string,
  //   Year: string,
  //   Rated: string,
  //   Released: string,
  //   Runtime: string,
  //   Genre: string,
  //   Director: string,
  //   Writer: string,
  //   Actors: string,
  //   Plot: string,
  //   Language: string,
  //   Country: string,
  //   Awards: string,
  //   Poster: string,
  //   Ratings: {
  //     Source: string,
  //     Value: string
  //   }[],
  //   Metascore: string,
  //   imdbRating: string,
  //   imdbVotes: string,
  //   imdbID: string,
  //   Type: string,
  //   DVD: string,
  //   BoxOffice: string,
  //   Production: string,
  //   Website: string,
  //   Response: string
  // };

  // const emptyMovie: OMDbData = {
  //   Title: '',
  //   Year: '',
  //   Rated: '',
  //   Released: '',
  //   Runtime: '',
  //   Genre: '',
  //   Director: '',
  //   Writer: '',
  //   Actors: '',
  //   Plot: '',
  //   Language: '',
  //   Country: '',
  //   Awards: '',
  //   Poster: '',
  //   Ratings: [],
  //   Metascore: '',
  //   imdbRating: '',
  //   imdbVotes: '',
  //   imdbID: '',
  //   Type: '',
  //   DVD: '',
  //   BoxOffice: '',
  //   Production: '',
  //   Website: '',
  //   Response: ''
  // };

  const [data, setData] = useState({});
  const [results, setResults] = useState<tmdbResults>({});
  const [search, setSearch] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  // const [genres, setGenres] = useState<string[]>([]);

  // const apiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;

  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });

  useEffect(() => {
    console.log('results updated');
    const firstResult = results.results[0];
    fetchData(firstResult);
  }, [results]);

  useEffect(() => {
    fetchImage(data);
  }, [data]);

  const fetchResults = async (search: string) => {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${search}`);
    setResults(response.data);
  };

  const fetchData = async (result) => {
    const id = result.id;
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&append_to_response=credits`);
    setData(response.data);
  };

  const fetchImage = async (data) => {
    const response = axios.get(`https://image.tmdb.org/t/p/w500/${data.poster_path}`); // in production, set width to "original"
    setImgUrl(response.data);
  };

  // const isImgValid = (url: string) => {
  //   return new Promise((resolve) => {
  //     const img: HTMLImageElement = new Image();
  //     img.onload = () => resolve(true);
  //     img.onerror = () => resolve(false);
  //     img.src = url;
  //   });
  // }

  return (
    <>
      <div className="logo-container">
        <p>Unicritic</p>
      </div>
      <div>
        <nav>
          <ul>
            <li>Movie/TV Show</li>
            <li>Album</li>
            <li>Game</li>
            <li>Book</li>
          </ul>
        </nav>
      </div>
      <div>
        <input type="text" placeholder="Search movie" onChange={(e) => {
          setSearch(e.target.value);
        }} onKeyDown={(e) => {
          if (e.key === "Enter") {
            setSearch(search.replace(" ", "+"));
            fetchResults(search);
          }
        }} />
      </div>
      {data.original_title &&
        <>
          <div>
            <div>
              <Image
                src={data.Poster}
                alt="Poster"
                width={300}
                height={444}
              />
            </div>
            <div>
              <div>
                <h1>{data.Title} ({data.Year})</h1>
              </div>
              <div>
                <h3>By {data.Director !== "N/A" ? data.Director : data.Writer}</h3>
              </div>
              <div>
                <h3>Unicritic Score:</h3>
              </div>
              <div>
                <h1>68%</h1>
              </div>
              <div>
                <span>{data.Plot}</span>
              </div>
              <div></div>
            </div>
          </div>
          <div>
            <nav>
              <ul>
                <li>Graph</li>
                <li>Ratings</li>
              </ul>
            </nav>
            {data.imdbRating !== "N/A" &&
              <div>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                  alt="IMDb Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>IMDb: {data.imdbRating}/10 from {formatter.format(Number(data.imdbVotes))} ratings</span>
              </div>
            }
            {data.Metascore !== "N/A" &&
              <div>
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png"
                  alt="Metacritic Logo"
                  width={100}
                  height={100}
                  priority
                />
                <span>Metacritic: {data.Metascore}%</span>
              </div>
            }
          </div>
        </>
      }
    </>
  );
}