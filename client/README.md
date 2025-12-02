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
- **TanStack Query (React Query)** - Data fetching
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
│   ├── http.ts        # HTTP client
│   ├── auth.service.ts
│   ├── movie.service.ts
│   └── user.service.ts
│
├── redux/             # State management (placeholder)
│   ├── store.ts
│   ├── slices/
│   ├── actions/
│   └── reducers/
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
/                              → Redirects to /browse or /auth/login
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

Authentication is handled via HTTP-only cookies. The HTTP client automatically:
- Sends authentication cookies with requests (`withCredentials: true`)
- Redirects to login on 401 errors
- Relies on the backend for JWT token management in secure cookies

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
The `redux/` folder is prepared for Redux Toolkit integration. To implement:

```bash
npm install @reduxjs/toolkit react-redux
```

### API Integration
Services are pre-configured to work with the backend API. Update the `VITE_API_URL` in `.env` to point to your backend.

### Styling
Using TailwindCSS with custom utility classes. Components follow a consistent design system.


## 📱 Browser Compatibility

The application is tested and optimized for:

* **Google Chrome** (Latest)
* **Mozilla Firefox** (Latest)
* **Mobile Viewports** (iPhone SE / Pixel 5 dimensions)
