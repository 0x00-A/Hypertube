import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IMovieFiltersState } from "../../types/movieFilter.types";

export interface IHistoryFiltersState extends IMovieFiltersState {
  search: string;
}

const initialState: IHistoryFiltersState = {
  sortBy: "lastUpdated",
  sortOrder: "desc",
  genre: "All",
  minRating: 0,
  year: 0,
  search: "",
};

const historyFiltersSlice = createSlice({
  name: "historyFilters",
  initialState,
  reducers: {
    setHistorySortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    setHistorySortOrder: (state, action: PayloadAction<"asc" | "desc">) => {
      state.sortOrder = action.payload;
    },
    setHistoryGenre: (state, action: PayloadAction<string>) => {
      state.genre = action.payload;
    },
    setHistoryMinRating: (state, action: PayloadAction<number>) => {
      state.minRating = action.payload;
    },
    setHistoryYear: (state, action: PayloadAction<number>) => {
      state.year = action.payload;
    },
    setHistorySearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    resetHistoryFilters: () => initialState,
  },
});

export const {
  setHistorySortBy,
  setHistorySortOrder,
  setHistoryGenre,
  setHistoryMinRating,
  setHistoryYear,
  setHistorySearch,
  resetHistoryFilters,
} = historyFiltersSlice.actions;

export default historyFiltersSlice.reducer;
