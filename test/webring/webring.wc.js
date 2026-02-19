"use strict";var WebringWidget=(()=>{var o=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var c=Object.getOwnPropertyNames;var h=Object.prototype.hasOwnProperty;var m=(e,r,t)=>r in e?o(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var w=(e,r)=>{for(var t in r)o(e,t,{get:r[t],enumerable:!0})},f=(e,r,t,n)=>{if(r&&typeof r=="object"||typeof r=="function")for(let i of c(r))!h.call(e,i)&&i!==t&&o(e,i,{get:()=>r[i],enumerable:!(n=b(r,i))||n.enumerable});return e};var p=e=>f(o({},"__esModule",{value:!0}),e);var s=(e,r,t)=>(m(e,typeof r!="symbol"?r+"":r,t),t);var v={};w(v,{default:()=>u});async function l(e){if(typeof e=="object"&&e!==null)return e;if(typeof e=="string"){let r=await fetch(e);if(!r.ok)throw new Error(`Failed to fetch webring data from ${e}: ${r.statusText}`);return r.json()}throw new Error("Invalid data source: must be a URL string or WebringData object")}function g(e){return typeof e=="object"&&typeof e.version=="string"&&Array.isArray(e.links)&&e.links.every(r=>typeof r.name=="string"&&typeof r.url=="string")}var d=class extends HTMLElement{constructor(){super();s(this,"shadow");s(this,"data",null);s(this,"loading",!1);this.shadow=this.attachShadow({mode:"open"})}static get observedAttributes(){return["data-source","mode","theme"]}async connectedCallback(){this.render(),await this.loadData()}async attributeChangedCallback(t,n,i){t==="data-source"?(this.data=null,await this.loadData(),this.render()):this.render()}async loadData(){if(this.loading)return;let t=this.getAttribute("data-source");if(!t){this.renderError("No data-source attribute provided");return}this.loading=!0,this.renderLoading();try{if(this.data=await l(t),!g(this.data)){this.renderError("Invalid webring data format");return}this.render()}catch(n){let i=n instanceof Error?n.message:"Failed to load webring data";this.renderError(i)}finally{this.loading=!1}}render(){let t=this.getAttribute("mode")||"compact",n=this.getAttribute("theme")||"auto";if(!this.data)return;let i=`
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

      <div class="webring webring--${t} webring--theme-${n}">
        <h3 class="webring__title">Webring</h3>
        <ul class="webring__links">
          ${this.data.links.map(a=>`
            <li class="webring__link-item">
              <a href="${a.url}" class="webring__link" title="${a.description||a.name}">
                ${a.name}
              </a>
              ${a.description&&t==="full"?`<p class="webring__description">${a.description}</p>`:""}
            </li>
          `).join("")}
        </ul>
      </div>
    `;this.shadow.innerHTML=i}renderLoading(){this.shadow.innerHTML='<div style="padding: 1rem; text-align: center;">Loading webring...</div>'}renderError(t){this.shadow.innerHTML=`<div style="padding: 1rem; color: #c33; background: #fdd; border: 1px solid #fbb; border-radius: 4px;">Error: ${t}</div>`}};customElements.get("webring-widget")||customElements.define("webring-widget",d);var u=d;return p(v);})();
//# sourceMappingURL=webring.wc.js.map
