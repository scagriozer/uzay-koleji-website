import { defineLive } from 'next-sanity/live';
import { client } from './client';

const token = process.env.SANITY_API_READ_TOKEN;

// browserToken verilmez: token tarayıcıya gitmez.
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
});
