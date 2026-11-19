# 3dotventures.com

Marketing site for 3DOT Ventures. Plain HTML, CSS and JS, hosted free on GitHub Pages.

## Files
- `index.html` the site
- `privacy.html` privacy policy (needed for SMS consent and carrier registration)
- `404.html` not-found page
- `assets/css/site.css`, `assets/js/site.js`
- `assets/img/` logos, favicon, social share image (`og.png`)
- `CNAME` tells GitHub Pages to serve this at 3dotventures.com

## Contact form
The form posts to the 3DOT CRM when `leadEndpoint` is set at the top of `assets/js/site.js`
(for example `https://crm.3dotventures.com/api/lead`). Until then it opens an email to hello@3dotventures.com.
The CRM route needs CORS headers allowing `https://3dotventures.com`, and a published page with slug
`website-contact` in the `3dot` workspace.

## DNS (IONOS)
- `A` records for `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- `CNAME` for `www`: `<github-username>.github.io`
Then in the repo: Settings > Pages > Source: main branch, root. Custom domain: 3dotventures.com. Tick "Enforce HTTPS" once the certificate is issued.
