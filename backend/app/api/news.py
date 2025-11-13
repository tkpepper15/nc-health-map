from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
import httpx
from datetime import datetime, timedelta
from ..core.config import Settings
from ..core.deps import get_settings

router = APIRouter()


class NewsArticle(BaseModel):
    title: str
    url: HttpUrl
    source: str
    published_at: str
    description: Optional[str] = None
    image_url: Optional[HttpUrl] = None


# --- Helper: deduplicate and filter ---
def filter_and_sort_articles(articles: List[NewsArticle]) -> List[NewsArticle]:
    """Remove duplicates, filter by health relevance, and sort by date."""
    health_terms = [
        "health", "hospital", "clinic", "medical", "medicine",
        "ncdhhs", "public health", "wellness", "care", "disease"
    ]

    # Deduplicate by URL
    unique_articles = {a.url: a for a in articles}.values()

    # Keep only those clearly about health
    filtered = [
        a for a in unique_articles
        if any(term.lower() in (a.title + " " + (a.description or "")).lower()
               for term in health_terms)
    ]

    # Sort by published date (newest first)
    sorted_articles = sorted(filtered, key=lambda x: x.published_at, reverse=True)
    return sorted_articles[:10]


# --- Fetcher for single county ---
async def fetch_news_for_county(county_name: str, settings: Settings, state: str = "NC") -> List[NewsArticle]:
    """Fetch more relevant healthcare news for a specific NC county using stricter queries."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        base_url = "https://newsapi.org/v2/everything"
        now = datetime.utcnow()
        from_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")

        # Focused healthcare keyword groups
        keyword_groups = [
            "public health", "hospital", "clinic", "health department",
            "community health", "healthcare access", "medical care"
        ]

        # Local and trusted health domains (optional)
        domains = ",".join([
            "wral.com", "newsobserver.com", "wsoctv.com",
            "wbtv.com", "abc11.com", "ncdhhs.gov",
            "npr.org", "wect.com", "wraltechwire.com"
        ])

        articles: List[NewsArticle] = []

        for kw in keyword_groups:
            q = f'"{county_name} County" {kw} OR "{county_name}, {state}" {kw}'
            params = {
                "q": q,
                "apiKey": settings.NEWS_API_KEY,
                "language": "en",
                "sortBy": "relevancy",
                "from": from_date,
                "pageSize": 5,
                "domains": domains
            }

            try:
                print(f"Query (county): {q}")
                resp = await client.get(base_url, params=params)
                resp.raise_for_status()
                data = resp.json()
                raw_articles = data.get("articles", [])

                for article in raw_articles:
                    articles.append(
                        NewsArticle(
                            title=article.get("title", ""),
                            url=article.get("url", ""),
                            source=(article.get("source") or {}).get("name", ""),
                            published_at=article.get("publishedAt", ""),
                            description=article.get("description"),
                            image_url=article.get("urlToImage")
                        )
                    )
            except Exception as e:
                print(f"Error fetching {kw} for {county_name}: {e}")
                continue

        return filter_and_sort_articles(articles)


# --- Fetcher for nearby / state fallback ---
async def fetch_news_for_nearby_counties(county_name: str, settings: Settings, state: str = "NC") -> List[NewsArticle]:
    """Fetch healthcare news from nearby counties or at the state level."""
    # Basic nearby counties for a few known counties (extend as needed)
    nearby_map = {
        "Wake": ["Johnston", "Durham", "Chatham", "Franklin"],
        "Robeson": ["Cumberland", "Bladen", "Hoke", "Scotland"],
        "Mecklenburg": ["Union", "Gaston", "Cabarrus", "Iredell"],
        "Durham": ["Wake", "Orange", "Granville"],
        "Cumberland": ["Hoke", "Robeson", "Sampson", "Bladen"],
    }

    neighbors = nearby_map.get(county_name, [])
    async with httpx.AsyncClient(timeout=15.0) as client:
        base_url = "https://newsapi.org/v2/everything"
        now = datetime.utcnow()
        from_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")

        keyword_groups = [
            "public health", "hospital", "clinic", "health department",
            "community health", "healthcare access", "medical care"
        ]

        domains = ",".join([
            "wral.com", "newsobserver.com", "wsoctv.com",
            "wbtv.com", "abc11.com", "ncdhhs.gov",
            "npr.org", "wect.com", "wraltechwire.com"
        ])

        articles: List[NewsArticle] = []

        # First try nearby counties
        for neighbor in neighbors:
            for kw in keyword_groups:
                q = f'"{neighbor} County" {kw} OR "{neighbor}, {state}" {kw}'
                params = {
                    "q": q,
                    "apiKey": settings.NEWS_API_KEY,
                    "language": "en",
                    "sortBy": "relevancy",
                    "from": from_date,
                    "pageSize": 5,
                    "domains": domains
                }

                try:
                    print(f"Query (neighbor): {q}")
                    resp = await client.get(base_url, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                    raw_articles = data.get("articles", [])
                    for article in raw_articles:
                        articles.append(
                            NewsArticle(
                                title=article.get("title", ""),
                                url=article.get("url", ""),
                                source=(article.get("source") or {}).get("name", ""),
                                published_at=article.get("publishedAt", ""),
                                description=article.get("description"),
                                image_url=article.get("urlToImage")
                            )
                        )
                except Exception as e:
                    print(f"Error fetching neighbor {neighbor}: {e}")
                    continue

        # If still no results, broaden to state-level news
        if not articles:
            for kw in keyword_groups:
                q = f'"North Carolina" {kw} OR "NC" {kw}'
                params = {
                    "q": q,
                    "apiKey": settings.NEWS_API_KEY,
                    "language": "en",
                    "sortBy": "relevancy",
                    "from": from_date,
                    "pageSize": 5,
                    "domains": domains
                }

                try:
                    print(f"Query (state): {q}")
                    resp = await client.get(base_url, params=params)
                    resp.raise_for_status()
                    data = resp.json()
                    raw_articles = data.get("articles", [])
                    for article in raw_articles:
                        articles.append(
                            NewsArticle(
                                title=article.get("title", ""),
                                url=article.get("url", ""),
                                source=(article.get("source") or {}).get("name", ""),
                                published_at=article.get("publishedAt", ""),
                                description=article.get("description"),
                                image_url=article.get("urlToImage")
                            )
                        )
                except Exception as e:
                    print(f"Error fetching state news: {e}")
                    continue

        return filter_and_sort_articles(articles)


# --- Route ---
@router.get("/{county}", response_model=List[NewsArticle])
async def get_county_news(
    county: str,
    settings: Settings = Depends(get_settings)
):
    """Get healthcare news for a specific NC county with nearby/state fallback."""
    articles = await fetch_news_for_county(county, settings)

    if not articles:
        articles = await fetch_news_for_nearby_counties(county, settings)

    if not articles:
        raise HTTPException(
            status_code=404,
            detail=f"No healthcare news found for {county} County or nearby areas"
        )

    return articles
