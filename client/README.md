# 🎬 Hypertube - Frontend Client

A modern React + TypeScript frontend for the Hypertube movie streaming platform.

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **TanStack Query (React Query)** - Server state management
- **Redux Toolkit** - Client state management
- **React Player** - Video player
- **Lucide React** - Icons

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18+ recommended)
- npm or pnpm

### 2. Installation

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 3. Environment Setup

Create a `.env` file in the `client/` root based on `.env.example`:

```env
# API Base URL
VITE_API_URL=http://localhost:3000/api

# OAuth URL
VITE_OMNIAUTH_42_URL=http://localhost:3000/auth/42

# Image CDN URL (e.g., TMDB)
VITE_IMAGE_URL=https://image.tmdb.org/t/p
```

> **Note:** Variables must start with `VITE_` to be exposed to the browser.

### 4. Development Server

Start the local development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.


## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with HMR |
| `npm run build` | Compiles TypeScript and builds for production |
| `npm run lint` | Runs ESLint (must pass with 0 warnings) |
| `npm run preview` | Locally preview the production build |

## 📂 Project Structure

```
src/
├── components/         # Reusable components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components (Header, Footer)
│   ├── movie/         # Movie-related components
│   ├── user/          # User-related components
│   ├── common/        # Common components (Loader, Error)
│   └── ui/            # UI primitives (Button, Input, etc.)
│
├── layouts/           # Page layouts
│   └── MainLayout.tsx
│
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── browse/        # Browse movies
│   ├── library/       # User library
│   ├── movie/         # Movie details
│   ├── user/          # User profile
│   └── notFound/      # 404 page
│
├── services/          # API services
│   ├── http.ts        # HTTP client with interceptors
│   ├── auth.service.ts # Authentication API calls
│   ├── movie.service.ts
│   └── user.service.ts
│
├── redux/             # Redux Toolkit state management
│   ├── store.ts       # Store configuration
│   ├── hooks.ts       # Typed hooks (useAppDispatch, useAppSelector)
│   └── slices/
│       └── authSlice.ts # Auth state (user, isAuthenticated)
│
├── config/            # Configuration files
│   └── queryClient.ts # React Query configuration & query keys
│
├── hooks/             # Custom React hooks
│   └── useAuth.ts     # Authentication hooks (useLogin, useRegister, etc.)
│
├── types/             # TypeScript types
│   ├── auth.types.ts
│   ├── movie.types.ts
│   └── user.types.ts
│
├── utils/             # Utility functions
│   ├── formatDate.ts
│   ├── validate.ts
│   └── buildImageUrl.ts
│
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🗺️ Routing Map

```
/                              → Redirects to /browse
├── /auth/login                → Login page
├── /auth/register             → Registration page
├── /auth/forgot-password      → Password recovery
├── /auth/reset-password/:token → Password reset
│
├── /browse                    → Browse movies
├── /library                   → User's watched movies
├── /movie/:id                 → Movie details & player
│
├── /user/:id                  → Public user profile
└── /user/edit                 → Edit your profile
```

## 🎨 Component Guidelines

### UI Components (`components/ui/`)
Reusable, generic UI primitives:
- Button, Input, Select
- Modal, Card, Badge
- Avatar

### Feature Components
Domain-specific components:
- `components/auth/` - Auth forms
- `components/movie/` - Movie cards, player, comments
- `components/user/` - Profile cards
- `components/common/` - Loaders, error messages

### Pages
Full page components that use layouts and components.

## 🔐 Authentication

### Architecture

The authentication system uses **Redux Toolkit** for client state and **React Query** for server state:

```
## 🎬 Features

- ✅ User authentication (login, register, password reset)
- ✅ Redux Toolkit + React Query state management
- ✅ Cookie-based secure authentication
- ✅ Browse movies with search and filters (public access)
- ✅ Movie details with video player
- ✅ User profiles (public and editable)
- ✅ Personal library of watched movies
- ✅ Comment system
- 🔄 Real-time features (to be implemented)
│  - API queries (getCurrentUser)         │
│  - Automatic caching & refetching       │
└─────────────────────────────────────────┘
```

### How It Works

1. **Cookie-Based Auth**: HTTP-only cookies for secure token storage
2. **AuthProvider**: Initializes auth state on app startup
3. **Smart Caching**: React Query caches user data intelligently
4. **Auto State Management**: Login/logout automatically updates Redux & cache
5. **401 Handling**: Automatic redirect on unauthorized requests

### Available Hooks

```tsx
// Get auth state
const { user, isAuthenticated } = useAuthState();

// Authentication mutations
const { mutate: login } = useLogin();
const { mutate: register } = useRegister();
const { mutate: logout } = useLogout();

// Profile management
const { mutate: updateProfile } = useUpdateProfile();
const { mutate: changePassword } = useChangePassword();

// Password reset
const { mutate: forgotPassword } = useForgotPassword();
const { mutate: resetPassword } = useResetPassword();
```

### Usage Example

```tsx
// In a login page
import { useLogin } from '../hooks/useAuth.js';

export const Login = () => {
  const { mutate: login, isPending, error } = useLogin();
  
  const handleSubmit = (data) => {
    login(data); // Automatically updates Redux & navigates
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p>{error.message}</p>}
      <button disabled={isPending}>Login</button>
    </form>
  );
};
```

For complete documentation, see `AUTHENTICATION_SETUP.md`

## 🎬 Features

- ✅ User authentication (login, register, password reset)
- ✅ Browse movies with search and filters
- ✅ Movie details with video player
- ✅ User profiles (public and editable)
- ✅ Personal library of watched movies
- ✅ Comment system
- 🔄 Redux state management (to be implemented)
- 🔄 Real-time features (to be implemented)
## 📝 Development Notes

### State Management

**Redux Toolkit** is configured for client state (user info, auth status):
- Store: `src/redux/store.ts`
- Auth Slice: `src/redux/slices/authSlice.ts`
- Typed Hooks: `src/redux/hooks.ts`

**React Query** handles server state (API calls, caching):
- Configuration: `src/config/queryClient.ts`
- Query Keys: Organized by domain (auth, movies, comments)
- Smart caching with 5-minute stale time

### Why Both?
- **Redux** = Fast local access to current user (no API calls)
- **React Query** = Handles all API communication & caching
- **Together** = Clean separation, each does what it's best at

### API Integration
### API Integration
Services are pre-configured to work with the backend API. Update the `VITE_API_URL` in `.env` to point to your backend.

### Styling
Using TailwindCSS with custom utility classes. Components follow a consistent design system.


## 📱 Browser Compatibility

The application is tested and optimized for:

* **Google Chrome** (Latest)
* **Mozilla Firefox** (Latest)
* **Mobile Viewports** (iPhone SE / Pixel 5 dimensions)
