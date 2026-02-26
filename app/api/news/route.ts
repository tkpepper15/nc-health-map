import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_BASE = 'https://newsapi.org/v2/everything';
const NC_DOMAINS = 'wral.com,newsobserver.com,wsoctv.com,wbtv.com,abc11.com,npr.org,wect.com';

interface RawArticle {
  title?: string;
  url?: string;
  source?: { name?: string };
  publishedAt?: string;
  description?: string;
  urlToImage?: string;
}

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description?: string;
  image_url?: string;
}

function fromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function mapArticle(a: RawArticle): NewsArticle {
  return {
    title: a.title ?? '',
    url: a.url ?? '',
    source: a.source?.name ?? '',
    published_at: a.publishedAt ?? '',
    description: a.description ?? undefined,
    image_url: a.urlToImage ?? undefined,
  };
}

function filterAndSort(articles: NewsArticle[]): NewsArticle[] {
  const healthTerms = ['health', 'hospital', 'clinic', 'medical', 'medicaid', 'care', 'disease', 'wellness'];
  const seen = new Set<string>();
  const unique = articles.filter(a => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    const text = `${a.title} ${a.description ?? ''}`.toLowerCase();
    return healthTerms.some(t => text.includes(t));
  });
  return unique.sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 10);
}

async function fetchArticles(queries: string[]): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const from = fromDate();
  const results: NewsArticle[] = [];

  for (const q of queries) {
    try {
      const params = new URLSearchParams({
        q,
        apiKey,
        language: 'en',
        sortBy: 'relevancy',
        from,
        pageSize: '5',
        domains: NC_DOMAINS,
      });
      const res = await fetch(`${NEWS_API_BASE}?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of (data.articles ?? []) as RawArticle[]) {
        results.push(mapArticle(a));
      }
    } catch {
      continue;
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  const county = new URL(request.url).searchParams.get('county');

  let articles: NewsArticle[];

  if (county) {
    // County-level queries
    const countyQueries = [
      `"${county} County" hospital OR clinic OR "health department"`,
      `"${county} County" Medicaid OR "public health" OR "healthcare access"`,
      `"${county}, NC" health OR medical OR care`,
    ];
    articles = filterAndSort(await fetchArticles(countyQueries));

    // Fallback to state news if nothing county-specific
    if (articles.length === 0) {
      const stateQueries = [
        '"North Carolina" hospital OR Medicaid OR "public health"',
        '"North Carolina" healthcare OR "rural health"',
      ];
      articles = filterAndSort(await fetchArticles(stateQueries));
    }
  } else {
    // State-level queries
    const stateQueries = [
      '"North Carolina" hospital',
      '"North Carolina" Medicaid',
      '"North Carolina" "public health"',
      'NC healthcare "rural hospital"',
    ];
    articles = filterAndSort(await fetchArticles(stateQueries));
  }

  return NextResponse.json(articles);
}
