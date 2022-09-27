export interface StyleData {
  source: 'style' | string;
  css: string;
}

export function isStyleLink(link: HTMLLinkElement) {
  return Boolean(
    (link.type === 'text/css' || link.rel === 'stylesheet') && link.href,
  );
}

function getStylesheetUrl(link: HTMLLinkElement): URL | undefined {
  const srcUrl = new URL(link.href, document.baseURI);
  if (isStyleLink(link) && srcUrl.origin === location.origin) {
    return srcUrl;
  }
}

async function fetchLinkedStylesheets(
  sources: (string | URL)[],
): Promise<StyleData[]> {
  return Promise.all(
    sources.map(async (src) => {
      if (typeof src === 'string') {
        return { source: 'style', css: src };
      }
      // fetch css and push into array of strings
      const response = await fetch(src.toString());
      const css = await response.text();
      return { source: src.toString(), css };
    }),
  );
}

// Searches for all elements with inline style attributes that include 'anchor'
// For each element found, uses either the ID or classes as the selector and then format the styles in the same manner as CSS from style tags
// A list of this formatted styles is returned, if no elements found with inline styles, an empty list is returned
function fetchInlineStyles() {
  const elementsWithInlineAnchorStyles =
    document.querySelectorAll('[style*="anchor"]');
  const inlineStyles: string[] = [];
  if (elementsWithInlineAnchorStyles.length) {
    elementsWithInlineAnchorStyles.forEach((el: Element) => {
      const selector = el.id
        ? `#${el.id}`
        : `.${el.classList.value.replaceAll(' ', '.')}`;
      const styles = el.getAttribute('style');
      const formattedEl = `${selector} { ${styles} }`;
      inlineStyles.push(formattedEl);
    });
  }
  return inlineStyles;
}

export async function fetchCSS(): Promise<StyleData[]> {
  const elements = document.querySelectorAll('link, style');
  const sources: (string | URL)[] = [];

  elements.forEach((el) => {
    if (el.tagName.toLowerCase() === 'link') {
      const url = getStylesheetUrl(el as HTMLLinkElement);
      if (url) {
        sources.push(url);
      }
    }
    if (el.tagName.toLowerCase() === 'style') {
      sources.push(el.innerHTML);
    }
  });
  const inlines = fetchInlineStyles();
  inlines.length && inlines.forEach((inlineStyle) => sources.push(inlineStyle));

  return await fetchLinkedStylesheets(sources);
}
