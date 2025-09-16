'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from "next/image";
import SearchBar from '@/components/SearchBar';
import axios from 'axios';
import { TMDbResults } from '@/types/tmdb';

export default function MoviesAndTv() {
  const [results, setResults] = useState<TMDbResults[]>([]);
  const router = useRouter();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;

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

  return (
    <>
      <div className="logo-container">
        <Image
          src="/icons/unicritic-logo.svg"
          alt="Unicritic Logo"
          width={39}
          height={44}
          priority
        />
        <Link href={"/movies-and-tv"}>
          <h1>Unicritic</h1>
        </Link>
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
      <SearchBar
        type={"movies-and-tv"}
        goToDetails={goToDetails}
        results={results}
        setResults={setResults}
        fetchResults={fetchResults}
      />
    </>
  );
}