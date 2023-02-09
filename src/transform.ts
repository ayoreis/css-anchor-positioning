import { type StyleData } from './fetch.js';

export async function transformCSS(
  styleData: StyleData[],
  inlineStyles?: Map<HTMLElement, Record<string, string>>,
) {
  for (const { el, css, changed } of styleData) {
    if (changed) {
      if (el.tagName.toLowerCase() === 'style') {
        // Handle inline stylesheets
        el.innerHTML = css;
      } else if (el.tagName.toLowerCase() === 'link') {
        // Create new link
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        const promise = new Promise((res) => {
          link.onload = res;
        });
        el.replaceWith(link);
        // Wait for new stylesheet to be loaded
        await promise;
        URL.revokeObjectURL(url);
      } else if (el.hasAttribute('data-anchor-polyfill')) {
        // Handle inline styles
        const attr = el.getAttribute('data-anchor-polyfill');
        if (attr) {
          const pre = `[data-anchor-polyfill="${attr}"]{`;
          const post = `}`;
          let styles = css.slice(pre.length, 0 - post.length);
          // Check for custom anchor-element mapping, so it is not overwritten
          // when inline styles are updated
          const mappings = inlineStyles?.get(el);
          if (mappings) {
            for (const [key, val] of Object.entries(mappings)) {
              styles = `${key}: var(${val}); ${styles}`;
            }
          }
          el.setAttribute('style', styles);
        }
      }
    }
    // Remove no-longer-needed data-attribute
    if (el.hasAttribute('data-anchor-polyfill')) {
      el.removeAttribute('data-anchor-polyfill');
    }
  }
}
