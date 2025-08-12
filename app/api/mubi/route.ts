import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
const cheerio = require('cheerio');

const apiUrl = 'https://api.mubi.com/v3/search';

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const year = Number(request.nextUrl.searchParams.get('year'));
  try {
    const response = await axios.get(`${apiUrl}?query=${title}&include_series=true`, {
      headers: {
        CLIENT: 'web',
        CLIENT_COUNTRY: 'us'
      }
    });
    const data = response.data;
    const items = data.search.films;
    const yearApprox = { [year - 1]: true, [year]: true, [year + 1]: true };
    console.log(yearApprox);
    console.log(items);
    const match = items.find(item => {
      console.log(item.title, title, item.title.includes(title));
      return (item.title.includes(title) || title?.includes(item.title)) && yearApprox[item.year];
    });
    if (match) {
      const url = match.canonical_url;
      const getHtmlContent = async (url: string) => {
        try {
          const response = await axios.get(url);
          return response.data;
        } catch (error) {
          console.error('Error fetching HTML', error);
          return null;
        }
      };
      const htmlString = await getHtmlContent(url);
      if (htmlString) {
        const $ = cheerio.load(htmlString);
        try {
          const nextData = JSON.parse($("#__NEXT_DATA__").text());
          return NextResponse.json(nextData);
        } catch (error) {
          console.error('Error parsing __NEXT_DATA__:', error);
        }
      }
      return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
    }
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Could not fetch Mubi data' }, { status: 500 });
  }
}