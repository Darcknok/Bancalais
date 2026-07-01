/**
 * LiveFFN Module - Barrel export
 * 
 * This module provides a complete scraping and caching layer for liveffn.com,
 * the official FFN (Fédération Française de Natation) competition results platform.
 * 
 * Architecture:
 *   fetcher.ts  → HTTP requests to LiveFFN
 *   parser.ts   → HTML → structured data
 *   cache.ts    → In-memory TTL cache
 *   routes.ts   → Express API routes
 *   types.ts    → TypeScript type definitions
 */

export * from './types';
export * from './fetcher';
export * from './parser';
export * from './cache';
export * from './persistence';
export { liveffnRouter } from './routes';
