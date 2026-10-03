# NOIRSAINT

> **CRAFTED WITHOUT LIMITS.**

NOIRSAINT is a dark-luxury fashion commerce platform designed around a refined storefront experience, variant-level inventory, authoritative order processing, and a maintainable production-oriented architecture.

The project combines a responsive React storefront with Supabase-backed commerce infrastructure, an administrative workspace, and a motion system built to support the brand without compromising usability.

---

## Product Highlights

- **30-product curated catalog** with supplied NOIRSAINT imagery
- Product detail experiences with galleries, size guides, SKU visibility, quantity controls, and wishlist interactions
- **Variant-level commerce model** for size, color, SKU, price, and stock
- **Variant-specific inventory** so purchasing one size never decrements another
- Persistent cart state with exact product, size, color, and SKU information
- Supabase-backed authentication and customer orders
- Authoritative checkout through the `create_noirsaint_order` database RPC
- Shop search, category filtering, sorting, availability-aware size display, and collections
- Administrative product management and variant inventory controls
- Inventory dashboard, low-stock/out-of-stock handling, order management, analytics, and CSV export
- Responsive customer and admin interfaces
- Page transitions, scroll reveals, hero motion, 3D logo layers, parallax interaction, and reduced-motion support

---

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19 |
| Build | Vite 8 |
| Language | JavaScript / JSX |
| Commerce backend | Supabase |
| Authentication | Supabase Auth |
| Database | PostgreSQL via Supabase |
| Icons | Lucide React |
| Quality | Custom lint checks + Node test runner |
| CI | GitHub Actions |
| Deployment | Vercel / static SPA hosting |

---

## Architecture

NOIRSAINT uses Supabase as the production source of truth for commerce data.

```text
React + Vite
    │
    ├── Storefront
    ├── Customer account
    ├── Checkout
    └── Admin workspace
            │
            ▼
       Supabase Client
            │
            ├── Auth
            ├── Catalog
            ├── Inventory
            └── Orders
                    │
                    ▼
              PostgreSQL
```

Browser `localStorage` is used for UI-oriented persistence and caching. Critical commerce operations are not treated as client-authoritative.

### Commerce model

```text
Product
  └── Variant
        ├── Size
        ├── Color
        ├── SKU
        ├── Price
        └── Stock
```

This makes inventory changes precise and prevents unrelated variants from being affected by a purchase.

---

## Getting Started

### Requirements

- Node.js 22+
- npm
- A Supabase project for production-backed development

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

## Environment Configuration

Environment variables are intentionally **not documented with real values in this README**.

For local development, create a private `.env` file using the repository's `.env.example` as the template. Configure the required Supabase and site settings in your local environment or deployment provider.

**Never commit `.env` or expose privileged credentials.** In particular, never place a Supabase service-role key, database password, JWT secret, or other privileged credential in frontend code or public repository files.

---

## Database Setup

The production commerce schema lives in:

```text
database/migrations/20261003_noirsaint_commerce.sql
```

For a fresh NOIRSAINT Supabase project:

1. Apply the commerce migration.
2. Apply the three catalog seed migrations.
3. Configure the frontend environment variables privately.
4. Start the application and verify catalog, authentication, inventory, and checkout flows.

The commerce migration provides:

- Profiles and admin state
- Categories and collections
- Products and product variants
- Product images
- Orders and order items
- Indexes
- Row Level Security policies
- Admin authorization helper
- New-user profile handling
- Authoritative order creation
- Stock updates with admin authorization

The checkout RPC validates price and stock in the database, locks the relevant variants, decrements inventory, and stores order-item snapshots.

---

## Administration

The application includes a dedicated administrative workspace for authorized NOIRSAINT administrators.

Admin authorization is controlled by:

```text
public.noirsaint_profiles.is_admin
```

Administrative capabilities include:

- Product creation and editing
- Variant and inventory management
- Low-stock monitoring
- Order management
- Inventory reporting
- CSV export
- Store analytics

The application does not rely on a client-side flag alone to authorize privileged database operations; Supabase RLS and database-side authorization are part of the commerce design.

---

## Quality & CI

NOIRSAINT uses automated checks before changes are considered integration-safe.

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs the same verification pipeline on `main` and pull requests:

```text
npm ci
  ↓
npm run lint
  ↓
npm test
  ↓
npm run build
```

The current `main` branch has a passing CI verification after the latest repository cleanup.

---

## Motion & Interaction System

Motion is treated as part of the product system rather than decorative effects added independently to each page.

The interface includes:

- Route/page transitions
- Scroll-reveal animations
- Hero stagger effects
- 3D NOIRSAINT logo layers
- Pointer-driven logo parallax
- Logo sheen, pulse, and ring motion
- Product/card interaction states
- Gallery and modal transitions
- Cart and wishlist feedback
- Admin interaction states
- Mobile-specific motion behavior
- `prefers-reduced-motion` support

The goal is controlled, brand-aligned movement that reinforces hierarchy and interaction feedback while remaining usable across devices.

---

## Project Structure

```text
.
├── database/
│   └── migrations/
├── public/
│   ├── images/
│   └── ...
├── scripts/
│   └── lint.mjs
├── src/
│   ├── components/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── vercel.json
└── README.md
```

The application is intentionally maintained as a focused NOIRSAINT codebase without unrelated product domains or legacy server scaffolding.

---

## Payments

The checkout interface currently supports the configured NOIRSAINT payment-method experience, including:

- Cash on Delivery
- GCash
- Bank Transfer

**A live third-party payment gateway is not currently connected.**

Payment-provider credentials and gateway integration should be added as a separate production step rather than treating the existing payment-method UI as proof of live payment processing.

---

## Deployment

The application is structured for Vercel/static SPA deployment.

The included `vercel.json` provides:

- SPA route rewriting
- Security response headers
- Supabase connection allowances
- Basic browser security policies

Before production launch, configure deployment environment variables privately and run a production smoke test covering:

1. Storefront navigation
2. Catalog loading
3. Authentication
4. Product and variant selection
5. Cart persistence
6. Checkout/order creation
7. Inventory decrement
8. Customer order history
9. Admin authentication
10. Admin inventory/order operations
11. Mobile layout and motion behavior

---

## Current Project Status

| Area | Status |
| --- | --- |
| Storefront | Complete |
| Commerce database | Complete |
| Catalog | Complete |
| Variant inventory | Complete |
| Authentication | Implemented |
| Admin workspace | Implemented |
| Orders | Implemented |
| Motion / 3D interaction | Implemented |
| Automated lint / test / build | Passing |
| Vercel production deployment | Pending |
| Production smoke test | Pending |
| Live payment gateway | Pending |

Passing CI confirms that the repository builds and its automated checks pass. It does **not** by itself certify production deployment, payment processing, or every live Supabase/RLS scenario.

---

## Contributing

NOIRSAINT is maintained with a production-minded workflow:

1. Keep changes scoped to the NOIRSAINT product.
2. Preserve the existing commerce and security model.
3. Avoid introducing client-side authority for inventory, pricing, or privileged operations.
4. Respect the established motion system and reduced-motion behavior.
5. Run lint, tests, and a production build before submitting changes.
6. Keep dependencies and architecture intentional rather than adding abstractions without a clear product need.
7. Never commit private environment files or credentials.

---

## License

No open-source license has been declared for this project. Unless otherwise stated by the project owner, the source code and brand assets should be treated as proprietary.
