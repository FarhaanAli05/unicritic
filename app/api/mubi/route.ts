import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import * as cheerio from "cheerio";

const apiUrl = "https://api.mubi.com/v3/search";

export interface MubiInitFilm {
  average_rating_out_of_ten?: number;
  average_rating?: number;
  number_of_ratings?: number;
}

export interface NextDataShape {
  props?: {
    initialProps?: {
      pageProps?: {
        initFilm?: MubiInitFilm;
        series?: MubiInitFilm;
      };
    };
  };
}

interface MubiFilm {
  title: string;
  year: number;
  canonical_url: string;
}

interface MubiSearchResponse {
  search: {
    films: MubiFilm[];
  };
}

const searchMubiByTitleOnly = async (title: string, year: number) => {
  try {
    const { data } = await axios.get(
      `${apiUrl}?query=${title}&include_series=true`,
      {
        headers: {
          CLIENT: "web",
          CLIENT_COUNTRY: "us",
        },
      },
    );
    return await findBestMatch(data, title, year);
  } catch (error) {
    return null;
  }
};

const searchMubiByTitleAndDirector = async (
  title: string,
  director: string,
  year: number,
) => {
  try {
    const { data } = await axios.get(
      `${apiUrl}?query=${title} ${director}&include_series=true`,
      {
        headers: {
          CLIENT: "web",
          CLIENT_COUNTRY: "us",
        },
      },
    );
    return await findBestMatch(data, title, year);
  } catch (error) {
    return null;
  }
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const findBestMatch = async (
  data: MubiSearchResponse,
  title: string,
  year: number,
) => {
  // console.log(data);
  const items = data.search.films;
  let match = items.find((item) => {
    // console.log(item.title, title, item.title.includes(title));
    return (
      (item.title.includes(title) || title?.includes(item.title)) &&
      year === item.year
    );
  });
  if (match) {
    return match;
  } else {
    const yearApprox = { [year - 1]: true, [year]: true, [year + 1]: true };
    match = items.find((item) => {
      // console.log(item.title, title, item.title.includes(title));
      return (
        (item.title.includes(title) || title?.includes(item.title)) &&
        yearApprox[item.year]
      );
    });
    if (match) {
      return match;
    } else {
      const cleanedTitle = normalize(title);
      match = items.find((item) => {
        // console.log("item:", item);
        // console.log(item.title, title, item.title.includes(title));
        const cleanedItem = normalize(item.title);
        return (
          (cleanedItem.includes(cleanedTitle) ||
            cleanedTitle.includes(cleanedItem)) &&
          yearApprox[item.year]
        );
      });
      if (match) {
        return match;
      }
      return null;
    }
  }
};

const fetchMubiNextData = async (match: MubiFilm) => {
  const url = match.canonical_url;
  const getHtmlContent = async (url: string) => {
    try {
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 10000,
      });
      return data;
    } catch (error) {
      const err = error as AxiosError;
      const status = err?.response?.status ?? 502;
      const message = err?.message ?? "Failed to fetch HTML";
      throw { status, message, original: err };
    }
  };
  const htmlString = await getHtmlContent(url);
  if (htmlString) {
    const $ = cheerio.load(htmlString);
    try {
      const nextData = JSON.parse($("#__NEXT_DATA__").text());
      return { nextData, url };
    } catch (error) {
      console.error("Error parsing __NEXT_DATA__:", error);
    }
  }
  return null;
};

export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get("title");
    const director = req.nextUrl.searchParams.get("director") || "";
    const year = Number(req.nextUrl.searchParams.get("year"));
    let match;

    if (!title) {
      return NextResponse.json(
        { error: "Title query param is required" },
        { status: 400 },
      );
    }

    if (`${title} ${director}`.length > 35) {
      if (title.length > 35) {
        const short = title.slice(0, 35);
        match = await searchMubiByTitleOnly(short, year);
      } else {
        match = await searchMubiByTitleOnly(title, year);
      }
    } else {
      match = await searchMubiByTitleAndDirector(title, director, year);
    }
    if (!match) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    const mubiData = await fetchMubiNextData(match);
    return NextResponse.json(mubiData);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error when fetching Mubi page:", error);
      const status = error?.response?.status ?? 502;
      const message = error?.message ?? "Failed to fetch MUBI page";
      return NextResponse.json({ error: message }, { status });
    }
    console.error("Unexpected error in /api/mubi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
