import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  let query;

  try {
    query = await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const encodedQuery = encodeURIComponent(query.query);
  const url = `https://www.metacritic.com/search/${encodedQuery}/?page=1&category=2`;

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)...");

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const grabLink = await page.evaluate(() => {
      const link = document.querySelector('a[data-testid="search-result-item"]');
      return link ? link.getAttribute('href') : null;
    });

    if (!grabLink) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const fullUrl = new URL(grabLink, 'https://www.metacritic.com/movie').href;

    await page.goto(fullUrl, { waitUntil: "domcontentloaded" });

    const grabScore = await page.evaluate(() => {
      const score = document.querySelector('span[data-v-e408cafe]')?.textContent;
      return score;
    });

    const score = grabScore;

    const grabStat = await page.evaluate(() => {
      const stat = document.querySelector('a[data-testid="critic-path"] span')?.textContent;
      return stat;
    });

    const stat = grabStat;

    return NextResponse.json({ link: fullUrl, score, stat });
  } catch (error) {
    console.error("Metacritic scraping failed:", error);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}