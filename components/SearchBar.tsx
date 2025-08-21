export default function SearchBar({ inputRef, setSearch, goToDetails, results }) {
  return (
    <div>
      <input type="text" placeholder="Search Movies/TV" ref={inputRef} onChange={(e) => {
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
        {results.length > 0 && results.map((result) => {
          return (
            <div key={result.id} onClick={() => {
              inputRef.current.value = "";
              inputRef.current.focus();
              goToDetails(result);
              // fetchData(result);
              // clearData();
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
      </div>
    </div>
  );
}