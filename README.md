# Launchyard

A multi-tenant store builder. An owner fills in the shop, picks categories and a theme, and gets a live storefront plus an admin desk.

## Run it

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000 and create an account. The store address is a path, `/s/your-store`, which is the local stand-in for `your-store.yourplatform.com`.

```bash
npm test
```

## Phases

1. **Account and onboarding** — signup, step wizard, logo, contact, address, categories, unique `/s/slug`.
2. **Catalog** — one-click sample products, or Excel/CSV with a template, column mapping, preview, and an error report.
3. **Themes** — Harbor, Bazaar, Atelier, and Grove. Preview colors, type, and layout before confirming.
4. **Storefront** — home, category, product, search, filters, cart, checkout.
5. **Admin** — revenue and orders, low stock, content, inventory, bulk edit, variants, order status with a saved customer email.
6. **Isolation** — every admin query is scoped to the store. Roles are owner and staff. Staff cannot change the theme, content, team, or assistant.
7. **Assistant** — read-only answers for the owner, with the rows behind each number. Unknown questions return "I don't have that data."
8. **Responsive layout** — wizard, shop, and admin reflow on a narrow screen.
