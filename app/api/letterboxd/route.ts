import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const tmdbId = request.nextUrl.searchParams.get('tmdbId');
  try {
    const response = await axios.get(`https://api.letterboxd.com/api/v0/search?input=${title}`);
    const data = response.data;
    const items = data.items;
    const match = items.find(item => {
      const links = item.film?.links;
      const tmdbIndex = links.length - 1;
      return links[tmdbIndex].id === tmdbId;
    });
    if (match) {
        return NextResponse.json({ link: match.film.link, rating: match.film.rating });
    }
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Could not fetch Letterboxd data' }, { status: 500 });
  }
}