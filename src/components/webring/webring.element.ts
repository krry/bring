import { WebringData, WebringLink } from '../../types/webring';
import { fetchWebringData, validateWebringData } from './fetchWebringData';

/**
 * Web Component wrapper for the webring widget
 * Usage: <webring-widget data-source="url" mode="compact" theme="auto"></webring-widget>
 */
class WebringElement extends HTMLElement {
  private shadow: ShadowRoot;
  private data: WebringData | null = null;
  private loading = false;
  private expanded = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  /**
   * Observed attributes that trigger attributeChangedCallback
   */
  static get observedAttributes(): string[] {
    return ['data-source', 'mode', 'theme'];
  }

  /**
   * Lifecycle: element is inserted into the DOM
   */
  async connectedCallback(): Promise<void> {
    this.render();
    await this.loadData();
    
    // Listen for system theme changes when theme="auto"
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.getAttribute('theme') === 'auto') {
        this.render();
      }
    });
  }

  /**
   * Lifecycle: an observed attribute has changed
   */
  async attributeChangedCallback(name: string, _oldValue: string, _newValue: string): Promise<void> {
    if (name === 'data-source') {
      this.data = null;
      await this.loadData();
      this.render();
    } else {
      this.render();
    }
  }

  /**
   * Load data from data-source attribute
   */
  private async loadData(): Promise<void> {
    if (this.loading) return;

    const source = this.getAttribute('data-source');
    if (!source) {
      this.renderError('No data-source attribute provided');
      return;
    }

    this.loading = true;
    this.renderLoading();

    try {
      this.data = await fetchWebringData(source);
      if (!validateWebringData(this.data)) {
        this.renderError('Invalid webring data format');
        return;
      }
      this.render();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load webring data';
      this.renderError(message);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Resolve theme (auto -> light/dark based on system preference)
   */
  private resolveTheme(): string {
    const themeAttr = this.getAttribute('theme') || 'auto';
    if (themeAttr === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeAttr;
  }

  /**
   * Main render method
   */
  private render(): void {
    const mode = this.getAttribute('mode') || 'compact';
    const theme = this.resolveTheme();

    if (!this.data) {
      return;
    }

    const html = `
      <style>
        :host {
          /* Light mode defaults (glass effect) */
          --glass-bg: rgba(255, 255, 255, 0.5);
          --glass-border: rgba(255, 255, 255, 0.62);
          --text: rgba(0, 0, 0, 0.82);
          --muted: rgba(0, 0, 0, 0.62);
          --shadow: rgba(0, 0, 0, 0.18);
          --blur: 18px;
        }

        .webring {
          color: var(--text);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(var(--blur));
          -webkit-backdrop-filter: blur(var(--blur));
          box-shadow: 0 12px 40px var(--shadow);
          border-radius: 12px;
          padding: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
          cursor: pointer;
          transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .webring--collapsed {
          padding: 0.75rem;
          max-height: 2.25rem;
        }

        .webring--expanded {
          max-height: 500px;
        }

        .webring--dark {
          --glass-bg: rgba(255, 255, 255, 0.14);
          --glass-border: rgba(255, 255, 255, 0.28);
          --text: rgba(255, 255, 255, 0.92);
          --muted: rgba(255, 255, 255, 0.7);
          --shadow: rgba(0, 0, 0, 0.35);
        }

        .webring__title {
          margin: 0;
          font-size: 1.5em;
          font-weight: 600;
          text-align: center;
          transition: margin 300ms ease;
        }

        .webring--expanded .webring__title {
          margin-bottom: 0.5rem;
        }

        .webring__links {
          list-style: none;
          padding: 0;
          margin: 0;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 300ms ease, transform 300ms ease;
          pointer-events: none;
        }

        .webring--expanded .webring__links {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .webring__link-item {
          margin: 0.5rem 0;
        }

        .webring__link {
          color: var(--text);
          text-decoration: none;
          opacity: 0.85;
          transition: opacity 120ms ease;
        }

        .webring__link:hover {
          opacity: 1;
        }

        .webring__description {
          margin: 0.25rem 0 0 0;
          font-size: 0.9em;
          color: var(--muted);
        }
      </style>

      <div class="webring webring--${mode}${theme === 'dark' ? ' webring--dark' : ''}${this.expanded ? ' webring--expanded' : ' webring--collapsed'}">
        <h3 class="webring__title">🫠✒️</h3>
        <ul class="webring__links">
          ${this.data.links
            .map(
              (link) => `
            <li class="webring__link-item">
              <a href="${link.url}" class="webring__link" title="${link.description || link.name}">
                ${link.name}
              </a>
              ${
                link.description && mode === 'full'
                  ? `<p class="webring__description">${link.description}</p>`
                  : ''
              }
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;

    this.shadow.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Attach event listeners for expand/collapse
   */
  private attachEventListeners(): void {
    const webring = this.shadow.querySelector('.webring');
    if (!webring) return;

    // Click to toggle
    webring.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.render();
    });

    // Hover to expand (but not collapse)
    webring.addEventListener('mouseenter', () => {
      if (!this.expanded) {
        this.expanded = true;
        this.render();
      }
    });

    // Optional: collapse on mouse leave (comment out if you want click-to-collapse only)
    // webring.addEventListener('mouseleave', () => {
    //   if (this.expanded) {
    //     this.expanded = false;
    //     this.render();
    //   }
    // });
  }

  /**
   * Render loading state
   */
  private renderLoading(): void {
    this.shadow.innerHTML = '<div style="padding: 1rem; text-align: center;">Loading webring...</div>';
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    this.shadow.innerHTML = `<div style="padding: 1rem; color: #c33; background: #fdd; border: 1px solid #fbb; border-radius: 4px;">Error: ${message}</div>`;
  }
}

// Register the custom element
if (!customElements.get('webring-widget')) {
  customElements.define('webring-widget', WebringElement);
}

export default WebringElement;
