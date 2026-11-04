# Norwegian (Bokmål) version — plan

Status: **proposed**, not started.

## Goal

Publish the portfolio in **Norwegian Bokmål** alongside English.

- **Same content in both languages:** a visitor can switch between them on any page and stay on that page.
- **Search engines:** each language has its own URLs and is indexed separately.
- **Admin:** all content can be edited in both languages. Admin pages themselves stay in English.
- **Gradual translation:** anything not yet translated falls back to English, so the Norwegian site is never broken or empty.

## Decisions

| Question            | Decision                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Languages           | `en` (default) and `nb` (Bokmål). Nynorsk is out of scope.                                                                                                                                                                                   |
| URL scheme          | English is unprefixed (`/`, `/projects/x`); Norwegian lives under `/no` (`/no`, `/no/projects/x`). This keeps existing English URLs unchanged.                                                                                               |
| `lang` attribute    | `<html lang="nb">` on Norwegian pages, `lang="en"` otherwise. Content still in English on a Norwegian page is marked `lang="en"` (see §4).                                                                                                   |
| Language detection  | Only on a visitor's first visit to `/`: if `Accept-Language` prefers `nb`/`no`/`nn` and there's no `lang` cookie, redirect to `/no`. After that, the visitor's choice, saved in a cookie, always wins. Search crawlers are never redirected. |
| Slugs               | Shared between languages (`/projects/x` and `/no/projects/x`). Translated slugs aren't worth the complexity.                                                                                                                                 |
| Translation library | None. Two typed dictionaries plus a small `t()` helper are enough for a site this size.                                                                                                                                                      |
| Who translates      | Claude drafts the Norwegian text; the owner reviews it in the admin before publishing.                                                                                                                                                       |

## 1. Routing

Read before coding: `node_modules/next/dist/docs/01-app/02-guides/internationalization.md` and the `next/root-params` reference. Next 16 APIs differ from older versions.

- Move `src/app/(site)/*` under a dynamic segment, `src/app/[lang]/(site)/*`. Use `generateStaticParams` to return `en` and `nb` so the static shell is still built for both.
- The URL keeps a clean English path through a proxy rewrite (not a redirect):
  - an unprefixed path is rewritten internally to `/en/...`;
  - `/no/...` is rewritten to `/nb/...`;
  - visiting `/en/...` directly 308-redirects to the unprefixed path, so each page has only one English URL.
- **Root layout:** it currently hardcodes `lang="en"`. It must read the language with `rootParams` (or move under `[lang]`) so `<html lang>` is correct before paint. The prefs script, fonts and `PrefsProvider` stay unchanged.
- `src/proxy.ts` already runs on every page route. Add the rewrite, redirect and detection steps there, before the CSP and admin logic. `/admin`, `/api` and `/resume` are left alone (see §6 for the résumé).
- `not-found.tsx` and `error.tsx` need a version in each language.
- `src/lib/i18n/config.ts` holds `LOCALES`, `DEFAULT_LOCALE`, `localePath(locale, path)` and the `en ↔ /`, `nb ↔ /no` mapping. It is the single source used by the proxy, links, sitemap and metadata.

## 2. Interface text

These are strings in the code, not content from the database: navigation (`components/site/nav.ts`), section titles and descriptions, buttons ("View project", "Résumé", "Contact"), the contact form's labels, help text, success and error messages, the zod error messages shown to visitors, the accessibility menu, the theme toggle, the footer, the skip link, and the 404 and error pages.

- `src/lib/i18n/dictionaries/en.ts` is the source of truth; `nb.ts` is typed `satisfies Dictionary`, so a missing key is a type error.
- `getDictionary(locale)` is used in server components. Client components (`ContactForm`, `AccessibilityMenu`, `MobileNav`) receive the strings they need as props, which keeps the dictionaries out of the client bundle.
- **Contact form errors:** the server action takes the visitor's language and returns error messages in that language. The zod schema stays one definition; only the messages are mapped.
- **Dates:** `formatMonth`/`formatRange` take a language and use `Intl.DateTimeFormat`. "Present" becomes "nå", so the output reads "mars 2023 – nå". Skill levels ("familiar", "proficient", "expert") become "kjent", "god" and "ekspert".
- **Header switch:** an `EN | NO` control linking to the same path in the other language, with the `hreflang` attribute and `lang` attributes on the labels. Choosing a language sets the `lang` cookie, which stops future redirects.

## 3. Content model (MongoDB)

**Approach: translatable fields.** Each text field becomes `{ en: string, nb?: string }`. Only text a visitor reads is translated; everything else stays shared.

| Model         | Translated                                                                        | Shared                                                                           |
| ------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Profile       | `title`, `tagline`, `location`, `bio`, `values[]`, `seo.title`, `seo.description` | `name`, `email`, `socials`, `avatar`, `resume` (see §6)                          |
| Project       | `title`, `summary`, `body`, `role`, image `alt` (cover and gallery)               | `slug`, `tech`, `tags`, `links`, dates, `featured`, `published`, `order`         |
| Experience    | `role`, `location`, `highlights[]`                                                | `company`, `companyUrl`, dates, `tech`, `order`                                  |
| Education     | `degree`, `location`, `notes`                                                     | `institution`, dates, `order`                                                    |
| SkillCategory | category `name`                                                                   | item names (technology names), `level` (label translated through the dictionary) |

Implementation:

