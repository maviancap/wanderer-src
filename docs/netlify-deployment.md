# Netlify deployment

The root `netlify.toml` builds the Next.js application in `frontend` and publishes
its `.next` output through Netlify's Next.js adapter. Publishing the repository
itself does not serve the application and results in Netlify's default 404 page.

The deployment command first runs `npm ci --include=dev` in `frontend` so CLI
deployments also install the locked dependencies before invoking Next.js.
Development dependencies are included because the Next.js configuration uses
the bundle analyzer package during builds.

The preparation step supplies `frontend/config.json` from `config.example.json`
when no custom configuration exists. Existing configuration is preserved. The
runtime configuration is included in the server output for API routes that read
it from disk.

The example configuration is a starting point for rendering the frontend. The
separate API, game services, and their infrastructure still need to be hosted
and configured for accounts and gameplay to work. Set the frontend's backend
URLs and options for your own services before enabling those features.
