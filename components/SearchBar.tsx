import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/app/hooks/useDebounce";

export default function SearchBar({ type, goToDetails, results, setResults, fetchResults }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  let debouncedSearch;
  if (type === "movies-and-tv") {
    debouncedSearch = useDebounce(search, 300);
  } else if (type === "music") {
    debouncedSearch = useDebounce(search, 1000);
  }

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
    <div>
      <input type="text" placeholder={`Search ${type === "movies-and-tv" ? "movies/TV..." : type === "music" && "albums..."}`} ref={inputRef} onChange={(e) => {
        setSearch(e.target.value);
      }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results.length > 0) {
            inputRef.current.value = "";
            inputRef.current.focus();
            goToDetails(results[0]);
          }
        }}
      />
      <div>
        {type === "movies-and-tv" && results.length > 0 && results.map((result) => {
          return (
            <div key={result.id} onClick={() => {
              inputRef.current.value = "";
              inputRef.current.focus();
              goToDetails(result);
            }}>
              <div>
                <img src={`https://image.tmdb.org/t/p/w200/${result.poster_path}`} />
              </div>
              <div>
                <div>
                  {result.title || result.name}
                </div>
                <div>
                  {`${(result.release_date || result.first_air_date)?.split("-")[0] || "N/A"} \u00B7 ${result.media_type}`}
                </div>
              </div>
            </div>
          );
        })}
        {/* {type === "music" && results.length > 0 && results.map((result) => {
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
    </div>
  );
}