import { WebringData } from '../../types/webring';

/**
 * Fetch webring data from a URL or return inline data
 * @param source - URL string or inline WebringData object
 * @returns Promise<WebringData>
 */
export async function fetchWebringData(source: string | WebringData): Promise<WebringData> {
  // If source is already an object, return it
  if (typeof source === 'object' && source !== null) {
    return source;
  }

  // If source is a URL string, fetch it
  if (typeof source === 'string') {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch webring data from ${source}: ${response.statusText}`);
    }
    return response.json() as Promise<WebringData>;
  }

  throw new Error('Invalid data source: must be a URL string or WebringData object');
}

/**
 * Validate webring data structure
 * @param data - WebringData to validate
 * @returns boolean
 */
export function validateWebringData(data: WebringData): boolean {
  return (
    typeof data === 'object' &&
    typeof data.version === 'string' &&
    Array.isArray(data.links) &&
    data.links.every(
      (link) => typeof link.name === 'string' && typeof link.url === 'string'
    )
  );
}
