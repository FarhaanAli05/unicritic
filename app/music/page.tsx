'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import axios from 'axios';

export default function Music() {
  // const [results, setResults] = useState([]);
  // const router = useRouter();

  // const lastFmKey = process.env.NEXT_PUBLIC_LASTFM_KEY;

  // const fetchResults = async (search: string) => {
  //   const { data } = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=album.search&album=${search}&api_key=${lastFmKey}&format=json`);
  //   let filtered = data.results.albummatches.album.filter(album => album.mbid !== "" && album.image[2]['#text'] !== "");
  //   setResults(filtered.splice(0, 10));
  // };

  // const goToDetails = (result) => {
  //   const title = result.title || result.name;
  //   const slugTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  //   const mediaType = result.media_type;
  //   const tmdbId = result.id
  //   const slug = `${slugTitle}-${tmdbId}`
  //   setResults({});
  //   router.push(`/movies-and-tv/${mediaType}/${slug}`);
  // };

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
      {/* <SearchBar
        type={"music"}
        goToDetails={goToDetails}
        results={results}
        setResults={setResults}
        fetchResults={fetchResults}
      /> */}
      <div>Coming soon!</div>
    </>
  );
}