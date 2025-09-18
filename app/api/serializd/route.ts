import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const baseUrl = "https://www.serializd.com/show";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  const tmdbId = req.nextUrl.searchParams.get("tmdbId");

  const url = `${baseUrl}/${title}-${tmdbId}`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const ratingData = JSON.parse(
      $('script[type="application/ld+json"]').text(),
    );
    return NextResponse.json({ ratingData, url });
  } catch (error) {
    return NextResponse.json(
      { error: "Could not fetch Serializd data" },
      { status: 404 },
    );
  }
}
