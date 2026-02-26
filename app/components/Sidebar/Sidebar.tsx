"use client";

import { useEffect, useState } from 'react';
import { useHealthcareStore } from '../../utils/store';
import ChatBox from '../ChatBox/ChatBox';
import { HiX } from 'react-icons/hi';

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  published_at: string;
  description?: string;
  image_url?: string;
}

export default function Sidebar() {
  const { selectedCounty, setSidebarOpen } = useHealthcareStore();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [countyName, setCountyName] = useState<string | null>(null);

  const stateMetrics = {
    medicaidEnrollment: {
      rate: 27.1,
      total: "2.85M"
    },
    hcvi: {
      score: 5.2,
      category: "Moderate Risk"
    },
    overview: {
      counties: 100,
      population: "10.5M",
      hospitals: 85
    }
  };

  // Get county name from FIPS code
  useEffect(() => {
    if (!selectedCounty) {
      setCountyName(null);
      return;
    }
    
    async function getCountyName() {
      try {
        const response = await fetch('/data/nc-counties.json');
        const data = await response.json();
        const county = data.features.find((f: any) => 
          selectedCounty && f.properties.FIPS === selectedCounty.slice(2)
        );
        if (county) {
          setCountyName(county.properties.NAME);
        } else {
          setCountyName(null);
        }
      } catch (err) {
        console.error('Error getting county name:', err);
      }
    }

    getCountyName();
  }, [selectedCounty]);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);

      try {
        const url = countyName ? `/api/news?county=${encodeURIComponent(countyName)}` : '/api/news';
        const response = await fetch(url, { cache: 'no-store' });
        const data = await response.json();
        setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, [countyName]);


  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    // Two-column split: left = News, right = Chat
    <div className="w-full h-screen flex">
      {/* Left column: News (50%) */}
      <div className="w-1/2 h-screen overflow-y-auto bg-white border-r border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-2 text-black">Latest Healthcare Media</h3>
        {countyName && (
          <div className="mb-4 text-sm text-gray-700">
            <span>County: </span>
            <span className="font-semibold text-gray-900">{countyName}</span>
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        {!loading && !error && news.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            No recent healthcare news found for this county.
          </div>
        )}

        {/* Articles list - avoid nested fixed-height scroll containers */}
        <div className="space-y-6">
          {news.map((article, index) => (
            <article 
              key={index} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              {article.image_url && (
                <img 
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h4 className="text-lg font-medium mb-2">
                <a 
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {article.title}
                </a>
              </h4>
              {article.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {article.description}
                </p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{article.source}</span>
                <time>{formatDate(article.published_at)}</time>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Right column: Chat (50%) */}
      <div className="w-1/2 h-screen bg-gray-50 p-6 overflow-hidden">
        <div className="h-full flex flex-col">
          <ChatBox countyName={countyName} />
        </div>
      </div>
    </div>
  );
}