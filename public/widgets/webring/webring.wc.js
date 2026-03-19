"use strict";var WebringWidget=(()=>{var w=Object.defineProperty;var v=(i,a,t)=>a in i?w(i,a,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[a]=t;var l=(i,a,t)=>(v(i,typeof a!="symbol"?a+"":a,t),t);async function g(i){if(typeof i=="object"&&i!==null)return i;if(typeof i=="string"){let a=await fetch(i);if(!a.ok)throw new Error(`Failed to fetch webring data from ${i}: ${a.statusText}`);return a.json()}throw new Error("Invalid data source: must be a URL string or WebringData object")}function m(i){return typeof i=="object"&&typeof i.version=="string"&&Array.isArray(i.links)&&i.links.every(a=>typeof a.name=="string"&&typeof a.url=="string")}var d=class extends HTMLElement{constructor(){super();l(this,"shadow");l(this,"data",null);l(this,"loading",!1);this.shadow=this.attachShadow({mode:"open"})}static get observedAttributes(){return["data-source","size","theme"]}async connectedCallback(){await this.loadData(),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{this.getAttribute("theme")==="auto"&&this.updateTheme()})}async attributeChangedCallback(t,e,o){e!==o&&(t==="data-source"?(this.data=null,await this.loadData()):t==="size"?this.updateSize(o):t==="theme"&&this.updateTheme())}async loadData(){if(this.loading)return;let t=this.getAttribute("data-source");if(t){this.loading=!0;try{let e=await g(t);m(e)&&(this.data=e,this.render())}catch(e){console.error("Webring failed to load",e)}finally{this.loading=!1}}}resolveTheme(){let t=this.getAttribute("theme")||"auto";return t==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t}getSize(){return this.getAttribute("size")||"small"}updateSize(t){let e=this.shadow.querySelector(".widget");e&&e.setAttribute("data-size",t)}updateTheme(){this.render()}getLinkColor(t){if(t.color)return t.color;let e=t.url;return e.includes("github.com")?"#6e5494":e.includes("twitter.com")||e.includes("x.com")?"#1da1f2":e.includes("mastodon")?"#6364ff":e.includes("linkedin")?"#0077b5":e.includes("youtube")?"#ff0000":e.includes("instagram")?"#e4405f":e.includes("strangerloops")?"#ff6b6b":e.includes("svnr")?"#48D2F4":"#8b5cf6"}render(){if(!this.data)return;let e=this.resolveTheme()==="dark",o=this.getSize(),c=this.data.links.map((r,s)=>{let n=this.getLinkColor(r),f=parseInt(n.slice(1,3),16),u=parseInt(n.slice(3,5),16),x=parseInt(n.slice(5,7),16);return`
      .link-${s} {
        color: ${n};
      }
      .link-${s}:hover {
        background: rgba(${f}, ${u}, ${x}, ${e?"0.2":"0.15"});
        border-left: 3px solid ${n};
        padding-left: calc(0.75em - 3px);
      }
    `}).join(""),p=`
      <style>
        :host {
          display: block;
          font-family: system-ui, sans-serif;
          /* Responsive positioning \u2014 can be overridden inline */
          --widget-bottom: 2rem;
          --widget-right: 2rem;
          position: fixed;
          bottom: var(--widget-bottom);
          right: var(--widget-right);
          z-index: 1000;
          /* Mobile responsive */
          @media (max-width: 640px) {
            --widget-bottom: 1rem;
            --widget-right: 1rem;
            left: 1rem;
            right: 1rem;
          }
          --glass-bg: ${e?"rgba(20, 20, 20, 0.6)":"rgba(255, 255, 255, 0.7)"};
          --glass-border: ${e?"rgba(255, 255, 255, 0.15)":"rgba(255, 255, 255, 0.5)"};
          --text: ${e?"#e0e0e0":"#1a1a1a"};
          --text-muted: ${e?"#a0a0a0":"#666"};
          --hover-bg: ${e?"rgba(255, 255, 255, 0.05)":"rgba(0, 0, 0, 0.05)"};
          --shadow: ${e?"0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)":"0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"};
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
          color: ${e?"rgba(255, 255, 255, 0.3)":"rgba(0, 0, 0, 0.2)"};
          transform: scale(1) rotate(40deg);
        }
        
        .widget[data-size="medium"] .handle {
          width: 3.5em;
          height: 4.1em;
          transform: scale(0.8) rotate(-135deg) translate(1.4em, 0.6em);
        }

        .handle:hover {
          transform: scale(1.15) rotate(45deg);
          color: ${e?"rgba(255, 255, 255, 0.5)":"rgba(0, 0, 0, 0.35)"}; 
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(14px, 2.5vw, 16px);
          position: relative;
          overflow: hidden;
          will-change: width, height, border-radius;
          display: inline-block;
          width: fit-content;
          min-width: 180px;
          max-width: 100%;
          box-sizing: border-box;
          border-radius: 12px;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .widget:hover {
          box-shadow: ${e?"0 2px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)":"0 2px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.08)"};
        }

        /* Size Variants */
        .widget[data-size="small"] {
          width: 4em;
          height: 4em;
          border-radius: 16px;
        }

        .widget[data-size="medium"] {
          min-width: 180px;
          height: auto;
          min-height: 64px;
          border-radius: 20px;
        }

        .widget:hover {
          box-shadow: ${e?"0 12px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)":"0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)"};
          border-color: ${e?"rgba(255, 255, 255, 0.25)":"rgba(255, 255, 255, 0.7)"};
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
          font-family: system-ui, sans-serif;
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

        ${this.data.links.map((r,s)=>`.links li:nth-child(${s+1}) { animation-delay: ${.05*s}s; }`).join(`
        `)}

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
          gap: 0.5em;
          padding: 0.75em 1em;
          text-decoration: none;
          font-size: 0.9em;
          font-weight: 700;
          letter-spacing: 0.05em;
          transition: all 0.3s var(--spring);
          border-left: 3px solid transparent;
        }

        .widget[data-size="medium"] .links a {
          font-size: 1em;
          min-height: 44px; /* Ensure tap target */
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

        ${c}

        @media (hover: none) {
          .widget:hover {
            box-shadow: var(--shadow);
          }
        }
      </style>
    `,h=`
      <ul class="links">
        ${this.data.links.map((r,s)=>`
          <li>
            <a href="${r.url}" class="link-${s}" title="${r.description||""}" target="_blank">
              <span class="link-emoji">${r.emoji??"\u{1F517}"}</span>
              <span>${r.name}</span>
            </a>
          </li>
        `).join("")}
      </ul>
    `,k=`<svg width="100%" height="100%" viewBox="0 0 80.252602 81.155724" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-10.698367,-11.054825)">
        <path d="m 143.65518,206.83961 c 2.41591,10.33473 -49.397142,58.91822 -59.555232,55.8431 -10.15809,-3.07513 -26.326103,-72.23829 -18.583923,-79.49789 7.742179,-7.2596 75.723245,13.32007 78.139155,23.65479 z" transform="translate(-52.786019,-170.61192)" />
      </g>
    </svg>`,b=`
      ${p}
      <div class="widget" data-size="${o}">
        <div class="handle"><span class="logo-nib">\u2712\uFE0E</span></div>
        <div class="logo-container">
          <a href="https://kerry.ink" class="logo-link" target="_blank" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none; color: inherit;">
            <span class="logo-text">kerry.ink</span>
          </a>
        </div>
        ${h}
      </div>
    `;this.shadow.innerHTML=b,this.shadow.querySelector(".handle")?.addEventListener("click",r=>{r.stopPropagation();let n=this.getSize()==="small"?"medium":"small";this.setAttribute("size",n)})}};customElements.get("webring-widget")||customElements.define("webring-widget",d);})();
//# sourceMappingURL=webring.wc.js.map
