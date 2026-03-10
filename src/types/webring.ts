/**
 * TypeScript interfaces for the webring widget
 */

export interface WebringLink {
  name: string;
  url: string;
  description?: string;
  /** Emoji to render before the link label */
  emoji?: string;
  /** Hex color used for hover + border highlight */
  color?: string;
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
  /** Widget size: 'small' | 'medium' | 'large' */
  size?: 'small' | 'medium' | 'large';
  /** Theme: 'dark' | 'light' | 'auto' */
  theme?: 'dark' | 'light' | 'auto';
  /** Callback when link is clicked */
  onLinkClick?: (link: WebringLink) => void;
}
