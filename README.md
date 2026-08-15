# Tack

Agent-run growth desk. Give us a URL — we come back with a campaign.

**Tack Desk — $200/mo list. Founding rate $20/mo (90% off) if they pay on the call.** Competitor teardown, personas, 10 outreach angles, one next move. Humans rate the copy on Terac.

Hackathon track: Zero Human. Rules live in `PROJECT.md`.

## Close today

1. Create a Stripe Payment Link for **$20** (founding month or $20/mo subscription). Apple Pay on.
2. Put it in `.env.local`:

```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
```

3. Open the talk track: [http://localhost:3000/call](http://localhost:3000/call)
4. Ask for the URL. Send the link. Stay on the line. Paste the URL into `/onboarding`.

## Getting Started

```bash
npm install
npm run dev
```

- Landing: [http://localhost:3000](http://localhost:3000)
- Call script: [http://localhost:3000/call](http://localhost:3000/call)
- Intake: [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
- Desk: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
