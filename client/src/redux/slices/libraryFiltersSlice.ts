import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IMovieFiltersState } from '../../types/movieFilter.types';

interface ILibraryFiltersState extends IMovieFiltersState {
    search: string;
}

const initialState: ILibraryFiltersState = {
    sortBy: 'lastUpdated',
    sortOrder: 'desc',
    genre: 'All',
    minRating: 0,
    year: 0,
    search: '',
};

const libraryFiltersSlice = createSlice({
    name: 'libraryFilters',
    initialState,
    reducers: {
        setSortBy: (state, action: PayloadAction<string>) => {
            state.sortBy = action.payload;
        },
        setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
            state.sortOrder = action.payload;
        },
        setGenre: (state, action: PayloadAction<string>) => {
            state.genre = action.payload;
        },
        setMinRating: (state, action: PayloadAction<number>) => {
            state.minRating = action.payload;
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.year = action.payload;
        },
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
        },
        resetFilters: () => initialState,
    },
});

export const {
    setSortBy,
    setSortOrder,
    setGenre,
    setMinRating,
    setYear,
    setSearch,
    resetFilters,
} = libraryFiltersSlice.actions;

export default libraryFiltersSlice.reducer;
