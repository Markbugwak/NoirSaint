# NOIRSAINT — Updated Fashion E-commerce System

**CRAFTED WITHOUT LIMITS.**

NOIRSAINT is a dark-luxury fashion e-commerce experience built with React + Vite and the supplied NOIRSAINT visual assets.

## Included

- 30-product catalog using the supplied product imagery
- Product detail pages with gallery, size selector, size guide, wishlist-ready UI, quantity controls, and SKU display
- Product variants with product-specific sizes, color, SKU, price, and stock
- Size-specific inventory: buying one size only reduces that exact variant
- Cart persistence with exact size/SKU/variant information
- Checkout and order creation with variant-level order items
- Customer order confirmation
- Shop filters, search, category filtering, sorting, and availability-aware size display
- Admin overview, product CRUD, variant inventory editor, inventory dashboard, CSV export, orders, and analytics
- Low-stock and out-of-stock status handling
- Mobile-responsive customer and admin interfaces

## Run

```bash
npm install
npm run dev
```

For the local API scaffold:

```bash
npm run server
```

The storefront uses browser localStorage for its demo persistence layer, so it works immediately without requiring a separate database service. The service modules are separated so a production database/API can be connected without changing the customer-facing data model.

## Admin

Open the store, then use `#admin` in the URL (or the admin links surfaced by the application) to access the management interface.

## Variant model

Each product follows:

`Product → Variant → Size/Color/SKU → Stock`

For example, if Signature Tee / Black / M is purchased twice, only the M variant is reduced. Other sizes remain unchanged.

## Final system notes

- Customer-facing prices use centralized USD formatting via `src/utils/formatCurrency/formatCurrency.js`.
- Lookbook and Collections support both hash navigation and direct path access under a Vite/static SPA deployment.
- Product size guides use category-specific SVG assets under `public/images/size-chart/`.
- Wishlist state persists locally in the browser.
- The included account screens provide local browser account/session behavior for the prototype. Production deployment should connect these screens to the existing server/database layer before handling real customer credentials.
