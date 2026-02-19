"use strict";var WebringWidget=(()=>{var o=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var c=Object.prototype.hasOwnProperty;var m=(r,t,e)=>t in r?o(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var p=(r,t)=>{for(var e in t)o(r,e,{get:t[e],enumerable:!0})},u=(r,t,e,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of h(t))!c.call(r,i)&&i!==e&&o(r,i,{get:()=>t[i],enumerable:!(a=b(t,i))||a.enumerable});return r};var w=r=>u(o({},"__esModule",{value:!0}),r);var s=(r,t,e)=>(m(r,typeof t!="symbol"?t+"":t,e),e);var v={};p(v,{default:()=>f});async function g(r){if(typeof r=="object"&&r!==null)return r;if(typeof r=="string"){let t=await fetch(r);if(!t.ok)throw new Error(`Failed to fetch webring data from ${r}: ${t.statusText}`);return t.json()}throw new Error("Invalid data source: must be a URL string or WebringData object")}function l(r){return typeof r=="object"&&typeof r.version=="string"&&Array.isArray(r.links)&&r.links.every(t=>typeof t.name=="string"&&typeof t.url=="string")}var d=class extends HTMLElement{constructor(){super();s(this,"shadow");s(this,"data",null);s(this,"loading",!1);s(this,"expanded",!1);this.shadow=this.attachShadow({mode:"open"})}static get observedAttributes(){return["data-source","mode","theme"]}async connectedCallback(){this.render(),await this.loadData(),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{this.getAttribute("theme")==="auto"&&this.render()})}async attributeChangedCallback(e,a,i){e==="data-source"?(this.data=null,await this.loadData(),this.render()):this.render()}async loadData(){if(this.loading)return;let e=this.getAttribute("data-source");if(!e){this.renderError("No data-source attribute provided");return}this.loading=!0,this.renderLoading();try{if(this.data=await g(e),!l(this.data)){this.renderError("Invalid webring data format");return}this.render()}catch(a){let i=a instanceof Error?a.message:"Failed to load webring data";this.renderError(i)}finally{this.loading=!1}}resolveTheme(){let e=this.getAttribute("theme")||"auto";return e==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e}render(){let e=this.getAttribute("mode")||"compact",a=this.resolveTheme();if(!this.data)return;let i=`
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

      <div class="webring webring--${e}${a==="dark"?" webring--dark":""}${this.expanded?" webring--expanded":" webring--collapsed"}">
        <h3 class="webring__title">\u{1FAE0}\u2712\uFE0F</h3>
        <ul class="webring__links">
          ${this.data.links.map(n=>`
            <li class="webring__link-item">
              <a href="${n.url}" class="webring__link" title="${n.description||n.name}">
                ${n.name}
              </a>
              ${n.description&&e==="full"?`<p class="webring__description">${n.description}</p>`:""}
            </li>
          `).join("")}
        </ul>
      </div>
    `;this.shadow.innerHTML=i,this.attachEventListeners()}attachEventListeners(){let e=this.shadow.querySelector(".webring");e&&(e.addEventListener("click",()=>{this.expanded=!this.expanded,this.render()}),e.addEventListener("mouseenter",()=>{this.expanded||(this.expanded=!0,this.render())}))}renderLoading(){this.shadow.innerHTML='<div style="padding: 1rem; text-align: center;">Loading webring...</div>'}renderError(e){this.shadow.innerHTML=`<div style="padding: 1rem; color: #c33; background: #fdd; border: 1px solid #fbb; border-radius: 4px;">Error: ${e}</div>`}};customElements.get("webring-widget")||customElements.define("webring-widget",d);var f=d;return w(v);})();
//# sourceMappingURL=webring.wc.js.map
