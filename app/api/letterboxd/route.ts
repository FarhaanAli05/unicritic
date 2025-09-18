import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const apiUrl = "https://api.letterboxd.com/api/v0/search";

interface LetterboxdItems {
  items: LetterboxdItem[];
}

interface LetterboxdItem {
  film?: {
    links?: {
      type: string;
      id: string;
      url: string;
    }[];
  };
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const tmdbId = req.nextUrl.searchParams.get("tmdbId");
  try {
    const { data } = await axios.get(`${apiUrl}?input=${title}`);
    const { items }: LetterboxdItems = data;
    const match = items.find((item: LetterboxdItem) => {
      const links = item.film?.links;
      if (!links?.length) return false;
      const tmdbIndex = links.length - 1;
      return links[tmdbIndex].id === tmdbId;
    });
    if (match) {
      return NextResponse.json(match);
    }
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not fetch Letterboxd data" },
      { status: 500 },
    );
  }
}
