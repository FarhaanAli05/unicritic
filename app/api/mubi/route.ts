import { NextRequest, NextResponse } from 'next/server';
import cheerio from 'cheerio';
import axios from 'axios';

const apiUrl = 'https://api.mubi.com/v3/search';

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const year = Number(request.nextUrl.searchParams.get('year'));
  const director = request.nextUrl.searchParams.get('director');
  try {
    const response = await axios.get(`${apiUrl}?query=${title} ${director}&include_series=true`, {
      headers: {
        CLIENT: 'web',
        CLIENT_COUNTRY: 'us'
      }
    });
    const data = response.data;
    const items = data.search.films;
    const yearApprox = { [year - 1]: true, [year]: true, [year + 1]: true };
    const match = items.find(item => {
      return item.title === title && yearApprox[item.year];
    });
    if (match) {
      const url = match.canonical_url;

      

      //   return NextResponse.json({ link: url, rating, ratings });
      // } catch (error) {
      //   console.error("Mubi scraping failed:", error);
      //   return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
      // } finally {
      //   browser?.close();
      // }
    }
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Could not fetch Mubi data' }, { status: 500 });
  }
}