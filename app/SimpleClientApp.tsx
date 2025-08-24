'use client';

import { useState } from 'react';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';

export default function SimpleClientApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'index' | 'data' | 'project'>('home');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex">
        <MainContent>
          {activeTab === 'home' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  North Carolina Healthcare Vulnerability Index
                </h1>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-4">
                    North Carolina Healthcare Data Viewer - an interactive mapping tool displaying real healthcare 
                    data across North Carolina&apos;s 100 counties.
                  </p>
                  <p className="text-gray-600 mb-6">
                    Currently showing verified data from state and federal sources including Medicaid enrollment 
                    rates, social vulnerability indicators, and hospital infrastructure.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-blue-900 mb-3">Available Data</h3>
                      <ul className="space-y-2 text-blue-800">
                        <li>• County-level Medicaid enrollment rates</li>
                        <li>• CDC Social Vulnerability Index (SVI) percentiles</li>
                        <li>• Hospital facility locations and capacity</li>
                        <li>• Population and rural/urban classification</li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold text-amber-900 mb-3">Data Sources</h3>
                      <ul className="space-y-2 text-amber-800">
                        <li>• NC Medicaid enrollment databases</li>
                        <li>• CDC Social Vulnerability Index</li>
                        <li>• NC hospital licensing data</li>
                        <li>• U.S. Census population data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'index' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Interactive Map
                </h1>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-blue-800">
                    The interactive map is loading... This will display North Carolina counties with healthcare data visualization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Healthcare Data Summary</h1>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Counties</h3>
                    <p className="text-3xl font-bold text-blue-600">100</p>
                    <p className="text-sm text-gray-600">North Carolina counties</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Sources</h3>
                    <p className="text-3xl font-bold text-green-600">4+</p>
                    <p className="text-sm text-gray-600">Federal and state sources</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Hospitals</h3>
                    <p className="text-3xl font-bold text-amber-600">163+</p>
                    <p className="text-sm text-gray-600">Licensed facilities</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'project' && (
            <div className="p-8 bg-white overflow-y-auto h-full">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">About This Project</h1>
                <div className="prose max-w-none">
                  <p className="text-lg text-gray-700 mb-4">
                    This interactive mapping application displays verified healthcare data across 
                    North Carolina&apos;s 100 counties from state and federal sources.
                  </p>
                  
                  <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Key Features</h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Real-time healthcare data visualization</li>
                    <li>County-level analysis and comparison</li>
                    <li>Multiple data layer support</li>
                    <li>Interactive mapping interface</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </MainContent>
      </div>
    </div>
  );
}