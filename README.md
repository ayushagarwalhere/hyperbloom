# Harborline

A mobile-first starting point for finding trusted local crisis and mental health resources. The landing page links to established public directories; it does not claim to show live shelter capacity or local availability.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The optional Harborline guide uses the `OPENROUTER_API_KEY` environment variable. Without it, the page and resource links still work and the assistant returns a clear fallback message. Keep secrets in `.env.local` or the hosting provider's secret store; do not commit them.

## Deploy on Deployxa

This is a Next.js App Router project with `build` and `start` scripts in `package.json`. The simplest path is to push the project to GitHub, connect that repository in the Deployxa dashboard, and set the project root to this folder if connecting the parent repository. Let Deployxa detect Next.js and use `npm run build` / `npm run start`.

Set `OPENROUTER_API_KEY` in Deployxa's environment variables only if the assistant should be enabled. `NEXT_PUBLIC_SITE_URL` can be set to the live site URL for the assistant's request metadata.

The Deployxa CLI currently uploads the whole working folder and does not honor an ignore file. Use the GitHub deployment flow for this project so local `node_modules`, `.next`, and environment files are not uploaded from the workspace. See the [Deployxa getting started guide](https://docs.deployxa.com/) for repository and environment setup.
