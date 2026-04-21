# ccweb-project

The world's first AI-powered Web3 Academy and Business Engine.

Core pillars: Learn -> Find -> Build -> Earn.

## Development setup

### Prerequisites

- Node.js 18+ and npm

### Install dependencies

Run:

`npm install`

### Start the application

Run:

`npm run dev`

Then open `http://localhost:3000`.

### Production-style run

Run:

`npm start`

## Business applicant + income engine APIs

The prototype now includes applicant profile and secure payout workflow APIs:

- `GET /api/applicants` - list applicant profiles, stats, skill capacity, certificates
- `GET /api/applicants/:id` - fetch one applicant profile
- `POST /api/applicants` - create/update applicant profile with capacity and certificates
- `GET /api/engine/match?applicantId=:id&city=:city&query=:query` - AI business finder compatibility matching
- `POST /api/deals/:id/confirm` - secure payout release with role + token checks
