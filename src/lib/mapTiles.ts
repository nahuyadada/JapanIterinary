/**
 * Keyless raster tiles with Latin-script labels. CARTO's basemaps now answer anonymous
 * requests with an "API KEY REQUIRED" placeholder, and OpenStreetMap's own tiles label
 * Japan in Japanese only.
 */
export const TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

export const TILE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
