'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from "next/image";

export default function Home() {
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

  const [data, setData] = useState<OMDbData>(emptyMovie);
  const [search, setSearch] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_OMDb_API_KEY;

  const fetchData = async (search: string) => {
    const response = await axios.get(`https://www.omdbapi.com/?t=${search}&apikey=${apiKey}`);
    setData(response.data);
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
            fetchData(search);
          }
        }} />
      </div>
      {data.Title &&
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
            </div>
          </div>
          <div>
            <nav>
              <ul>
                <li>Graph</li>
                <li>Ratings</li>
              </ul>
            </nav>
            <div>
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/128px-IMDb_Logo_Square.svg.png"
                alt="Review Site Logo"
                width={100}
                height={100}
                priority
              />
              <span>IMDb: 7/10 from 78k ratings</span>
            </div>
          </div>
        </>
      }
    </>
  );
}