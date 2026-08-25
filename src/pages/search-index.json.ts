import type { APIRoute } from 'astro';
import { buildSearchDocs } from '@data/index';

/**
 * The client search index, emitted as a static JSON file at build time.
 *
 * This is the only "API" the site has, and it is a flat file — there is no
 * server. It is fetched once, on first search interaction, and cached.
 */
export const GET: APIRoute = () => {
  const docs = buildSearchDocs();
  return new Response(JSON.stringify(docs), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
};

export const prerender = true;
