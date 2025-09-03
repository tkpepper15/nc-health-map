'use client';

import { useState, useEffect } from 'react';

interface CountyClassification {
  county_name: string;
  classification: string;
  fips_code: string;
  classification_source: string;
  notes: string;
}

interface CountyClassificationsData {
  metadata: {
    title: string;
    description: string;
    source: string;
    total_counties: number;
    classifications: Record<string, number>;
    processed_date: string;
  };
  counties: Record<string, CountyClassification>;
}

export function useCountyClassifications() {
  const [classifications, setClassifications] = useState<Record<string, CountyClassification>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClassifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/processed/nc-county-classifications.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CountyClassificationsData = await response.json();
        setClassifications(data.counties || {});
        setError(null);
      } catch (err) {
        console.error('Failed to load county classifications:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setClassifications({});
      } finally {
        setLoading(false);
      }
    };

    loadClassifications();
  }, []);

  const getClassification = (fipsCode: string): string => {
    const classification = classifications[fipsCode]?.classification;
    if (!classification) return 'Unknown';
    
    // Capitalize first letter
    return classification.charAt(0).toUpperCase() + classification.slice(1);
  };

  const getClassificationColor = (fipsCode: string): string => {
    const classification = classifications[fipsCode]?.classification;
    switch (classification) {
      case 'urban': return 'blue';
      case 'suburban': return 'amber'; 
      case 'tourism': return 'red';
      case 'rural': return 'green';
      default: return 'gray';
    }
  };

  return {
    classifications,
    loading,
    error,
    getClassification,
    getClassificationColor
  };
}