import { safeatob } from "@web3auth/auth";

/**
 * Extracts a name for the site from the DOM
 */
export const getSiteName = (window: Window) => {
  const { document } = window;

  const siteName = document.querySelector<HTMLMetaElement>('head > meta[property="og:site_name"]');
  if (siteName) {
    return siteName.content;
  }

  const metaTitle = document.querySelector<HTMLMetaElement>('head > meta[name="title"]');
  if (metaTitle) {
    return metaTitle.content;
  }

  if (document.title && document.title.length > 0) {
    return document.title;
  }

  return window.location.hostname;
};

/**
 * Returns whether the given image URL exists
 * @param url - the url of the image
 * @returns - whether the image exists
 */
function imgExists(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const img = document.createElement("img");
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Extracts an icon for the site from the DOM
 */
export async function getSiteIcon(window: Window): Promise<string | null> {
  const { document } = window;

  // Use the site's favicon if it exists
  let icon = document.querySelector<HTMLLinkElement>('head > link[rel="shortcut icon"]');
  if (icon && (await imgExists(icon.href))) {
    return icon.href;
  }

  // Search through available icons in no particular order
  icon = Array.from(document.querySelectorAll<HTMLLinkElement>('head > link[rel="icon"]')).find((_icon) => Boolean(_icon.href)) || null;
  if (icon && (await imgExists(icon.href))) {
    return icon.href;
  }

  return null;
}

export function parseToken<T>(token: string): { header: { alg: string; typ: string; kid?: string }; payload: T } {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(safeatob(header)),
    payload: JSON.parse(safeatob(payload)) as T,
  };
}
