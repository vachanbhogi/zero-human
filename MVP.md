Zero Human Company Hackathon — 2-Hour Execution Plan

Team

Vachan: Product / autonomous workflow

Nihar: Sales / customer acquisition

Team size: 2

Hackathon length: 2 hours

1. PRIMARY OBJECTIVE

Build a company from scratch in two hours that can:

Identify a real customer problem.

Offer a concrete outcome for money.

Get at least one real customer to pay today.

Use agents to perform the core work.

Deliver something genuinely useful to the customer.

Demonstrate a credible path from today's manual/primitive prototype to a fully autonomous company.

Success metrics

Minimum win

$1 from a real customer.

Strong

1–3 customers / $20–$60+ revenue.

Excellent

$100+ revenue + repeatable autonomous workflow.

Revenue is more important than polish.

2. BLANK-SLATE RULE

We are NOT building Dopa 2.0.

Previous projects, including Dopa, are useful only as prior experience.

They do not determine:

the product

the architecture

the UI

the model

the data

the business model

Start from the customer and the revenue opportunity.

DO

Start with the problem.

Find a specific customer.

Define one concrete paid outcome.

Build only what is necessary to deliver that outcome.

Reuse tools/code only if they materially reduce build time.

DON'T

Rebuild Dopa because it already exists.

Assume the old product is the best idea.

Carry over restricted datasets/models.

Build features simply because they existed previously.

Spend the hackathon explaining the old product.

3. CORE MVP HYPOTHESIS

Before coding, write:

We believe [customer] has a problem with [specific pain]. We believe [our specific service] solves it. We will know we're right when [customer] pays and accepts the result.

The hypothesis must be specific enough that someone can pay for it immediately.

Bad

“AI-powered marketing platform.”

Better

“We find 20 high-intent prospects for early-stage startups and produce personalized outreach for each for $20.”

Best

Whatever specific offer gets a real person to say:

“Yes, I'll pay for that now.”

4. THE 2-HOUR MVP RULE

This is not a normal startup MVP.

We have approximately 120 minutes.

Maximum MVP

The product should have 3–5 meaningful components maximum:

Customer/payment

One autonomous research/decision workflow

One concrete deliverable

One feedback or improvement mechanism

Evidence of autonomous operation

Everything else is optional.

The 20-minute rule

If a feature cannot be made useful in roughly 20 minutes or less, cut it.

The manual-first rule

If something can be done manually while the customer still receives the promised value, do not build it yet.

5. PRODUCT DESIGN

The minimum architecture should look roughly like:

CUSTOMER
   ↓
PAYMENT
   ↓
INPUT
   ↓
AGENT / AGENTS
   ↓
RESEARCH / DECISION
   ↓
CONCRETE DELIVERABLE
   ↓
CUSTOMER

If additional agent coordination is useful:

Input
  ↓
Research Agent
  ↓
Strategy Agent
  ↓
Execution Agent
  ↓
Final Deliverable

Do not build a complicated multi-agent system unless the agents genuinely need different responsibilities.

6. REVENUE-FIRST PRODUCT

The product should be a small, immediately deliverable service, not a full SaaS.

Example offer

$20 Growth Sprint

Customer provides:

Website

One-sentence goal

We deliver:

competitor intelligence

relevant prospects

positioning recommendations

personalized outreach

one concrete growth recommendation

The exact offer is not predetermined.

The team should choose the offer that gets the fastest positive response.

Payment

Use the fastest available payment mechanism.

The customer should be able to pay before or immediately at the start of delivery.

7. STRICT CUSTOMER ACQUISITION RULE

The team cannot wait for users to discover the product.

We sell directly.

Target customers

Priority:

Hackathon participants with startups

Founders/builders at the venue

People in existing networks

Direct messages to relevant prospects

The closest potential customer is usually better than a theoretically larger audience.

8. SALES SCRIPT

Use a short, direct pitch:

“We're building an autonomous company for this hackathon. Give us your [specific input] and we'll [specific outcome] in about 10 minutes. We're doing the first few for $20 today. Want to try it?”

Then:

“Want us to run it for you?”

DO

Ask for payment.

Demonstrate the product.

Keep the offer concrete.

Mention the delivery time.

Ask for objections.

Close immediately.

DON'T

Ask only “Would you use this?”

Ask people to sign up and leave.

Spend 10 minutes explaining the technology before showing value.

Give away the first product automatically if someone is willing to pay.

Treat “that's cool” as validation.

9. VACHAN — PRODUCT TRACK

0:00–0:15

Work together:

choose the customer

choose the problem

choose the paid offer

define exactly what the customer receives

0:15–0:30

Build the smallest end-to-end workflow:

Input → Agent → Output

No polish.

No authentication.

No complex database.

No elaborate dashboard.

0:30–1:15

Make the workflow reliable enough to fulfill a paid order.

Priorities:

Input works.

Agent works.

Output is useful.

Delivery is fast.

1:15–1:40

Run the first real customer order.

Use customer feedback to fix the most important failure.

1:40–2:00

Prepare the judging demo:

payment

agent execution

output

customer value

autonomous-company story

Vachan's hard rule

Do not spend the entire hackathon coding.

Once the product can fulfill one paid order, stop adding features unless a customer objection requires one.

10. NIHAR — REVENUE TRACK

0:00–0:15

Work together to define the offer.

0:15–0:30

Set up:

payment link

QR code

one-sentence pitch

simple way to collect the customer's input

Then immediately start selling.

0:30–1:15

