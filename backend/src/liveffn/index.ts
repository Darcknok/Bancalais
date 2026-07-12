/**
 * Module LiveFFN — Export barrel (réexportation).
 *
 * Ce module fournit une couche complète de scraping et cache pour liveffn.com,
 * la plateforme officielle de résultats de compétitions de la FFN
 * (Fédération Française de Natation).
 *
 * Architecture :
 *   fetcher.ts    → Requêtes HTTP vers LiveFFN
 *   parser.ts     → Parsing HTML → données structurées
 *   cache.ts      → Cache mémoire avec TTL
 *   persistence.ts → Sauvegarde/lecture en base PostgreSQL
 *   routes.ts     → Routes API Express
 *   types.ts      → Définitions de types TypeScript
 */

export * from './types';
export * from './fetcher';
export * from './parser';
export * from './cache';
export * from './persistence';
export { liveffnRouter } from './routes';
