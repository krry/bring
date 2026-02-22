import { WebringData } from "../../types/webring";
import { fetchWebringData, validateWebringData } from "./fetchWebringData";

/**
 * Web Component wrapper for the webring widget
 * Usage: <webring-widget data-source="url" size="small|medium" theme="auto"></webring-widget>
 */
class WebringElement extends HTMLElement {
  private shadow: ShadowRoot;
  private data: WebringData | null = null;
  private loading = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  static get observedAttributes(): string[] {
    return ["data-source", "size", "theme"];
  }

  async connectedCallback(): Promise<void> {
    await this.loadData();
    // Re-render on system theme change
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (this.getAttribute("theme") === "auto") this.updateTheme();
    });
  }

  async attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): Promise<void> {
    if (oldValue === newValue) return;

    if (name === "data-source") {
      this.data = null;
      await this.loadData();
    } else if (name === "size") {
      this.updateSize(newValue as "small" | "medium");
    } else if (name === "theme") {
      this.updateTheme();
    }
  }

  private async loadData(): Promise<void> {
    if (this.loading) return;
    const source = this.getAttribute("data-source");
    if (!source) return;

    this.loading = true;
    try {
      const data = await fetchWebringData(source);
      if (validateWebringData(data)) {
        this.data = data;
        this.render(); // Initial render
      }
    } catch (e) {
      console.error("Webring failed to load", e);
    } finally {
      this.loading = false;
    }
  }

  private resolveTheme(): string {
    const themeAttr = this.getAttribute("theme") || "auto";
    if (themeAttr === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return themeAttr;
  }

  private getSize(): "small" | "medium" {
    const size = this.getAttribute("size") || "small";
    return size as "small" | "medium";
  }

  private updateSize(newSize: "small" | "medium"): void {
    const widget = this.shadow.querySelector(".widget");
    if (widget) {
      widget.setAttribute("data-size", newSize);
    }
  }

  private updateTheme(): void {
    // For theme changes, we might need to re-render if we use JS-based theme logic,
    // but ideally we'd use CSS variables.
    // Since our current render uses JS for colors, we'll re-render for theme only.
    this.render();
  }

  // Site-specific color mapping for hover states
  private getLinkColor(url: string): string {
    if (url.includes("github.com")) return "#6e5494";
    if (url.includes("twitter.com") || url.includes("x.com")) return "#1da1f2";
    if (url.includes("mastodon")) return "#6364ff";
    if (url.includes("linkedin")) return "#0077b5";
    if (url.includes("youtube")) return "#ff0000";
    if (url.includes("instagram")) return "#e4405f";
    if (url.includes("strangerloops")) return "#ff6b6b";
    if (url.includes("orfx")) return "#6294DA";
    if (url.includes("nameless")) return "#F448B8";
    if (url.includes("easeness")) return "#48F4DD";
    if (url.includes("kamadhenu")) return "#A4CA0C";
    if (url.includes("inkwell")) return "#484BF4";
    if (url.includes("passage")) return "#8748F4";
    if (url.includes("dev")) return "#48F4C1";
    if (url.includes("svnr")) return "#48D2F4";
    return "#8b5cf6"; // Default purple
  }

  private render(): void {
    if (!this.data) return;

    const theme = this.resolveTheme();
    const isDark = theme === "dark";
    const initialSize = this.getSize();

    const linkStyles = this.data.links
      .map(
        (link, i) => `
      .link-${i}:hover {
        background: ${isDark ? "rgba(" : "rgba("}${parseInt(this.getLinkColor(link.url).slice(1, 3), 16)}, ${parseInt(this.getLinkColor(link.url).slice(3, 5), 16)}, ${parseInt(this.getLinkColor(link.url).slice(5, 7), 16)}, ${isDark ? "0.2" : "0.15"});
        border-left: 3px solid ${this.getLinkColor(link.url)};
        padding-left: calc(0.75em - 3px);
      }
    `,
      )
      .join("");

    const style = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&display=swap');

        :host {
          display: block;
          font-family: 'Recursive', system-ui, sans-serif;
          --glass-bg: ${isDark ? "rgba(20, 20, 20, 0.6)" : "rgba(255, 255, 255, 0.7)"};
          --glass-border: ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.5)"};
          --text: ${isDark ? "#e0e0e0" : "#1a1a1a"};
          --text-muted: ${isDark ? "#a0a0a0" : "#666"};
          --hover-bg: ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"};
          --shadow: ${isDark ? "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"};
          --spring: cubic-bezier(0.34, 1.26, 0.64, 1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
        }

        .handle {
          position: absolute;
          top: 0.39em;
          left: 0.3em;
          bottom: 0;
          right: 0;
          width: 4em;
          height: 4em;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
          color: ${isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)"};
          transform: scale(1) rotate(40deg);
        }
        
        .widget[data-size="medium"] .handle {
          width: 3.5em;
          height: 4.1em;
          transform: scale(0.8) rotate(-135deg) translate(1.4em, 0.6em);
        }

        .handle:hover {
          transform: scale(1.15) rotate(45deg);
          color: ${isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.35)"}; 
        }

        .handle:active {
          transform: scale(0.9);
        }

        .widget {
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow);
          color: var(--text);
          font-size: 0.8em;
          position: relative;
          overflow: hidden;
          will-change: width, height, border-radius;

          /* Spring Transition */
          transition: all 0.6s var(--spring);

          /* Idle Animation */
          animation: float 7s ease-in-out infinite;
        }

        /* Size Variants */
        .widget[data-size="small"] {
          width: 4em;
          height: 4em;
          border-radius: 16px;
        }

        .widget[data-size="medium"] {
          width: 112px;
          height: auto;
          min-height: 64px;
          border-radius: 20px;
        }

        .widget:hover {
          box-shadow: ${isDark ? "0 12px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)" : "0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)"};
          border-color: ${isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(255, 255, 255, 0.7)"};
          transform: translateY(-2px);
        }

        /* Logo Layout */
        .logo-container {
          display: flex;
          align-items: center;
          user-select: none;
          transition: padding 0.6s var(--spring);
        }

        .widget[data-size="medium"] .logo-container {
          padding: 1em;
          justify-content: center;
        }

        .logo-nib {
          font-size: 3em;
          line-height: 1.2;
        }
        
        .logo-text {
          font-family: 'Recursive', cursive;
          font-variation-settings: 'CASL' 0.5, 'wght' 500, 'MONO' 0;
          color: var(--text);
          text-decoration: none;
          text-indent: 1em;
          transition: opacity 0.2s ease;
        }

        .widget[data-size="small"] .logo-container {
          padding: 0.832em 1em 1em 1.32em;
        }

        .widget[data-size="small"] .logo-text {
          display: none;
        }

        .widget[data-size="medium"] .logo-text {
          display: inline-block;
        }

        .logo-link:hover .logo-text {
          opacity: 0.8;
        }

        /* Links List */
        .links {
          list-style: none;
          padding: 0;
          margin: 0;
          border-top: 1px solid var(--glass-border);
          overflow: hidden; /* For height transition */
          transition: opacity 0.4s ease;
        }

        .widget[data-size="small"] .links {
          display: none;
          opacity: 0;
        }

        .widget[data-size="medium"] .links {
          display: block;
          opacity: 1;
        }

        .links li {
          margin: 0;
          opacity: 0;
          animation: fade-in-up 0.4s var(--spring) forwards;
        }

        ${this.data.links.map((_, i) => `.links li:nth-child(${i + 1}) { animation-delay: ${0.05 * i}s; }`).join("\n        ")}

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .links a {
          display: flex;
          align-items: center;
          gap: 0.309em;
          padding: 0.618em;
          color: var(--text);
          text-decoration: none;
          font-size: 0.9em;
          font-variation-settings: 'CASL' 0.5, 'wght' 450;
          transition: all 0.3s var(--spring);
          border-left: 3px solid transparent;
        }

        .widget[data-size="medium"] .links a {
          font-size: 1em;
        }
        
        .links a span {
          transition: transform 0.2s var(--spring);
        }

        .links a:hover span:not(.link-emoji) {
          transform: translateX(2px);
        }

        .links a:active {
          transform: scale(0.97);
          transition: transform 0.1s ease;
        }

        @keyframes emoji-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .link-emoji {
          font-size: 1.1em;
          flex-shrink: 0;
          transition: transform 0.3s var(--spring);
        }

        .links a:hover .link-emoji {
          animation: emoji-bounce 0.5s var(--spring);
        }

        ${linkStyles}

        @media (hover: none) {
          .widget:hover {
            box-shadow: var(--shadow);
          }
        }
      </style>
    `;

    // Emoji mapping for common sites
    const getEmoji = (url: string): string => {
      if (url.includes("github.com")) return "🐙";
      if (url.includes("twitter.com") || url.includes("x.com")) return "🐦";
      if (url.includes("mastodon")) return "🐘";
      if (url.includes("linkedin")) return "💼";
      if (url.includes("youtube")) return "📺";
      if (url.includes("instagram")) return "📸";
      if (url.includes("strangerloops")) return "🌀";
      if (url.includes("nameless")) return "🔮";
      if (url.includes("easeness")) return "🛼";
      if (url.includes("orfx")) return "🦾";
      if (url.includes("kamadhenu")) return "🐄";
      if (url.includes("inkwell")) return "🫟";
      if (url.includes("passage")) return "⏳";
      if (url.includes("dev")) return "👨🏼‍💻";
      if (url.includes("svnr")) return "🎞️";
      return "🔗";
    };

    const linksHtml = `
      <ul class="links">
        ${this.data.links
          .map(
            (link, i) => `
          <li>
            <a href="${link.url}" class="link-${i}" title="${link.description || ""}" target="_blank">
              <span class="link-emoji">${getEmoji(link.url)}</span>
              <span>${link.name}</span>
            </a>
          </li>
        `,
          )
          .join("")}
      </ul>
    `;

    const handleSvg = `<svg width="100%" height="100%" viewBox="0 0 80.252602 81.155724" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-10.698367,-11.054825)">
        <path d="m 143.65518,206.83961 c 2.41591,10.33473 -49.397142,58.91822 -59.555232,55.8431 -10.15809,-3.07513 -26.326103,-72.23829 -18.583923,-79.49789 7.742179,-7.2596 75.723245,13.32007 78.139155,23.65479 z" transform="translate(-52.786019,-170.61192)" />
      </g>
    </svg>`;

    const html = `
      ${style}
      <div class="widget" data-size="${initialSize}">
        <div class="handle"><span class="logo-nib">✒︎</span></div>
        <div class="logo-container">
          <a href="https://kerry.ink" class="logo-link" target="_blank" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none; color: inherit;">
            <span class="logo-text">kerry.ink</span>
          </a>
        </div>
        ${linksHtml}
      </div>
    `;

    this.shadow.innerHTML = html;

    const handle = this.shadow.querySelector(".handle");

    // Add click handler for handle to cycle sizes
    handle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentSize = this.getSize();
      const nextSize =
        currentSize === "small" ? "medium" : "small";

      // Update attribute on host (which updates data-size on inner widget via attributeChangedCallback)
      this.setAttribute("size", nextSize);
    });
  }
}

if (!customElements.get("webring-widget")) {
  customElements.define("webring-widget", WebringElement);
}
