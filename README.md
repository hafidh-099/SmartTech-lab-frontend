# SmartTech Lab frontend

Initial frontend shell for the offline-first lab management system.

## Setup

```sh
npm install
cp .env.example .env
npm run dev
```

The development server runs at <http://localhost:5173>.

Set `VITE_API_URL` to the backend API base URL. It defaults to
`http://localhost:3000/api/v1`.

## Theme

The light theme uses a soft grey-blue background in the `#bec0d1` family with
white panels and cards. The split-screen auth pages use a white branding panel
and a grey-blue form panel. The dark theme uses deep slate. Theme selection
supports light, dark, and system settings and is persisted by `next-themes`.

## Roles and routes

- Dean: `/dean/*`
- Technician: `/technician/*`
- Teacher: `/teacher/*`
- Super admin: `/super/*`

Protected pages require a signed-in user and redirect users without the
required role to their own dashboard. Dean, Technician, and Teacher dashboards
fetch role-scoped data through TanStack Query and display operational KPIs,
lists, and charts. Other feature pages currently render placeholders.

## Authentication

Login, Dean and Staff registration, email verification, and password reset
forms use React Hook Form and Zod and call the corresponding `/auth/*` API
endpoints. Dean registration is intentionally available only at `/setup`;
there is no public navigation link to it. Registration leads to email
verification; forgot-password leads directly to the reset form. The current
backend does not expose a resend-verification-code endpoint, so the verify
page reports this when its resend countdown finishes.

The auth store currently persists the access token, refresh token, and user in
local storage for the initial scaffold. Replace refresh-token persistence with
an httpOnly cookie before production use.

## Structure

- `src/components/layout`: app shell, navigation, split-screen auth, user menu, and theme controls
- `src/components/shared`: logos, shared page, loading, empty-state, and form helpers
- `src/components/ui`: shadcn/ui components
- `src/lib`: API client, query client, and class-name helper
- `src/routes`: authentication pages, protected route definitions, and dashboard placeholders
- `src/stores`: Zustand auth state
- `src/types`: API and auth types
