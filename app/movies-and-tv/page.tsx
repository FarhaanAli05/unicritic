'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import axios from 'axios';

export default function MoviesAndTv() {
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

  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const router = useRouter();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (search.length > 2) {
      fetchResults(search);
    } else if (search.length === 0) {
      setResults({});
    }
  }, [search]);

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
            <li>Games</li>
            <li>Books</li>
          </ul>
        </nav>
      </div>
      <SearchBar
        inputRef={inputRef}
        setSearch={setSearch}
        goToDetails={goToDetails}
        results={results}
      />
    </>
  );
}