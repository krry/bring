"use strict";var WebringWidget=(()=>{var b=Object.defineProperty;var v=(a,s,e)=>s in a?b(a,s,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[s]=e;var o=(a,s,e)=>(v(a,typeof s!="symbol"?s+"":s,e),e);async function d(a){if(typeof a=="object"&&a!==null)return a;if(typeof a=="string"){let s=await fetch(a);if(!s.ok)throw new Error(`Failed to fetch webring data from ${a}: ${s.statusText}`);return s.json()}throw new Error("Invalid data source: must be a URL string or WebringData object")}function g(a){return typeof a=="object"&&typeof a.version=="string"&&Array.isArray(a.links)&&a.links.every(s=>typeof s.name=="string"&&typeof s.url=="string")}var l=class extends HTMLElement{constructor(){super();o(this,"shadow");o(this,"data",null);o(this,"loading",!1);this.shadow=this.attachShadow({mode:"open"})}static get observedAttributes(){return["data-source","size","theme"]}async connectedCallback(){await this.loadData(),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{this.getAttribute("theme")==="auto"&&this.updateTheme()})}async attributeChangedCallback(e,i,n){i!==n&&(e==="data-source"?(this.data=null,await this.loadData()):e==="size"?this.updateSize(n):e==="theme"&&this.updateTheme())}async loadData(){if(this.loading)return;let e=this.getAttribute("data-source");if(e){this.loading=!0;try{let i=await d(e);g(i)&&(this.data=i,this.render())}catch(i){console.error("Webring failed to load",i)}finally{this.loading=!1}}}resolveTheme(){let e=this.getAttribute("theme")||"auto";return e==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e}getSize(){return this.getAttribute("size")||"small"}updateSize(e){let i=this.shadow.querySelector(".widget");i&&i.setAttribute("data-size",e)}updateTheme(){this.render()}getLinkColor(e){return e.includes("github.com")?"#6e5494":e.includes("twitter.com")||e.includes("x.com")?"#1da1f2":e.includes("mastodon")?"#6364ff":e.includes("linkedin")?"#0077b5":e.includes("youtube")?"#ff0000":e.includes("instagram")?"#e4405f":e.includes("strangerloops")?"#ff6b6b":e.includes("orfx")?"#6294DA":e.includes("nameless")?"#F448B8":e.includes("easeness")?"#48F4DD":e.includes("kamadhenu")?"#A4CA0C":e.includes("inkwell")?"#484BF4":e.includes("passage")?"#8748F4":e.includes("dev")?"#48F4C1":e.includes("svnr")?"#48D2F4":"#8b5cf6"}render(){if(!this.data)return;let i=this.resolveTheme()==="dark",n=this.getSize(),c=this.data.links.map((t,r)=>`
      .link-${r}:hover {
        background: rgba(${parseInt(this.getLinkColor(t.url).slice(1,3),16)}, ${parseInt(this.getLinkColor(t.url).slice(3,5),16)}, ${parseInt(this.getLinkColor(t.url).slice(5,7),16)}, ${i?"0.2":"0.15"});
        border-left: 3px solid ${this.getLinkColor(t.url)};
        padding-left: calc(0.75em - 3px);
      }
    `).join(""),m=`
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&display=swap');

        :host {
          display: block;
          font-family: 'Recursive', system-ui, sans-serif;
          --glass-bg: ${i?"rgba(20, 20, 20, 0.6)":"rgba(255, 255, 255, 0.7)"};
          --glass-border: ${i?"rgba(255, 255, 255, 0.15)":"rgba(255, 255, 255, 0.5)"};
          --text: ${i?"#e0e0e0":"#1a1a1a"};
          --text-muted: ${i?"#a0a0a0":"#666"};
          --hover-bg: ${i?"rgba(255, 255, 255, 0.05)":"rgba(0, 0, 0, 0.05)"};
          --shadow: ${i?"0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)":"0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)"};
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
          color: ${i?"rgba(255, 255, 255, 0.3)":"rgba(0, 0, 0, 0.2)"};
          transform: scale(1) rotate(40deg);
        }
        
        .widget[data-size="medium"] .handle {
          width: 3.5em;
          height: 4.1em;
          transform: scale(0.8) rotate(-135deg) translate(1.4em, 0.6em);
        }

        .handle:hover {
          transform: scale(1.15) rotate(45deg);
          color: ${i?"rgba(255, 255, 255, 0.5)":"rgba(0, 0, 0, 0.35)"}; 
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
          box-shadow: ${i?"0 12px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)":"0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)"};
          border-color: ${i?"rgba(255, 255, 255, 0.25)":"rgba(255, 255, 255, 0.7)"};
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

        ${this.data.links.map((t,r)=>`.links li:nth-child(${r+1}) { animation-delay: ${.05*r}s; }`).join(`
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

        ${c}

        @media (hover: none) {
          .widget:hover {
            box-shadow: var(--shadow);
          }
        }
      </style>
    `,h=t=>t.includes("github.com")?"\u{1F419}":t.includes("twitter.com")||t.includes("x.com")?"\u{1F426}":t.includes("mastodon")?"\u{1F418}":t.includes("linkedin")?"\u{1F4BC}":t.includes("youtube")?"\u{1F4FA}":t.includes("instagram")?"\u{1F4F8}":t.includes("strangerloops")?"\u{1F300}":t.includes("nameless")?"\u{1F52E}":t.includes("easeness")?"\u{1F6FC}":t.includes("orfx")?"\u{1F9BE}":t.includes("kamadhenu")?"\u{1F404}":t.includes("inkwell")?"\u{1FADF}":t.includes("passage")?"\u23F3":t.includes("dev")?"\u{1F468}\u{1F3FC}\u200D\u{1F4BB}":t.includes("svnr")?"\u{1F39E}\uFE0F":"\u{1F517}",p=`
      <ul class="links">
        ${this.data.links.map((t,r)=>`
          <li>
            <a href="${t.url}" class="link-${r}" title="${t.description||""}" target="_blank">
              <span class="link-emoji">${h(t.url)}</span>
              <span>${t.name}</span>
            </a>
          </li>
        `).join("")}
      </ul>
    `,w=`<svg width="100%" height="100%" viewBox="0 0 80.252602 81.155724" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-10.698367,-11.054825)">
        <path d="m 143.65518,206.83961 c 2.41591,10.33473 -49.397142,58.91822 -59.555232,55.8431 -10.15809,-3.07513 -26.326103,-72.23829 -18.583923,-79.49789 7.742179,-7.2596 75.723245,13.32007 78.139155,23.65479 z" transform="translate(-52.786019,-170.61192)" />
      </g>
    </svg>`,f=`
      ${m}
      <div class="widget" data-size="${n}">
        <div class="handle"><span class="logo-nib">\u2712\uFE0E</span></div>
        <div class="logo-container">
          <a href="https://kerry.ink" class="logo-link" target="_blank" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none; color: inherit;">
            <span class="logo-text">kerry.ink</span>
          </a>
        </div>
        ${p}
      </div>
    `;this.shadow.innerHTML=f,this.shadow.querySelector(".handle")?.addEventListener("click",t=>{t.stopPropagation();let u=this.getSize()==="small"?"medium":"small";this.setAttribute("size",u)})}};customElements.get("webring-widget")||customElements.define("webring-widget",l);})();
//# sourceMappingURL=webring.wc.js.map
