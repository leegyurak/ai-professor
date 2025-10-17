import twemoji from 'twemoji';

/**
 * Converts native emojis in an HTML element to Twitter Emoji (Twemoji) images
 * This ensures consistent emoji display across all platforms (Windows, Mac, Linux)
 */
export function parseEmojis(element: HTMLElement) {
  twemoji.parse(element, {
    folder: 'svg',
    ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
  });
}

/**
 * Initializes Twemoji for the entire document
 * Call this once when the app loads
 */
export function initTwemoji() {
  // Parse emojis immediately
  parseEmojis(document.body);

  // Watch for DOM changes and parse new content
  const observer = new MutationObserver(() => {
    parseEmojis(document.body);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return () => observer.disconnect();
}
