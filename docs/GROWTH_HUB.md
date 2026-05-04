# CCWEB Global Marketing Agent & Growth Hub

Prototype extension of the **Business Automation** pillar: marketing campaign workspace, marketplace listings, simulated escrow, lead scoring, and CCWEB take-rate on success.

## Principles (non-negotiable)

- **No spam:** Agent outputs are **drafts**; human approval before publish. No automated bulk DMs in this prototype.
- **Platform rules:** Customers must comply with X, Meta, LinkedIn, and regional marketing law. CCWEB does not operate social accounts on behalf of users without OAuth + compliance review in production.
- **Organic-first:** Research, positioning, and opt-in friendly templates are the default narrative.

## API base: `/api/growth`

| Method | Path | Description |
|--------|------|--------------|
| GET | `/overview` | KPIs, fee %, policy banners |
| GET | `/listings` | Query `?industry=` optional |
| POST | `/listings` | Create product/service listing |
| GET | `/listings/:id` | Detail |
| POST | `/orders` | Body: `{ listingId, buyerId?, buyerName? }` — funds **escrow** (simulated) |
| POST | `/orders/:id/deliver` | Seller marks delivered |
| POST | `/orders/:id/confirm` | Buyer confirms → release minus platform fee |
| GET | `/orders` | Query `?sellerId=` |
| GET | `/leads` | Query `?businessId=` |
| POST | `/leads` | Generate scored lead (prototype) |
| POST | `/leads/:id/convert` | Mark converted (fee metadata in response) |
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Body: `{ name, objective, channels[], industries[], organicOnly? }` |
| GET | `/campaigns/:id/suggestions` | Posts, DM templates, ads ideas, research checklist |

## Escrow flow (simulated)

1. `POST /orders` → `escrow_funded`  
2. `POST /orders/:id/deliver` → `delivered_pending_confirm`  
3. `POST /orders/:id/confirm` → `completed`; metrics updated  

Production: integrate **Stripe Connect** or similar with true split payments and dispute windows.

## Monetization (prototype constants)

- `CCWEB_GROWTH_PLATFORM_FEE_PCT` (default `8`) on completed sales  
- `CCWEB_GROWTH_LEAD_FEE_USD` (default `2.5`) reference for pay-per-lead pricing  

## UI

- Route: **`/growth-hub`** (`GrowthHubPage.jsx`)  
- Nav: **Growth Hub**  

## Scaling

- Replace in-memory Maps with **PostgreSQL** (listings, orders, campaigns, leads) + **Redis** for rate limits and job queues.  
- Outbound integrations: official **Marketing APIs** with OAuth, webhooks, and per-tenant rate limits.  
- Separate **worker** service for long-running research and content generation.
