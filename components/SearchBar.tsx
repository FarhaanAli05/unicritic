import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useDebounce } from "@/app/hooks/useDebounce";

export default function SearchBar({ page, goToDetails, results, setResults, fetchResults }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const delay = page === "movies-and-tv" ? 300 : page === "music" ? 1000 : 300;
  const debouncedSearch = useDebounce(search, delay);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (search.length === 0) {
      setResults({});
    }
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length > 2) {
      fetchResults(debouncedSearch);
    } else if (debouncedSearch.length === 0) {
      setResults({});
    }
  }, [debouncedSearch]);

  return (
    <div className="relative w-full mb-[-20] lg:mb-0">
      <div className="bg-[#18191D] border-[0.5px] border-[#606060] rounded-[10px] flex items-center px-3">
        <Image
          src="/icons/magnifying-glass.svg"
          className="mr-2"
          width={13}
          height={13}
          alt=""
          aria-hidden
        />
        <input
          className="w-full h-10 bg-transparent outline-none"
          type="text"
          placeholder={`Search for ${page === "movies-and-tv"
            ? "a movie or TV show..."
            : page === "music" && "an album..."
            }`}
          ref={inputRef}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0) {
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
        <div className="absolute top-full left-0 w-full max-h-96 bg-[#18191D] border border-[#606060] rounded-[10px] overflow-auto z-50">
          {page === "movies-and-tv" && results.length > 0 && results.map((result) => {
            return (
              <div
                key={result.id}
                className="flex gap-3 p-2 cursor-pointer hover:bg-[#2a2a2a]"
                onMouseDown={() => {
                  inputRef.current.value = "";
                  inputRef.current.focus();
                  goToDetails(result);
                }}
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w200${result.poster_path}`}
                  alt=""
                  width={48}
                  height={64}
                  className="object-cover rounded"
                />
                <div>
                  <div>
                    {result.title || result.name}
                  </div>
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