Target:

10+ conversations

5+ serious demos

1+ payment

Talk to people directly.

Do not wait for Vachan to say the product is finished.

1:15–1:40

Close customer #1.

Stay with the customer while Vachan fulfills the order.

Then seek customer #2.

1:40–2:00

Collect:

total revenue

customer count

customer reaction

useful testimonial/quote if offered

evidence of payment

Nihar's hard rule

Nihar is responsible for revenue, not feature development.

If the product is imperfect, sell the useful outcome that it can already deliver.

11. PARALLEL WORK

Vachan and Nihar should work independently after the initial 15-minute decision.

Vachan

Build the machine.

Nihar

Find someone to pay for the machine.

They should not sit together coding.

Checkpoints

Keep syncs short:

0:15 — offer locked

0:30 — first product workflow

1:15 — first customer/payment target

1:40 — revenue + customer feedback

1:55 — demo freeze

Each sync should take ≤5 minutes.

12. HACKATHON INTEGRATIONS

Only use sponsor technologies when they materially improve the product or help satisfy a judging requirement.

Potential examples:

Bright Data

Use for live, permitted web intelligence when the product genuinely needs current market/competitor information.

Do not build a generalized scraping platform.

Terac

Use for real human feedback if the product benefits from human preference testing.

Do not fabricate feedback or improvement.

Band

Use only if multiple specialized agents genuinely need to coordinate.

Do not create fake agents solely for a sponsor checkbox.

Other sponsors

Add only if:

integration is fast

it improves the product

it does not threaten the revenue goal

13. DATA + LICENSING — ABSOLUTE RULES

The product is being built as a potentially commercial company.

DO

Verify that data/models are permitted for the intended use.

Use appropriately licensed APIs and datasets.

Use customer-provided data.

Use permitted public web information.

Keep commercial licensing in mind from the beginning.

DO NOT

Use research-only Meta MRI data in the commercial product.

Use TRIBE v2 if its license does not permit commercial use.

Hide restricted data behind an API as a workaround.

Claim scientific capabilities we cannot legally or technically support.

Assume “publicly visible” automatically means “free to use for everything.”

Build the company around a dataset whose license has not been checked.

14. STRICT DOs

Product

DO start from a customer problem.

DO define one paid outcome.

DO build the smallest end-to-end workflow.

DO prioritize reliability over breadth.

DO use agents where they provide actual value.

DO deliver something real to the first customer.

DO use customer feedback immediately.

Revenue

DO sell immediately.

DO ask for money.

DO target people physically nearby first.

DO make the price low enough for an impulse purchase.

DO fulfill the order quickly.

DO record actual revenue.

Hackathon

DO make the autonomous-company loop obvious.

DO show real agent work.

DO show actual payment.

DO demonstrate real customer value.

DO use sponsor technologies where they genuinely fit.

DO make claims that can be demonstrated.

15. STRICT DON'Ts

DON'T BUILD

full SaaS

authentication

complex dashboards

mobile apps

elaborate databases

generic AI chatbot

generalized agent framework

custom ML model

complex prediction system

complicated billing infrastructure

features nobody has paid for

DON'T WASTE TIME ON

animations

pixel-perfect UI

SEO

long landing pages

social media accounts

extensive onboarding

subscription management

analytics dashboards

documentation beyond what judging requires

DON'T

rebuild Dopa

use Dopa's old architecture just because it exists

use Meta MRI/TRIBE v2 without commercial rights

fabricate customers

fabricate revenue

fabricate Terac results

fabricate conversion rates

claim autonomy where humans are secretly doing the core work

confuse positive reactions with purchases

16. PRIORITY ORDER WHEN SOMETHING BREAKS

Use this exact order:

P0 — PAYMENT

Can someone pay?

P1 — DELIVERY

Can we fulfill what we sold?

P2 — CUSTOMER VALUE

Does the customer actually find it useful?

P3 — AUTONOMY

Can agents perform the core work?

P4 — HACKATHON INTEGRATIONS

Do sponsor technologies improve the submission?

P5 — POLISH

Does the demo look better?

Never sacrifice P0–P3 for P5.

17. FINAL 10-MINUTE DEMO

The final demo should be extremely simple.

1. Problem

Explain the specific pain.

2. Customer

Show who paid.

3. Payment

Show the actual transaction.

4. Autonomous company

Show:

Customer
  ↓
Payment
  ↓
Agent
  ↓
Research
  ↓
Decision
  ↓
Execution
  ↓
Deliverable

5. Result

Show the actual thing delivered.

6. Human validation

If applicable, show actual feedback and measured improvement.

7. Business

Explain:

Today: $20 one-time service.

Future: recurring autonomous company serving the same outcome at scale.

8. Vision

Build a company where agents perform the work instead of employees.

18. DEFINITION OF DONE

At the end of two hours:

Real customer identified

Clear paid offer

Payment mechanism works

At least $1 real revenue

At least one customer order fulfilled

Autonomous agent workflow demonstrated

Customer value demonstrated

No restricted research-only data/model dependency

Sponsor integrations used only where justified

Revenue evidence captured

Final demo works end-to-end

No major feature work after the final 10–15 minutes

FINAL RULE

DO NOT TRY TO BUILD A STARTUP IN TWO HOURS.

Build the smallest machine that can make money today.

Then use the remaining time to prove that the machine can become a company.

One paying customer > 100 signups.

One useful deliverable > 20 unfinished features.

One autonomous workflow > a beautiful dashboard.

Revenue > polish.