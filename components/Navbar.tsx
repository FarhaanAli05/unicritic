"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { useState } from "react";

export default function Navbar({ page, goToDetails, results, setResults, fetchResults }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-y-4 w-[100%]">
      <div className="flex items-center justify-between w-full lg:w-auto">
        <div className="flex items-center flex-shrink-0 lg:mr-10">
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
        <div className="relative block lg:hidden">
          <Image
            src="/icons/hamburger-menu.svg"
            onClick={() => {
              setShowMenu(!showMenu);
            }}
            className="cursor-pointer"
            alt="Menu"
            width={30}
            height={30}
            priority
          />
          {showMenu && (
            <div className="absolute bg-[#18191D] border-[0.5px] border-[#606060] rounded-[10px] flex items-center top-full mt-3 right-0 w-40 px-5 py-5 flex flex-col text-end z-100 items-end">
              <ul className="flex flex-col gap-y-3">
                <li><Link className={page === "movies-and-tv" ? "font-bold" : ""} href={"/movies-and-tv"}>Movies & TV</Link></li>
                <li><Link className={page === "music" ? "font-bold" : ""} href={"/music"}>Music</Link></li>
                <li><Link className={page === "games" ? "font-bold" : ""} href={"/game"}>Games</Link></li>
                <li><Link className={page === "books" ? "font-bold" : ""} href={"/book"}>Books</Link></li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 w-full lg:w-auto mt-1 lg:mt-0">
        <SearchBar
          page={page}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
      </div>
      <nav className="lg:ml-10 hidden lg:block">
        <ul className="flex justify-end items-center gap-x-5">
          <li><Link className={page === "movies-and-tv" ? "font-bold" : ""} href={"/movies-and-tv"}>Movies & TV</Link></li>
          <li><Link className={page === "music" ? "font-bold" : ""} href={"/music"}>Music</Link></li>
          <li><Link className={page === "games" ? "font-bold" : ""} href={"/game"}>Games</Link></li>
          <li><Link className={page === "books" ? "font-bold" : ""} href={"/book"}>Books</Link></li>
        </ul>
      </nav>
    </div>
  );
}