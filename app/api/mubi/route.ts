import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
const cheerio = require('cheerio');

const apiUrl = 'https://api.mubi.com/v3/search';

const searchTitleOnly = async (title: string, year: Number) => {
  try {
    const { data } = await axios.get(`${apiUrl}?query=${title}&include_series=true`, {
      headers: {
        CLIENT: 'web',
        CLIENT_COUNTRY: 'us'
      }
    });
    return await fetchMovie(data, title, year);
  } catch (error) {
    return null;
  }
};

const searchMubi = async (title: string, director: string, year: Number) => {
  try {
    const { data } = await axios.get(`${apiUrl}?query=${title} ${director}&include_series=true`, {
      headers: {
        CLIENT: 'web',
        CLIENT_COUNTRY: 'us'
      }
    });
    return await fetchMovie(data, title, year);
  } catch (error) {
    return null;
  }
};

const fetchMovie = async (data, title, year) => {
  // console.log(data);
  const items = data.search.films;
  let match = items.find(item => {
    // console.log(item.title, title, item.title.includes(title))
    return (item.title.includes(title) || title?.includes(item.title)) && year === item.year;
  });
  if (match) {
    return match;
  } else {
    const yearApprox = { [year - 1]: true, [year]: true, [year + 1]: true };
    match = items.find(item => {
      // console.log(item.title, title, item.title.includes(title))
      return (item.title.includes(title) || title?.includes(item.title)) && yearApprox[item.year];
    });
    if (match) {
      return match
    } else {
      const cleanedTitle = title.replace(/[^a-zA-Z0-9]/g, '');
      match = items.find(item => {
        // console.log(item.title, title, item.title.includes(title))
        const cleanedItem = item.title.replace(/[^a-zA-Z0-9]/g, '');
        return (cleanedItem.includes(cleanedTitle) || cleanedTitle.includes(cleanedItem)) && yearApprox[item.year];
      });
      if (match) {
        return match
      }
      return null;
    }
  }
};

const getNextData = async (match) => {
  const url = match.canonical_url;
  const getHtmlContent = async (url: string) => {
    try {
      const { data } = await axios.get(url);
      return data;
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
      return { nextData, url };
    } catch (error) {
      console.error('Error parsing __NEXT_DATA__:', error);
    }
  }
  return null;
};

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const director = req.nextUrl.searchParams.get('director');
  const year = Number(req.nextUrl.searchParams.get('year'));
  let match;
  if (`${title} ${director}`.length > 35) {
    if (title.length > 35) {
      const short = title.slice(0, 35);
      match = await searchTitleOnly(short, year);
    } else {
      match = await searchTitleOnly(title, year);
    }
  } else {
    match = await searchMubi(title, director, year);
  }
  if (match) {
    const mubiData = await getNextData(match);
    return NextResponse.json(mubiData);
  } else {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
}