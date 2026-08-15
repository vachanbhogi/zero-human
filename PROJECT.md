# Zero Human Project

## Project definition

This repository is for a company operated by one or more AI agents with little to no routine human operation. The agents must run a real product and handle the company workflow, including product decisions, customer interaction, sales, payment collection, and delivery.

The specific customer problem, target customer, product name, and paid offer must be chosen before implementation begins. The final concept must be narrow enough to build, test, sell, and demonstrate during the hackathon.

## Required product loop

The finished project must support this complete loop:

1. A real person can use, evaluate, rate, rank, compare, or respond to the product.
2. An agent detects when human input is needed and creates a study through Terac.
3. Terac recruits participants and returns their responses.
4. The agents convert those responses into a concrete product or business change.
5. The product records evidence from before and after the change.
6. A customer can purchase the product through the team's Stripe Payment Link.
7. The agents deliver the paid result or service and record the outcome.

## Non-negotiable requirements

### Autonomous company operation

- Use one agent or a coordinated group of agents to operate the company.
- Give each agent a defined responsibility and decision boundary.
- Agents must perform real work, not only display a simulated conversation.
- The demonstration must show an agent making a decision and taking the resulting action.
- Human approval may be required for safety, payment, credentials, or irreversible actions, but routine operation should not depend on manual intervention.

### Terac integration

- Terac MCP is required for submission.
- Use Terac to collect real human input during the hackathon.
- Target the general population unless the product requires a justified specialist group.
- Build something participants can directly assess.
- Store the study request, returned responses, and resulting change as demonstration evidence.
- Show a measurable before-and-after result. Acceptable measures include preference rate, task completion, comprehension, conversion intent, rating, error count, or another product-specific measure.
- Keep the Terac API key outside source control and load it from an environment variable.

### Real product

- Provide a working user-facing product or service.
- Use real inputs and produce real outputs.
- Define the target customer and the problem being solved.
- Define one paid offer with a clear price and deliverable.
- Do not present mocked agent actions, fabricated customers, fabricated studies, or test payments as real evidence.

### Payments and revenue

- Use a Stripe individual account and one submitted Payment Link for hackathon transactions.
- Use a restricted Stripe key with read-only access to Balance and Charges when organizer revenue verification is required.
- Never commit Stripe keys or expose them in the browser.
- Never share a standard Stripe secret key.
- Record real transaction count and revenue separately from test transactions.
- A completed real payment is required to claim that the company earned revenue.

## Evidence required for the demonstration

The final demonstration must include:

- The initial product or output before human feedback.
- The Terac study question and intended participant group.
- Real returned feedback or labels.
- The agent's decision based on that feedback.
- The changed product or output.
- A comparable result showing whether the change improved the selected measure.
- A complete customer flow from request to payment to delivery.
- Logs or receipts that distinguish completed actions from planned actions.

## Sponsor track requirements

Sponsor services should be added only when removing the service would break a real part of the product.

### Linq

- Use a real Linq phone number with iMessage, RCS, or SMS.
- Treat messaging features as product controls, such as a reaction as a vote or a group thread as a shared workspace.
- An interactive iMessage component or in-message payment flow may be used when it fits the product.

### Replay

- Run Replay against the working application.
- Fix reported defects.
- Obtain a clean QA report after the fixes.

### Superserve

- Use Superserve as a required execution environment for agent code, files, shell commands, or browser work.
- Paused and resumed sandbox state must be part of the agent workflow if this track is entered.

### Pioneer

- Use an open-weight model hosted or fine-tuned through Pioneer.
- The model must perform a product function, not exist only as a track checkbox.
- Fastino Labs models, GLiNER2, GLiGuard, or GLiNER2-PII may be used when relevant.

### Band

- Agent coordination must happen inside Band.
- At least one agent handoff, account boundary, specialist assignment, or blocking verdict must affect the final result.
- Removing Band must prevent the multi-agent workflow from operating correctly.

### Render

- Use Render Workflows for a real multi-step or long-running company process.
- Deployment to Render alone does not satisfy this track requirement.

## Safety and security requirements

- Keep all API keys and credentials in environment variables or an approved secret store.
- Do not commit customer data, payment credentials, private Terac responses, or access tokens.
- Request explicit approval before spending money, launching a paid study, issuing a refund, or performing another irreversible external action.
- Validate webhook signatures and authenticate privileged endpoints.
- Minimize stored personal data and document any data retention.
- Clearly label simulated data, test mode, and incomplete actions.

## Completion criteria

The project is ready for submission only when all of the following are true:

- The product concept, target customer, paid offer, and success measure are documented.
- The working product is deployed and usable by someone outside the development team.
- Terac MCP is connected and a real study has completed.
- The agents made and applied a product decision using the study results.
- Before-and-after evidence is available.
- The payment and delivery flow works end to end.
- Required tests, type checks, build checks, and QA checks pass.
- The live demonstration can be completed without hidden manual steps.
- Submission materials accurately state what is live, tested, paid, simulated, or incomplete.

## Development responsibilities

Claude and Codex will collaborate on implementation, review, testing, and verification. Work should be divided by files or isolated features to avoid conflicting edits. Every handoff must state:

- The task and acceptance criteria.
- Files changed.
- Checks run and their results.
- Assumptions and unresolved blockers.
- The next concrete action.

Neither assistant may claim that an integration, study, payment, deployment, or test succeeded without current evidence.
