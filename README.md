# FundFlow — Server

Backend API for **FundFlow**, a crowdfunding platform where **Creators** launch
campaigns, **Supporters** contribute platform credits, and **Admins** oversee
the whole operation. Built with **Express 5 + TypeScript (ESM) + MongoDB**.

## Tech Stack

- **Runtime:** Node.js (ESM, `NodeNext`)
- **Framework:** Express 5
- **Language:** TypeScript 5
- **Database:** MongoDB (official `mongodb` driver)
- **Auth:** Bearer JWT verified against the client auth server's JWKS (`jose`)
- **Payments:** Stripe (with a dummy fallback)
- **Validation:** Zod

## Architecture

A feature-modular layout — each domain has its own `routes → controller →
service → validation`:

```
src/
├─ config/         env, database (typed collections), constants, stripe
├─ middleware/     verifyToken, auth (roles), validate, notFound, errorHandler
├─ modules/
│  ├─ user/        profile sync + one-time credits, admin user management
│  ├─ campaign/    CRUD, explore (aggregation search/filter), approvals
│  ├─ contribution/ create+debit, review, approve/reject+refund, pagination
│  ├─ withdrawal/  creator earnings, requests, admin payout
│  ├─ payment/     Stripe credit purchase + history + dummy fallback
│  ├─ notification/ per-user notifications feed
│  ├─ report/      report suspicious campaigns, admin resolution
│  └─ admin/       platform-wide statistics
├─ routes/         central API router
├─ types/          model interfaces + Express request augmentation
├─ utils/          AppError, catchAsync, sendResponse, notify, objectId
├─ scripts/        seedAdmin
├─ app.ts          express app (exported as the serverless handler)
└─ index.ts        local listener / Vercel entry
```

### Business rules

- Supporter gets **50 credits**, Creator gets **20 credits** — granted **once**
  on first profile sync (idempotent, so credits are never double-granted).
- Contributing **debits** the supporter's credits immediately; a **rejection**
  automatically **refunds** them.
- Approving a contribution adds the amount to the campaign's `amountRaised` and
  the creator's withdrawable `raisedCredits`.
- **Purchasing:** 10 credits = $1. **Withdrawing:** 20 credits = $1.
- Creators can withdraw only when they have **≥ 200 raised credits**.
- Deleting a campaign refunds every approved supporter and reverses the
  creator's raised credits.
- Money-moving operations use atomic `$inc` with guarded filters to stay
  correct under concurrency (no double-spend / double-process).

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:5000
```

> macOS note: port 5000 is often occupied by AirPlay Receiver. Either disable it
> (System Settings → General → AirDrop & Handoff) or set a different `PORT`.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with hot reload (tsx + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check without emitting |
| `npm run seed:admin -- <email>` | Promote an existing user to admin |

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | Server port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` |
| `DB_URL` | **yes** | MongoDB connection string |
| `DB_NAME` | no | Database name (default `Crowdfunding`) |
| `JWKS_URL` | **yes** | Base URL of the client auth server (exposes `/api/auth/jwks`) |
| `ADMIN_EMAILS` | no | Comma-separated emails auto-promoted to admin on first sync |
| `CLIENT_ORIGINS` | no | Comma-separated CORS origins (empty = allow all) |
| `CLIENT_URL` | no | Base URL for Stripe success/cancel redirects |
| `STRIPE_SECRET_KEY` | no | Enables real Stripe checkout (else dummy purchase) |
| `STRIPE_WEBHOOK_SECRET` | no | Reserved for webhook verification |

## Authentication

Every protected route expects an `Authorization: Bearer <token>` header. The
token is verified against the client auth server's JWKS. Roles (`supporter`,
`creator`, `admin`) are enforced by middleware using the profile stored in this
API's database. To bootstrap the first admin, add the email to `ADMIN_EMAILS`
before they sync, or run `npm run seed:admin -- <email>` afterwards.

## API Reference

