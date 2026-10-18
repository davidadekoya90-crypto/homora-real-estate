# HOMORA

HOMORA is a responsive real estate marketplace for buyers, owners, agents and property businesses. It includes searchable listings, property details, member profiles, a community feed, favourites, and buyer/seller conversations.

## Run locally

Install Node.js LTS, then run from this folder:

```sh
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Build and preview with `npm run build` and `npm run preview`.

## Publish on GitHub Pages

The repository includes a GitHub Actions workflow that builds and publishes the site when changes are pushed to `main`. Create a GitHub repository, push this project to its `main` branch, and in the repository open **Settings → Pages**. Set the publishing source to **GitHub Actions**. The workflow will publish the site at `https://<account>.github.io/<repository>/` after its first successful run. Demo profiles and listings remain local to each visitor's browser; shared accounts and data require the Supabase setup below.

## Try the interactive demo

Without Supabase environment variables, HOMORA starts in clearly labelled demo mode. Open **Account** and select **Preview as Buyer** or **Preview as Seller** (or create a local demo profile). Demo profiles can favourite listings, publish demo properties and community posts, like and comment, and message one another. Demo content is stored in this browser only; it is not a secure account and is not shared with other visitors. Use the sample buyer and seller profiles and switch between them to walk through a conversation.

The homepage guided tour links each role to its relevant workflow. HOMORA also supports dark mode, recently viewed homes, side-by-side comparison, saved search preferences, a property photo lightbox, similar listings, mortgage and gross-yield estimates, and installable PWA shell caching. Browser-only search preferences do not send automatic email or push alerts. No demo action charges money or completes a property transaction.

## Supabase setup for shared accounts and listings

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and the project's public `VITE_SUPABASE_ANON_KEY`. Never put a service role key in the browser app.
3. Apply `supabase/migrations/001_marketplace.sql` in the Supabase SQL editor or through the Supabase CLI.
4. Enable email/password authentication and configure the local redirect URL (for example, `http://localhost:5173/account`).
5. Restart `npm run dev` after changing environment values.

Shared listings and community posts enter `pending_review` for a trusted moderation process. The schema uses row level security and prevents members from approving their own content. Property photos currently use HTTPS image URLs; secure multi-file upload needs a configured Storage bucket and upload policies.

## Main routes

- `/` — landing page, featured homes and interactive role-based guided tour.
- `/properties` and `/properties/:id` — filters for location, type, price, beds, baths and size; sorting, favourites, compare, recent views, photo lightbox, similar listings and finance estimates.
- `/compare` — compare up to four selected listings.
- `/community` — posts, likes and comments.
- `/messages` — inbox and property-linked buyer/seller conversations.
- `/sell` — create a property listing.
- `/sign-in` and `/account` — account creation, profile editing and listing dashboard.

The app does not process purchase funds, transfer title, or complete a transaction. Payments, escrow, signatures, identity and ownership verification, calls, viewing calendars, live advertising, provider-backed notifications, and moderation tools require appropriate services and safeguards before implementation. Map search, short-let listing types and secure media uploads are also not part of this build.

## Project structure

- `src/pages/` — routed screens.
- `src/components/` — shared UI, listing cards and guided-tour components.
- `src/lib/` — Supabase client and browser demo store.
- `supabase/migrations/` — schema, indexes and row-level security policies.
- `src/styles.css` — design system, responsive layouts and reduced-motion rules.
