export const BRAND = "Tack";

export const OFFER_NAME = "Tack Desk";

/** What you say the desk costs. */
export const LIST_PRICE = "$200";

/** What you actually collect today on the call. */
export const PRICE = "$20";

export const PERIOD = "/mo";

export const DISCOUNT = "90% off";

export const LIST_LABEL = `${LIST_PRICE}${PERIOD}`;

export const PRICE_LABEL = `${PRICE}${PERIOD}`;

export const CTA = `Start at ${PRICE_LABEL}`;

export const TAGLINE = "Give us a URL. We run the desk.";

export const PITCH = `Tack is a ${LIST_LABEL} agent-run growth desk. On this call it's ${PRICE_LABEL} — ${DISCOUNT} — if you pay before we hang up. Paste your URL. Agents research competitors, write outreach, and deliver in about 3 minutes. Want us to run it on yours?`;

export const CALL_OPEN =
  "Got 45 seconds? I'm not selling a login. I'm running a growth desk. What's your website?";

export const CALL_CLOSE = `List is ${LIST_LABEL}. Today, founding rate is ${PRICE_LABEL} — ${DISCOUNT} — Apple Pay, 20 seconds. I start the agents while we're on the phone.`;

export const DELIVERABLE = [
  "Competitor teardown from the live site",
  "Who to talk to, from this audience",
  "10 outreach lines you can send tonight",
  "One next move — not a 12-week retainer",
] as const;
