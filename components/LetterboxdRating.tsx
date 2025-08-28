import fetcher from "@/utils/fetcher";
import Image from "next/image";
import useSWR from "swr";

export default function LetterboxdRating({ title, tmdbId }: {
  title: string,
  tmdbId: string
}) {
  const { data, error, isLoading } = useSWR(
    title && tmdbId ? `/api/letterboxd?${title}&${tmdbId}` : null,
    fetcher
  );

  if (isLoading) return (
    <div>
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
        alt="Letterboxd Logo"
        width={100}
        height={100}
        priority
      />
      <span>Loading...</span>
    </div>
  );
  if (error) return <></>;

  return data?.film?.rating ? (
    <div>
      <Image
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Letterboxd_2023_logo.png/500px-Letterboxd_2023_logo.png"
        alt="Letterboxd Logo"
        width={100}
        height={100}
        priority
      />
      <span>Letterboxd: {data.film.rating.toFixed(1)}</span>
    </div>
  ) : (
    <></>
  )
}