- **Validation:** a `localized(schema)` helper in `lib/validation/common.ts` returns `z.object({ en: schema, nb: schema.optional() })`. `en` keeps today's rules (required stays required); `nb` is always optional. String lists such as `highlights` and `values` become `{ en: string[], nb?: string[] }`.
- **Models:** a shared `localizedString` sub-schema in `models/shared.ts`.
- **DTOs:** the `lib/dto.ts` mappers take a language and resolve each field to a plain string: `nb ?? en`. They also return a `fallback` flag per field, so the page can mark English text with `lang="en"` (§4). Public components keep receiving plain strings and barely change.
- **Queries and caching:** every public query in `lib/queries.ts` takes `locale` as a cached-function argument, so each language gets its own cache entry. The tags in `lib/cache-tags.ts` stay the same, so one `updateTag()` after an admin save refreshes both languages.
- **Migration:** `scripts/migrate-i18n.ts` (idempotent, with a `--dry-run` option) wraps every existing string as `{ en: <value> }`. Run it against `portfolio_dev` first, then production, and **deploy the new code immediately after**, because old code can't read the new shape. The seed script and `legacy-portfolio.ts` are updated to write the new shape.
- **Search:** `ProjectBrowser`'s search filters on the resolved strings for the current language.

## 4. Accessibility

- Every page has the correct `<html lang>`, so screen readers use Norwegian pronunciation.
- Fallback English text on a Norwegian page is wrapped in an element with `lang="en"`, as WCAG 3.1.2 (Language of Parts) requires.
- The language switch is a list of real links rather than a select box. Each link's label is in its own language ("English", "Norsk"), and the current one has `aria-current="true"`.
- The accessibility menu, skip link and form errors are translated.
- The axe tests run against `/no` in light, dark and high-contrast modes too.

## 5. Admin

Admin pages stay in English; only the content gets a second language.

- `components/admin/fields.tsx` gets a `LocalizedField` wrapper that shows **English | Norsk** tabs over any text, textarea, markdown or list field, using Radix tabs for keyboard support. The Norsk tab shows a "Not translated — English will be shown" hint and a dot marker while it's empty.
- Editor forms send `{ en, nb }` objects. `toUpdate()` must handle nested language keys, so that clearing `nb` unsets `field.nb` without touching `field.en`.
- The dashboard gets a "Translation" card listing items with missing Norwegian fields, with links to each one.
- Optional: a "Draft Norwegian" button that pre-fills empty `nb` fields from a translation API for review. This is out of scope for the first version, since the drafts can also be pasted in by hand.

## 6. Résumé, SEO and sharing

- **Résumé:** optional `resume.nb` upload. `/resume` serves the English PDF; `/no/resume` serves the Norwegian one, falling back to English.
- **Metadata:** `generateMetadata` uses the visitor's language for the title and description, with `alternates.languages` set to `{ en, nb, "x-default": en }` on every page and `openGraph.locale` set to `en_US` or `nb_NO`.
- **Sitemap:** `sitemap.ts` lists both URLs for each page, with `alternates.languages`.
- **Preview image:** `opengraph-image.tsx` renders the tagline in the page's language.
- **Language not in the URL?** Not relevant: the language always comes from the URL, never from a cookie, so caches and crawlers always get the right one.

## 7. Tests

- **Unit:** `localized()` schema rules; DTO fallback resolution (`nb ?? en` plus the flag); `localePath` mapping; date formatting in `nb`; dictionary key parity (a test fails if `nb` is missing a key, in addition to the type check).
- **E2E:**
  - `/no` renders Norwegian interface text and `lang="nb"`.
  - The switch keeps the current path; the cookie stops the redirect.
  - A first visit with `Accept-Language: nb` redirects to `/no`.
  - Admin: edit a Norsk field, see it on `/no/...` while `/...` stays English; clear it and see the English fallback marked `lang="en"`.
  - Contact form validation errors appear in Norwegian.
- **Accessibility:** extend `a11y.spec.ts` to Norwegian pages in all themes.
- `MONGODB_URI= pnpm build` must still pass, proving no page queries the DB at build time.

## Phases

1. **Routing and dictionaries:** the `[lang]` segment, proxy rewrite, redirect and detection, root `lang`, translated interface text, header switch, and localised dates. The Norwegian site works at this point with English content.
2. **Content model:** `localized()` schemas, models, DTO fallback, locale-aware queries, and the migration script (run on dev first).
3. **Admin:** `LocalizedField`, nested `toUpdate()`, and the translation status card.
4. **SEO and résumé:** hreflang, sitemap, OG image, metadata, and the Norwegian résumé.
5. **Translation pass:** Claude drafts `nb` for all current content; the owner reviews it in the admin.
6. **Tests and release:** unit, E2E and axe tests; then run the migration on production and deploy straight after.

Phases 1 and 2–3 can ship separately. Phase 1 alone gives a Norwegian interface; content follows when translated.

## Risks

- **The migration changes the data shape.** Back up first with an Atlas snapshot or `mongodump`, and keep the gap between running the migration on production and deploying as short as possible.
- **Cache entries double** (one per language), which is negligible at this scale.
- **Machine-translated tone:** recruiters notice. Review every draft before publishing.

## Update this file

Mark each phase done here as it lands, as with `docs/REBUILD_PLAN.md`, and add a line to `CLAUDE.md` once the routing exists.
