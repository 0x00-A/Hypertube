# Redux State Management

This directory is reserved for Redux state management setup.

## Structure

```
redux/
├── store.ts          # Redux store configuration
├── slices/           # Redux Toolkit slices
├── actions/          # Redux actions (if needed)
└── reducers/         # Redux reducers (if needed)
```

## TODO

When implementing Redux, install the following packages:

```bash
npm install @reduxjs/toolkit react-redux
```

Then set up:
1. Configure the store in `store.ts`
2. Create slices for auth, movies, and user state
3. Wrap the app with Redux Provider in `main.tsx`