Base path: `/api`. All responses share the shape
`{ success, message, data?, meta? }`.

### Users
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/users/sync` | Auth | Create/sync profile, grant one-time credits |
| GET | `/users/me` | Auth | Current user profile (persistent login) |
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/role` | Admin | Change a user's role |
| DELETE | `/users/:id` | Admin | Remove a user |

### Campaigns
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/campaigns` | Public | Explore (search, category, goal range, sort, pagination) |
| GET | `/campaigns/top` | Public | Top 6 funded campaigns |
| GET | `/campaigns/categories` | Public | Distinct categories |
| GET | `/campaigns/:id` | Public | Campaign details |
| POST | `/campaigns` | Creator | Create campaign (status `pending`) |
| GET | `/campaigns/mine` | Creator | My campaigns (by deadline desc) |
| GET | `/campaigns/mine/stats` | Creator | Total / active / raised stats |
| PATCH | `/campaigns/:id` | Creator | Update title, story, reward info |
| DELETE | `/campaigns/:id` | Creator/Admin | Delete + refund approved supporters |
| GET | `/campaigns/admin/pending` | Admin | Pending approvals |
| GET | `/campaigns/admin/all` | Admin | Manage all campaigns |
| PATCH | `/campaigns/:id/approve` | Admin | Approve (notifies creator) |
| PATCH | `/campaigns/:id/reject` | Admin | Reject (notifies creator) |
| PATCH | `/campaigns/:id/suspend` | Admin | Suspend a reported campaign |

### Contributions
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/contributions` | Supporter | Contribute (debits credits, status `pending`) |
| GET | `/contributions/mine` | Supporter | Paginated history |
| GET | `/contributions/mine/approved` | Supporter | Approved contributions |
| GET | `/contributions/mine/stats` | Supporter | Totals / pending / contributed |
| GET | `/contributions/review` | Creator | Pending contributions to review |
| GET | `/contributions/:id` | Auth | Single contribution (modal detail) |
| PATCH | `/contributions/:id/approve` | Creator | Approve (updates raised, notifies) |
| PATCH | `/contributions/:id/reject` | Creator | Reject + refund + notify |

### Withdrawals
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/withdrawals/earnings` | Creator | Raised credits, $ value, availability |
| POST | `/withdrawals` | Creator | Request a withdrawal |
| GET | `/withdrawals/mine` | Creator | Withdrawal / payment history |
| GET | `/withdrawals/pending` | Admin | Pending requests |
| PATCH | `/withdrawals/:id/approve` | Admin | Mark paid + reduce raised credits |

### Payments (credit purchase)
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/payments/packages` | Public | Credit packages + Stripe status |
| POST | `/payments/checkout` | Supporter | Create Stripe checkout session |
| POST | `/payments/confirm` | Supporter | Confirm session + add credits |
| POST | `/payments/dummy` | Supporter | Dummy purchase (no Stripe) |
| GET | `/payments/mine` | Supporter | Payment history |

### Notifications
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | Auth | My notifications (newest first) |
| GET | `/notifications/unread-count` | Auth | Unread count |
| PATCH | `/notifications/read-all` | Auth | Mark all read |
| PATCH | `/notifications/:id/read` | Auth | Mark one read |

### Reports
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/reports` | Supporter | Report a suspicious campaign |
| GET | `/reports` | Admin | List reports |
| PATCH | `/reports/:id/resolve` | Admin | Resolve a report |

### Admin
| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/stats` | Admin | Platform-wide statistics |

## Collections

`users`, `campaigns`, `contributions`, `withdrawals`, `payments`,
`notifications`, `reports` — indexes are created automatically on first connect.

## Deployment (Vercel)

The Express `app` is exported as the serverless handler in `src/index.ts`
(`app.listen` only runs off-Vercel). `vercel.json` builds `src/index.ts` with
`@vercel/node` and routes all traffic to it. Configure the environment
variables above in the Vercel dashboard before deploying.
