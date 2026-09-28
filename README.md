# vrkive-site

The two documents App Review has to be able to read for **VRKIVE LLC**'s iOS
app **Desktop**, and nothing else. Static HTML on GitHub Pages: no framework,
no build step, no JavaScript, no external requests of any kind.

```
CNAME                      arkive.tech        custom domain (apex)
.nojekyll                                     serve the files as-is
robots.txt                                    crawling allowed, indexing refused — see below
styles.css                                    one stylesheet, both documents
index.html                 /                  INTENTIONALLY BLANK
404.html                                      intentionally blank
desktop/privacy/index.html /desktop/privacy   App Store Connect Privacy Policy URL
desktop/support/index.html /desktop/support   App Store Connect Support URL
```

## The landing page is blank on purpose

`arkive.tech/` and `404.html` render nothing. There is no company landing
page, no app description, no contact address — by decision, not by accident.
The domain exists to serve two URLs that a shipped binary and an App Store
Connect record point at; it is not a website.

**So do not "fix" the blank page.** If it ever needs content again, that is a
deliberate change, and the previous landing page is in this repo's history.

## Nothing here should appear in search

Every page sends `<meta name="robots" content="noindex, nofollow">`.

`robots.txt` **allows** crawling, which looks backwards and isn't: a crawler
has to fetch a page to read the noindex tag and drop the URL. `Disallow: /`
would block that fetch, and a blocked URL can still be listed as a bare link
with no snippet — the opposite of the goal. GitHub Pages gives no control
over response headers, so the meta tag is the only mechanism available; there
is no `X-Robots-Tag` to send.

Noindex costs nothing that matters here. App Review fetches the privacy and
support URLs directly, and the app links to them directly. Neither path
involves a search engine.

## Two things that are load-bearing

**The `/desktop/` prefix.** arkive.tech is the company's domain, not one
app's. A second app gets its own folder without moving Desktop's URLs — and
those cannot move once they are filed in App Store Connect. The Desktop app
itself hardcodes them in `LegalLinks` (`Desktop/Desktops/AppInfo.swift`), so
a change here is a change there, in a shipped binary.

**Directory indexes, not `privacy.html`.** The URLs are extensionless, and
serving them from `privacy/index.html` is guaranteed behavior on GitHub
Pages and every other static host. Relying on a host to map a bare path to a
`.html` file is not. A 404 on the privacy URL is an App Review rejection, so
this is not worth being clever about.

## Links

The two documents link to **each other** with relative paths, so they resolve
both on the `github.io` URL and on `arkive.tech`. Neither links to `/`, which
is why blanking the landing page orphaned nothing.

## Editing

This is the source of truth. Edit here and push; never edit only the live
site. Both documents describe the app **as it actually behaves** — the
privacy policy was written against the Desktop codebase, not from a
template, and `DesktopTests/PrivacyManifestTests` guards the claims it makes
about identifiers and tracking. If the app's behavior changes, this changes
with it.

> Note: `Desktop/website/` in the app repo is an **older, unpublished draft**
> of these pages and is not wired to any deploy. Don't edit it expecting the
> live site to change, and don't publish it over this — it predates the
> VRKIVE LLC naming and still references UI that was removed.
