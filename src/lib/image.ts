/** Wikimedia only serves thumbnails at its standard widths; anything else is rejected. */
export type ThumbWidth = 250 | 500 | 960;

const WIKIMEDIA = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/(thumb\/)?([0-9a-f]\/[0-9a-f]{2})\/([^/]+)(?:\/[^/]+)?$/;

/**
 * A Wikimedia-hosted image scaled down to `width`, so a 96px card doesn't download a
 * multi-megabyte original. Any other URL is returned untouched.
 */
export function thumbUrl(url: string, width: ThumbWidth): string {
  const m = WIKIMEDIA.exec(url);
  if (!m) return url;
  const [, base, , hash, file] = m;
  if (!/\.(jpe?g|png)$/i.test(file)) return url;
  return `${base}/thumb/${hash}/${file}/${width}px-${file}`;
}
