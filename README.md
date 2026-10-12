# Durga Puja Outing Planner ♡

A mobile-first, romantic Durga Puja plan website with 8 screens:
1. Invitation
2. Date/time selection
3. Pandal/place multi-select
4. Activity multi-select
5. Special request and message
6. Review + **Submit**
7. “Plan Banachhi...” loading screen (no Gmail mention)
8. “Ho Gelo!” success screen (no Gmail mention)

## Run locally
Open `index.html` in a browser, or run a local static server:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Important: email delivery is not enabled by default
This package is currently in **demo mode**. Pressing Submit creates the plan and shows the success screen, but does not send an email. This is intentional so the UI does not falsely claim an email was sent.

To enable real email delivery:
1. Deploy a small backend endpoint that accepts `POST { "plan": "..." }`, validates the request, and sends the email using an email provider (for example Resend, EmailJS server-side, or SMTP).
2. Keep provider API keys and SMTP passwords in backend environment variables. Never put secrets in `script.js`, `index.html`, or a public GitHub repository.
3. In `script.js`, set `EMAIL_ENDPOINT` to your deployed backend URL.
4. Configure CORS to allow only your website domain and use rate limiting / validation.
5. Test with your own email before sharing the site.

The visible website never mentions Gmail in panels 6–8. Real email delivery is a separate backend feature.

## Deploy frontend with GitHub Pages
1. Create a GitHub repository and upload `index.html`, `style.css`, `script.js`.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, choose `main` and `/(root)`, then Save.
4. Open the published URL after GitHub Pages finishes deployment.

## Customize
- Update invitation copy in `index.html`.
- Update locations and activities by editing the `data-place` and `data-activity` buttons.
- Change colours and card styles in `style.css`.
- Change the email backend endpoint in `script.js` only after deploying your own secure backend.
