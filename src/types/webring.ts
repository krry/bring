/**
 * TypeScript interfaces for the webring widget
 */

export interface WebringLink {
  name: string;
  url: string;
  description?: string;
  thumbnail?: string;
  theme?: 'dark' | 'light' | 'auto';
}

export interface WebringData {
  version: string;
  links: WebringLink[];
  metadata?: {
    updated: string;
    count: number;
  };
}

export interface WebringProps {
  /** Data source URL or inline data */
  data?: WebringData | string;
  /** Display mode: 'compact' | 'full' */
  mode?: 'compact' | 'full';
  /** Theme: 'dark' | 'light' | 'auto' */
  theme?: 'dark' | 'light' | 'auto';
  /** Callback when link is clicked */
  onLinkClick?: (link: WebringLink) => void;
}
