# Deploying to Coolify — ansarulkabir.work

The app ships as one Docker image (see `Dockerfile`). Coolify builds it from
GitHub, runs it, and puts it behind HTTPS. MongoDB lives in Atlas; uploads
live in the Cloudflare R2 bucket `portfolio`.

The build never touches the database, so only two **non-secret** values are
needed at build time. Everything secret is runtime-only and never baked into
the image.

---

## 1. Before the first deploy

### Rotate credentials

- [ ] **Atlas:** Database Access → edit the `ansarulsohan` user → new password.
      Update `MONGODB_URI` in `.env.local` too.
- [ ] **Admin password:** sign in at `/admin` → Settings → Change password
      (at least 12 characters). This also signs out other devices.

### Atlas network access

- [ ] Atlas → Network Access → **Add IP Address** → your Coolify server's
      public IP (`curl -4 ifconfig.me` on the server). Avoid `0.0.0.0/0`.

### Cloudflare R2 (`portfolio` bucket)

- [ ] **Public access:** Settings → Public access → **Custom domain** →
      `cdn.ansarulkabir.work` (requires the domain's DNS on Cloudflare). If DNS isn't
      on Cloudflare, use the `r2.dev` URL instead (rate-limited; fine to start).
- [ ] **CORS:** Settings → CORS policy → paste:

  ```json
  [
    {
      "AllowedOrigins": ["https://ansarulkabir.work", "http://localhost:3000"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```

  The app's R2 token is object read/write only, so CORS can't be set from code.

### DNS

- [ ] An **A record** for `ansarulkabir.work` (and optionally `www`) pointing at
      the Coolify server's IP.

---

## 2. Create the app in Coolify

1. **New resource → Public/Private repository** → `ansarulSohan/portfolio`, branch
   `master` (after merging `rebuild/nextjs`), or `rebuild/nextjs` to try it first.
2. **Build pack:** `Dockerfile`. Dockerfile location `/Dockerfile`, base directory `/`.
3. **Ports exposed:** `3000`.
4. **Domains:** `https://ansarulkabir.work` (add `https://www.ansarulkabir.work`
   with a redirect if you want `www`). Coolify gets the Let's Encrypt certificate.
5. **Health check:** enable, path `/api/health`, port `3000`. It returns 200 when
   MongoDB is reachable, 503 when not. The image also has its own `HEALTHCHECK`.

### Environment variables

In Coolify → Environment Variables. **Build variable** = tick "Build Variable"
(available while building). Everything else stays runtime-only.

| Variable               | Value                                                                                                | Build variable?      | Secret? |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- | ------- |
| `NEXT_PUBLIC_SITE_URL` | `https://ansarulkabir.work`                                                                          | ✅ yes               | no      |
| `S3_PUBLIC_URL`        | `https://cdn.ansarulkabir.work` (or the r2.dev URL)                                                  | ✅ yes (and runtime) | no      |
| `MONGODB_URI`          | `mongodb+srv://<user>:<password>@cluster0.v3tzfuw.mongodb.net/portfolio?retryWrites=true&w=majority` | ❌ runtime only      | **yes** |
| `AUTH_SECRET`          | new value from `openssl rand -base64 32` (**not** the local one)                                     | ❌ runtime only      | **yes** |
| `S3_ENDPOINT`          | `https://<account-id>.r2.cloudflarestorage.com`                                                      | ❌ runtime only      | no      |
| `S3_REGION`            | `auto`                                                                                               | ❌ runtime only      | no      |
| `S3_BUCKET`            | `portfolio`                                                                                          | ❌ runtime only      | no      |
| `S3_ACCESS_KEY_ID`     | R2 token access key                                                                                  | ❌ runtime only      | **yes** |
| `S3_SECRET_ACCESS_KEY` | R2 token secret                                                                                      | ❌ runtime only      | **yes** |

`ADMIN_EMAIL` / `ADMIN_PASSWORD` are **not** needed in production: the admin
already exists in the `portfolio` database (they're only read by `pnpm seed`).

Why two are build variables: `NEXT_PUBLIC_*` values and `next/image` allowed
hosts are fixed when the app is built. If you change either, **redeploy** (rebuild).

---

## 3. Deploy and verify

1. Click **Deploy** and watch the build log (≈2–4 minutes).
2. Check:
   - [ ] `https://ansarulkabir.work/api/health` → `{"status":"ok","db":"up"}`
   - [ ] Home page shows your content; light/dark toggle works
   - [ ] `https://ansarulkabir.work/sitemap.xml` lists `https://ansarulkabir.work/...` URLs
   - [ ] Sign in at `/admin`; upload a profile photo (tests R2 CORS + public URL)
   - [ ] Send yourself a message from the contact form; it appears in Admin → Messages
   - [ ] Response headers include `Content-Security-Policy` and `Strict-Transport-Security`
3. Optional: run Lighthouse (mobile) and submit the sitemap in Google Search Console.

## 4. Updating later

Push to the deployed branch → Coolify rebuilds (enable "Auto deploy" on the
resource, or press Deploy). Content changes never need a deploy: edit in `/admin`.

## Troubleshooting

| Symptom                                                        | Likely cause                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| `/api/health` 503, log says "MONGODB_URI is not set"           | Variable missing or marked build-only                         |
| `/api/health` 503 with a timeout / `MongoServerSelectionError` | Coolify server IP not in Atlas Network Access                 |
| Upload fails: "Couldn't reach the storage bucket"              | R2 CORS missing `https://ansarulkabir.work`                   |
| Uploaded image doesn't show / `next/image` error about host    | `S3_PUBLIC_URL` wasn't a build variable → set it and redeploy |
| Everyone gets logged out after a deploy                        | `AUTH_SECRET` changed (expected only if you rotated it)       |
| Build fails fetching Google Fonts                              | Build server has no outbound internet                         |

---

## Recommended: separate dev and production data

`.env.local` currently points at the same `portfolio` database the live site
will use, so local experiments edit live content. Consider pointing local dev
at `.../portfolio_dev` and running `pnpm seed` once to fill it. (E2E tests
already use their own throwaway `portfolio_e2e` database.)
