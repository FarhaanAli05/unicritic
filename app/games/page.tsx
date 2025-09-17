import Link from "next/link";

export default function Game() {
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