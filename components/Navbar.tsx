"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Navbar({ page, goToDetails, results, setResults, fetchResults }) {
  return (
    <div className="flex items-center gap-x-10 justify-center">
      <div className='flex-1 w-fit'>
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
      </div>
      <div className='flex-2'>
        <SearchBar
          page={page}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
      </div>
      <nav className='flex-[1.5]'>
        <ul className='flex justify-between items-center'>
          <li><Link className={page === "movies-and-tv" ? "font-bold" : ""} href={"/movies-and-tv"}>Movies & TV</Link></li>
          <li><Link className={page === "music" ? "font-bold" : ""} href={"/music"}>Music</Link></li>
          <li><Link className={page === "games" ? "font-bold" : ""} href={"/game"}>Games</Link></li>
          <li><Link className={page === "books" ? "font-bold" : ""} href={"/book"}>Books</Link></li>
        </ul>
      </nav>
    </div>
  );
}