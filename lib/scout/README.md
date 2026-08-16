# Bright Data scout

`fetchSiteContent` sends HTTPS target URLs to Bright Data's Web Unlocker API and returns bounded text content or a typed failure. It is server-only and accepts an injected `fetch` for tests.

Environment variables:

- `BRIGHT_DATA_API_KEY`, required server-side API key. Never expose it to the browser or commit it.
- `BRIGHT_DATA_ZONE`, optional Web Unlocker zone. Defaults to `tack`.

Live smoke testing is pending local `BRIGHT_DATA_API_KEY` configuration and explicit authorization for a paid Bright Data request.
