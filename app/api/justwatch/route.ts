import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/simplejustwatchapi";
import { AxiosError } from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "";
  const tmdbId = searchParams.get("tmdbId");
  const country = searchParams.get("country") ?? "US";
  const language = searchParams.get("language") ?? "en";
  const count = parseInt(searchParams.get("count") ?? "4", 10);
  const bestOnly = searchParams.get("bestOnly") !== "false";

  try {
    const results = await search(title, country, language, count, bestOnly);
    const match = results.find((result) => result.tmdb_id == tmdbId);
    if (!match) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(match);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
