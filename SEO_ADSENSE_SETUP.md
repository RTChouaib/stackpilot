# StackPilot SEO / AdSense setup

## Required environment variables
- `NEXT_PUBLIC_APP_URL=https://stackpilot.by-rtc.com`
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX`

The AdSense publisher ID is intentionally not hard-coded. Set the real ID before production. `/ads.txt` is generated from the same variable.

## After deployment
1. Verify `/robots.txt`, `/sitemap.xml`, and `/ads.txt`.
2. Add the domain to Google Search Console and submit `/sitemap.xml`.
3. Complete Google AdSense site review/approval.
4. Configure the required Google-compatible consent experience for applicable visitors.
5. Verify that every indexed URL returns 200 and has a self-referencing canonical.
6. Use Search Console to monitor indexing and search queries.

## Important
The calculators are estimates, not billing sources. Keep provider pricing data current before publishing exact pricing claims.
