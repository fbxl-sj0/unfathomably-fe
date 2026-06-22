/** Remove compatibility markup for features Soapbox supports. */
export function stripCompatibilityFeatures(html: string): string {
  const node = document.createElement('div');
  node.innerHTML = html;

  const selectors = [
    // Quote posting
    '.quote-inline',
    // Explicit mentions
    '.recipients-inline',
  ];

  // Remove all instances of all selectors
  selectors.forEach(selector => {
    node.querySelectorAll(selector).forEach(elem => {
      elem.remove();
    });
  });

  return node.innerHTML;
}

/** Convert HTML to plaintext. */
export function htmlToPlaintext(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const blockTags = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'div',
    'footer',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'li',
    'main',
    'p',
    'pre',
    'section',
  ]);

  let text = '';

  const appendBlockBreak = () => {
    if (!text || text.endsWith('\n\n')) return;
    text = text.replace(/\n*$/, '') + '\n\n';
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const tagName = node.tagName.toLowerCase();

    if (tagName === 'br') {
      text += '\n';
      return;
    }

    if (blockTags.has(tagName)) appendBlockBreak();

    node.childNodes.forEach(walk);
  };

  div.childNodes.forEach(walk);

  return text;
}
