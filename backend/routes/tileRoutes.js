import express from 'express';
import axios from 'axios';
import { ENV } from '../config/env.js';

const router = express.Router();

// In-memory cache for recent map tiles to reduce upstream latency and bandwidth
const tileCache = new Map();
const MAX_TILE_CACHE = 1000;

/**
 * Secure Backend Map Tile Proxy
 * Proxies tiles from Geoapify using ENV.GEOAPIFY_API_KEY without exposing the key to clients
 * Supports styles: osm-carto (default), osm-bright, klokantech-basic
 */
router.get('/:z/:x/:y.png', async (req, res) => {
  const { z, x, y } = req.params;
  const style = req.query.style || 'osm-carto';

  const zInt = parseInt(z, 10);
  const xInt = parseInt(x, 10);
  const yInt = parseInt(y, 10);

  if (
    isNaN(zInt) ||
    isNaN(xInt) ||
    isNaN(yInt) ||
    zInt < 0 ||
    zInt > 20 ||
    xInt < 0 ||
    yInt < 0
  ) {
    return res.status(400).send('Invalid tile coordinates');
  }

  const cacheKey = `${style}_${zInt}_${xInt}_${yInt}`;

  // Serve from cache if available
  if (tileCache.has(cacheKey)) {
    const cached = tileCache.get(cacheKey);
    res.setHeader('Content-Type', cached.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.send(cached.data);
  }

  // 1. Fetch from Geoapify using backend API key
  if (ENV.GEOAPIFY_API_KEY) {
    try {
      const geoapifyUrl = `https://maps.geoapify.com/v1/tile/${style}/${zInt}/${xInt}/${yInt}.png?apiKey=${ENV.GEOAPIFY_API_KEY}`;
      const response = await axios.get(geoapifyUrl, {
        responseType: 'arraybuffer',
        timeout: 6000,
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/png';

      // Keep cache size bounded
      if (tileCache.size >= MAX_TILE_CACHE) {
        const firstKey = tileCache.keys().next().value;
        tileCache.delete(firstKey);
      }
      tileCache.set(cacheKey, { data: buffer, contentType });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.send(buffer);
    } catch (err) {
      console.warn(
        `[Tile Proxy] Geoapify tile error at (${z}/${x}/${y}):`,
        err.response?.status || err.message
      );
    }
  }

  // 2. High-reliability fallback to OpenStreetMap standard tiles
  try {
    const osmUrl = `https://tile.openstreetmap.org/${zInt}/${xInt}/${yInt}.png`;
    const response = await axios.get(osmUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'RealTimePublicTransportTracking/1.0 (College Project)',
      },
      timeout: 6000,
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.send(buffer);
  } catch (err) {
    console.error(`[Tile Proxy] Fallback failed for (${z}/${x}/${y}):`, err.message);
    return res.status(502).send('Tile service unavailable');
  }
});

export default router;
