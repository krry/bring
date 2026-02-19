import React, { useEffect, useState } from 'react';
import { WebringProps, WebringData } from '../../types/webring';
import { fetchWebringData, validateWebringData } from './fetchWebringData';
import './styles.css';

/**
 * React component for the webring widget
 */
export const Webring: React.FC<WebringProps> = ({
  data,
  mode = 'compact',
  theme = 'auto',
  onLinkClick,
}) => {
  const [webringData, setWebringData] = useState<WebringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!data) {
          setError('No data source provided');
          setLoading(false);
          return;
        }

        const loaded = await fetchWebringData(data);
        if (!validateWebringData(loaded)) {
          setError('Invalid webring data format');
          setLoading(false);
          return;
        }

        setWebringData(loaded);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load webring data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [data]);

  if (loading) {
    return <div className="webring webring--loading">Loading webring...</div>;
  }

  if (error) {
    return <div className="webring webring--error">Error: {error}</div>;
  }

  if (!webringData || !webringData.links || webringData.links.length === 0) {
    return <div className="webring webring--empty">No links found</div>;
  }

  return (
    <div className={`webring webring--${mode} webring--theme-${theme}`}>
      <div className="webring__container">
		<h3 className="webring__title">🫠✒️</h3>
        <ul className="webring__links">
          {webringData.links.map((link, index) => (
            <li key={index} className="webring__link-item">
              <a
                href={link.url}
                className="webring__link"
                title={link.description || link.name}
                onClick={() => onLinkClick?.(link)}
              >
                {link.name}
              </a>
              {link.description && mode === 'full' && (
                <p className="webring__description">{link.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Webring;
