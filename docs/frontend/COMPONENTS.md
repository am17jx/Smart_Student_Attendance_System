# Key Frontend Components

## Core Components

### `ProtectedRoute.tsx`
**Location**: `src/components/ProtectedRoute.tsx`

**Purpose**: High-order component that prevents unauthorized access to routes.

**Props**:
-   `children`: React Node (The page to render).
-   `allowedRoles`: `string[]` (Optional). List of roles allowed to access this route.

**Logic**:
1.  Check if `user` exists in `AuthContext`. If not -> Redirect to `/login`.
2.  If `allowedRoles` is provided, check if `user.role` is in the list. If not -> Redirect to authorized dashboard.
3.  Render children.

### `AuthContext.tsx`
**Location**: `src/contexts/AuthContext.tsx`

**Purpose**: Manages global authentication state.

**State**:
-   `user`: Current user object.
-   `isLoading`: Auth check status.
-   `isAuthenticated`: Boolean helper.

**Methods**:
-   `login(email, password)`: Calls API, sets token in localStorage, updates state.
-   `logout()`: Clears token and state, calls API to invalidate session (best effort).

### `api.ts`
**Location**: `src/lib/api.ts`

**Purpose**: Centralized Axios instance.

**Features**:
-   **Request Interceptor**: Adds `Authorization: Bearer <token>` to every request.
-   **Response Interceptor**: Handles 401 errors (redirects to login) and global errors.

## Page Components

### `Login.tsx`
**Location**: `src/pages/Login.tsx`
-   Handles user login.
-   Collects device fingerprint (using browser features).
-   Redirects based on user role (`/dashboard/admin`, `/dashboard/teacher`, etc.).

### `Dashboard.tsx` (Wrapper)
**Location**: `src/pages/Dashboard.tsx`
-   Determines which specific dashboard to show based on the user's role.
-   It acts as a router/switcher for `AdminDashboard`, `TeacherDashboard`, etc.

### `Attendance.tsx`
**Location**: `src/pages/Attendance.tsx`
-   Displays attendance history for students.
-   Shows active sessions for teachers.
