import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Only the public marketing page is prerendered — that is where SEO matters and
 * where a crawler must find real HTML instead of an empty SPA shell.
 *
 * Everything else is client-rendered: it sits behind a login, renders
 * per-tenant data, and has nothing worth indexing. Prerendering it would also
 * mean running guards and API calls at build time.
 *
 * Combined with `outputMode: 'static'` in angular.json, the build emits a plain
 * static site: index.html for the landing, plus the usual SPA shell for the
 * rest. No Node server to deploy.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
