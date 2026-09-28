# vrkive-site

The public pages for **VRKIVE LLC** and its iOS app **Desktop** — a landing
page plus the two documents App Review has to be able to read. Static HTML
on GitHub Pages: no framework, no build step, no JavaScript, no external
requests of any kind.

```
CNAME                      arkive.tech        custom domain (apex)
.nojekyll                                     serve the files as-is
styles.css                                    one stylesheet, all pages
index.html                 /                  landing
404.html                                      not-found page
desktop/privacy/index.html /desktop/privacy   App Store Connect Privacy Policy URL
desktop/support/index.html /desktop/support   App Store Connect Support URL
```

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

Page-to-page links are **relative**, so they resolve both on the
`github.io` URL before the domain is cut over and on `arkive.tech` after.
`404.html` is the exception — it can be served from any path, so its links
are root-absolute and only correct once the apex domain is live.

## Editing

This is the source of truth. Edit here and push; never edit only the live
site. Both documents describe the app **as it actually behaves** — the
privacy policy was written against the Desktop codebase, not from a
template, and `DesktopTests/PrivacyManifestTests` guards the claims it makes
about identifiers and tracking. If the app's behavior changes, this changes
with it.
