"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { TMDbResults } from "@/types/tmdb";

interface NavbarProps {
  page: string;
  goToDetails: (result: TMDbResults) => void;
  results: TMDbResults[];
  setResults: (results: TMDbResults[]) => void;
  fetchResults: (search: string) => void;
}

export default function Navbar({
  page = "",
  goToDetails,
  results,
  setResults,
  fetchResults,
}: NavbarProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex w-[100%] flex-wrap items-center gap-y-4">
      <div className="flex w-full items-center justify-between lg:w-auto">
        <div className="flex flex-shrink-0 items-center lg:mr-10">
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
            <div className="absolute top-full right-0 z-100 mt-3 flex w-40 flex-col items-center items-end rounded-[10px] border-[0.5px] border-[#606060] bg-[#18191D] px-5 py-5 text-end">
              <ul className="flex flex-col gap-y-3">
                <li>
                  <Link
                    className={page === "movies-and-tv" ? "font-bold" : ""}
                    href={"/movies-and-tv"}
                  >
                    Movies & TV
                  </Link>
                </li>
                <li>
                  <Link
                    className={page === "music" ? "font-bold" : ""}
                    href={"/music"}
                  >
                    Music
                  </Link>
                </li>
                <li>
                  <Link
                    className={page === "games" ? "font-bold" : ""}
                    href={"/game"}
                  >
                    Games
                  </Link>
                </li>
                <li>
                  <Link
                    className={page === "books" ? "font-bold" : ""}
                    href={"/book"}
                  >
                    Books
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 w-full flex-1 lg:mt-0 lg:w-auto">
        <SearchBar
          page={page}
          goToDetails={goToDetails}
          results={results}
          setResults={setResults}
          fetchResults={fetchResults}
        />
      </div>
      <nav className="hidden lg:ml-10 lg:block">
        <ul className="flex items-center justify-end gap-x-5">
          <li>
            <Link
              className={page === "movies-and-tv" ? "font-bold" : ""}
              href={"/movies-and-tv"}
            >
              Movies & TV
            </Link>
          </li>
          <li>
            <Link
              className={page === "music" ? "font-bold" : ""}
              href={"/music"}
            >
              Music
            </Link>
          </li>
          <li>
            <Link
              className={page === "games" ? "font-bold" : ""}
              href={"/games"}
            >
              Games
            </Link>
          </li>
          <li>
            <Link
              className={page === "books" ? "font-bold" : ""}
              href={"/books"}
            >
              Books
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
