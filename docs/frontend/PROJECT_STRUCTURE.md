# Frontend Project Structure

The frontend is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It uses **shadcn/ui** for UI components.

## Directory Layout

```
smooth-frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui primitive components (Button, Input, etc.)
│   │   ├── ProtectedRoute.tsx # Route guard component
│   │   └── ...
│   ├── contexts/           # React Contexts (AuthContext, etc.)
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Utilities and libraries (api.ts, utils.ts)
│   ├── pages/              # Page components (routed views)
│   │   ├── auth/           # Authentication pages (Login, ForgotPassword)
│   │   ├── Dashboard.tsx   # Main dashboard handling
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main Application component & Routing
│   └── main.tsx            # Entry point
├── public/                 # Static assets
└── ...
```

## Key Architectural Decisions

### 1. Component Library (`components/ui`)
We use **shadcn/ui**, which is not a component library you install as a dependency, but rather code you copy into your project. This gives us full control over the component styles.

### 2. API Integration (`lib/api.ts`)
All API calls are centralized in `src/lib/api.ts`. This file exports an `axios` instance configured with interceptors to handle:
-   **Auth Tokens**: Automatically attaching the Bearer token.
-   **Error Handling**: Global error responses.

### 3. Authentication (`contexts/AuthContext.tsx`)
Managed via React Context. It initializes by checking `localStorage` for a token and user data. It exposes `login`, `logout`, and `user` state to the entire app.

### 4. Routing & Security (`App.tsx`)
Routes are defined using `react-router-dom`.
-   **Public Routes**: Login, Forgot Password.
-   **Protected Routes**: Wrapped in `<ProtectedRoute>`.
-   **Role-Based Access**: `<ProtectedRoute>` accepts an `allowedRoles` prop to restrict access to Admin, Teacher, or Student only.

## Styling
Styling is handled by **Tailwind CSS**. We use a `globals.css` file for base styles and Tailwind utility classes directly in components.
