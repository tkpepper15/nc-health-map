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
        const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const url = countyName ? `${backendBase}/news/${encodeURIComponent(countyName)}` : `${backendBase}/news/state`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.statusText}`);
        }
        const data = await response.json();
        setNews(data);
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
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {selectedCounty ? `${countyName || 'Loading...'} County` : 'North Carolina'} Healthcare News
        </h2>
      </div>

      {/* News Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* State Overview (shown when no county selected) */}
        {!selectedCounty && (
          <div className="mb-4 p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">State Health Overview</h3>
            
            {/* Primary Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="text-2xl font-bold text-blue-700">{stateMetrics.medicaidEnrollment.rate}%</div>
                <div className="text-sm text-gray-600">Medicaid Enrollment</div>
                <div className="text-xs text-blue-600 mt-1">{stateMetrics.medicaidEnrollment.total} enrollees</div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <div className="text-2xl font-bold text-amber-700">{stateMetrics.hcvi.score}</div>
                <div className="text-sm text-gray-600">HCVI Score</div>
                <div className="text-xs text-amber-600 mt-1">{stateMetrics.hcvi.category}</div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-sm font-semibold text-gray-800">{stateMetrics.overview.counties}</div>
                <div className="text-xs text-gray-600">Counties</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-sm font-semibold text-gray-800">{stateMetrics.overview.population}</div>
                <div className="text-xs text-gray-600">Population</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-sm font-semibold text-gray-800">{stateMetrics.overview.hospitals}</div>
                <div className="text-xs text-gray-600">Hospitals</div>
              </div>
            </div>
          </div>
        )}
        <h3 className="text-lg font-semibold mb-4 text-black">Latest Healthcare Media</h3>
        
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

        <div className="space-y-6">
          {news.map((article, index) => (
            <article 
              key={index} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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

      {/* Chat Box */}
      <div className="border-t border-gray-200 p-4">
        <ChatBox />
      </div>
    </div>
  );
}