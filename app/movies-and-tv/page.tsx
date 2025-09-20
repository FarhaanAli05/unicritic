"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { TMDbResults } from "@/types/tmdb";
import Container from "@/components/Container";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import Image from "next/image";

export default function MoviesAndTv() {
  const [results, setResults] = useState<TMDbResults[]>([]);
  const router = useRouter();

  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDb_API_KEY;

  const fetchResults = async (search: string) => {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${search}`,
    );
    const filtered = data.results.filter(
      (item: TMDbResults) =>
        item.media_type !== "person" && item.poster_path !== null,
    );
    setResults(filtered);
  };

  const goToDetails = (result: TMDbResults) => {
    const title = result.title || result.name;
    const slugTitle = title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const mediaType = result.media_type;
    const tmdbId = result.id;
    const slug = `${slugTitle}-${tmdbId}`;
    setResults([]);
    router.push(`/movies-and-tv/${mediaType}/${slug}`);
  };

  return (
    <div>
      <Container className="flex h-[90vh] flex-col items-center justify-center gap-y-5">
        <nav className="absolute top-10">
          <ul className="flex items-center justify-end gap-x-5">
            <li>
              <Link className="font-bold" href={"/movies-and-tv"}>
                Movies & TV
              </Link>
            </li>
            <li>
              <Link href={"/music"}>Music</Link>
            </li>
            <li>
              <Link href={"/games"}>Games</Link>
            </li>
            <li>
              <Link href={"/books"}>Books</Link>
            </li>
          </ul>
        </nav>
        <Link href={"/movies-and-tv"} className="flex items-center gap-x-3">
          <Image
            src="/icons/unicritic-logo.svg"
            alt="Unicritic Logo"
            width={39}
            height={44}
            priority
          />
          <h1>Unicritic</h1>
        </Link>
        <div className="w-full max-w-85">
          <SearchBar
            page={"movies-and-tv"}
            goToDetails={goToDetails}
            results={results}
            setResults={setResults}
            fetchResults={fetchResults}
          />
        </div>
        <p className="mt-5 text-center lg:mt-0">
          Your universal critic. Instantly compare ratings.
        </p>
      </Container>
    </div>
  );
}
