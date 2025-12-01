# 🎬 Hypertube - Frontend Client

This is the client-side application for Hypertube, built with **React**, **TypeScript**, and **Vite**. It interacts with the Hypertube API to provide a seamless video streaming experience.

## 🛠️ Tech Stack

* **Core:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Lucide React (Icons)
* **State & Fetching:** TanStack Query (React Query), Axios
* **Routing:** React Router DOM
* **Forms:** React Hook Form + Zod (Schema Validation)

## 🚀 Getting Started

### 1\. Prerequisites

* Node.js (v18+ recommended)
* npm or pnpm

### 2\. Installation

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 3\. Environment Setup

Create a `.env` file in the `client/` root.

> **Note:** Variables must start with `VITE_` to be exposed to the browser.

```env
# .env
VITE_API_URL=http://localhost:3000/api
VITE_OMNIAUTH_42_URL=http://localhost:3000/auth/42
```

### 4\. Development Server

Start the local development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with HMR. |
| `npm run build` | Compiles the TypeScript code to production-ready HTML/JS. |
| `npm run lint` | Runs ESLint. **Must pass with 0 warnings.** |
| `npm run preview` | Locally preview the production build. |

## 📂 Project Structure

We follow a **Feature-Based** architecture to keep the code modular and scalable.

```text
src/
├── components/         # Shared UI components
│   ├── ui/             # Atoms (Buttons, Inputs, Cards)
│   └── ...
├── features/           # Feature-based modules
│   └── library/        # Library feature
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       └── utils/      # Feature-specific utilities
├── hooks/              # Custom React hooks (useAuth, useDebounce)
├── layouts/            # Page layouts (Header, Footer wrappers)
├── pages/              # Main route views
│   ├── Auth/           # Login & Register forms
│   ├── Library/        # Movie Grid & Search logic
│   └── Movie/          # Video Player & Comments
├── services/           # Axios setup & API endpoints
├── store/              # Global state management
├── types/              # TypeScript interfaces (User, Movie)
└── utils/              # Helper functions (validation, formatting)
```

## ⚠️ Strict Coding Standards

1. **Do not ignore linter warnings.** If ESLint complains, fix it.
2. **No `any` types.** Define proper interfaces in `src/types/`.
3. **Check Console:** frequently check the browser console (F12) to ensure no React "key" warnings or hydration errors appear.

## 📱 Browser Compatibility

The application is tested and optimized for:

* **Google Chrome** (Latest)
* **Mozilla Firefox** (Latest)
* **Mobile Viewports** (iPhone SE / Pixel 5 dimensions)
