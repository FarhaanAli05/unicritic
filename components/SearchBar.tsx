import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useDebounce } from "@/app/hooks/useDebounce";
import { TMDbResults } from "@/types/tmdb";

interface SearchBarProps {
  page: string;
  goToDetails: (result: TMDbResults) => void;
  results: TMDbResults[];
  setResults: (results: TMDbResults[]) => void;
  fetchResults: (search: string) => void;
}

export default function SearchBar({
  page,
  goToDetails,
  results,
  setResults,
  fetchResults,
}: SearchBarProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const delay = page === "movies-and-tv" ? 300 : page === "music" ? 1000 : 300;
  const debouncedSearch = useDebounce(search, delay);

  useEffect(() => {
    if (inputRef.current !== null) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (search.length === 0) {
      setResults([]);
    }
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length > 2) {
      fetchResults(debouncedSearch);
    } else if (debouncedSearch.length === 0) {
      setResults([]);
    }
  }, [debouncedSearch]);

  return (
    <div className="relative mb-[-20] w-full lg:mb-0">
      <div className="flex items-center rounded-[10px] border-[0.5px] border-[#606060] bg-[#18191D] px-3">
        <Image
          src="/icons/magnifying-glass.svg"
          className="mr-2"
          width={13}
          height={13}
          alt=""
          aria-hidden
        />
        <input
          className="h-10 w-full bg-transparent outline-none"
          type="text"
          placeholder={`Search for ${
            page === "movies-and-tv"
              ? "a movie or TV show..."
              : page === "music" && "an album..."
          }`}
          ref={inputRef}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              results.length > 0 &&
              inputRef.current !== null
            ) {
              inputRef.current.value = "";
              inputRef.current.focus();
              goToDetails(results[0]);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>

      {isFocused && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 max-h-96 w-full overflow-auto rounded-[10px] border border-[#606060] bg-[#18191D]">
          {page === "movies-and-tv" &&
            results.length > 0 &&
            results.map((result: TMDbResults) => {
              return (
                <div
                  key={result.id}
                  className="flex cursor-pointer gap-3 p-2 hover:bg-[#2a2a2a]"
                  onMouseDown={() => {
                    if (inputRef.current !== null) {
                      inputRef.current.value = "";
                      inputRef.current.focus();
                    }
                    goToDetails(result);
                  }}
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w200${result.poster_path}`}
                    alt=""
                    width={48}
                    height={64}
                    className="rounded object-cover"
                  />
                  <div>
                    <div>{result.title || result.name}</div>
                    <div className="text-sm text-gray-400">
                      {`${(result.release_date || result.first_air_date)?.split("-")[0] || "N/A"} \u00B7 ${result.media_type}`}
                    </div>
                  </div>
                </div>
              );
            })}
          {/* {page === "music" && results.length > 0 && results.map((result) => {
          return (
            <div key={result.mbid} onClick={() => {
              inputRef.current.value = "";
              inputRef.current.focus();
              goToDetails(result);
              // fetchData(result);
              // clearData();
            }}>
              <div>
                <img src={result.image[3]['#text']}/>
              </div>
              <div>
                <div>
                  {result.name}
                </div>
                <div>
                  {result.artist}
                </div>
              </div>
            </div>
          );
        })} */}
        </div>
      )}
    </div>
  );
}
