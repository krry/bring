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
   * Main render method
   */
  private render(): void {
    const mode = this.getAttribute('mode') || 'compact';
    const theme = this.getAttribute('theme') || 'auto';

    if (!this.data) {
      return;
    }

    const html = `
      <style>
        :host {
          --webring-text-color: #333;
          --webring-bg-color: #fff;
          --webring-link-color: #0066cc;
          --webring-border-color: #ddd;
        }

        :host([theme="dark"]) {
          --webring-text-color: #eee;
          --webring-bg-color: #222;
          --webring-link-color: #66b3ff;
          --webring-border-color: #444;
        }

        .webring {
          color: var(--webring-text-color);
          background: var(--webring-bg-color);
          border: 1px solid var(--webring-border-color);
          border-radius: 4px;
          padding: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .webring__title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1em;
          font-weight: 600;
        }

        .webring__links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .webring__link-item {
          margin: 0.5rem 0;
        }

        .webring__link {
          color: var(--webring-link-color);
          text-decoration: none;
        }

        .webring__link:hover {
          text-decoration: underline;
        }

        .webring__description {
          margin: 0.25rem 0 0 0;
          font-size: 0.9em;
          opacity: 0.7;
        }
      </style>

      <div class="webring webring--${mode} webring--theme-${theme}">
        <h3 class="webring__title">Webring</h3>
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
