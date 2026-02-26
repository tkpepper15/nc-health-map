/** Shared CSV serialisation utility used by API routes. */
export function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data?.length) return 'No data available';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h];
      if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v ?? '';
    }).join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}
