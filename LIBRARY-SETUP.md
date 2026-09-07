# Private Library setup

The `/library` route is a private reader layered onto this public Blog repository.
No PDF, catalog, annotation, password, or storage URL is committed to Git. The
browser receives those resources only after a signed, HTTP-only session cookie is
created by the Blog API.

## One-time Vercel setup

1. In the Vercel project connected to this repository, create a **Private Vercel
   Blob** store and connect it to the project.
2. Generate a password hash and session secret locally:

   ```powershell
   npm run library:secrets -- "choose-a-long-private-password"
   ```

3. Add the two printed values to Vercel Project Settings → Environment Variables:
   `LIBRARY_PASSWORD_HASH` and `LIBRARY_SESSION_SECRET`. Apply them to Production,
   Preview, and Development as needed.
4. Pull the linked Blob token into the local Blog project with `vercel env pull
   .env.local`, or place `BLOB_READ_WRITE_TOKEN=...` in `.env.local` manually.
   `.env.local` is ignored by Git.
5. Deploy the Blog code. The navigation now includes a locked `Library` entry at
   `/library`.

## Publishing the local collection

The local library at `D:\E-Book & Resource` has a **发布到 Blog** action in its Git
dialog. It runs this project's `scripts/publish-library.mjs` script. The first run
uploads every active file to Private Blob; later runs compare file size and exact
modification time, and upload only new or changed files. A local manifest is kept
at `library/publish-manifest.json` in the e-book repository.

You can also publish from a terminal:

```powershell
npm run library:publish -- --source "D:\E-Book & Resource"
```

The remote catalog includes the local metadata and current annotations at publish
time. Moving, archiving, and metadata editing remain local-first operations; run a
new publish after those changes to refresh the private Blog reader.
