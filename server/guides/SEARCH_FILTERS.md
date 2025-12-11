```
Here are the filters your client can offer, based on your schema and backend support:

### 1. **Search**
- **Type:** Text input
- **Purpose:** Search by movie title (partial match, case-insensitive).

### 2. **Year**
- **Type:** Dropdown/select
- **Options:** Years from 1900 to next year (e.g., 1900–2026)
- **Purpose:** Filter movies by release year.

### 3. **Genre**
- **Type:** Dropdown/select (single)
- **Options:** List of genres (e.g., Action, Comedy, Drama, etc.)
- **Purpose:** Filter movies by genre.

### 4. **Minimum Rating**
- **Type:** Slider or dropdown
- **Options:** 0–10 (can be steps of 0.5 or 1)
- **Purpose:** Show only movies with rating above a certain value.

### 5. **Sort By**
- **Type:** Dropdown
- **Options:**
  - `lastUpdated` (default, newest in DB first)
  - `rating` (highest/lowest rated)
  - `year` (newest/oldest movies)
  - `title` (A-Z or Z-A)

### 6. **Sort Order**
- **Type:** Toggle or dropdown
- **Options:** Ascending (`asc`) / Descending (`desc`)
- **Purpose:** Change the order of the sorted results.

---

**Example UI controls:**
- Search bar (text)
- Year dropdown (e.g., 2025, 2024, ..., 1900)
- Genre dropdown (from your genre list)
- Minimum rating slider (0–10)
- Sort by dropdown (lastUpdated, rating, year, title)
- Sort order toggle (asc/desc)

```

movie duration, trailer, backdrop image, and rating can be null or 0

---

Summarized conversation historyLet’s review the `SEARCH_FILTERS.md` guide for edge cases that could cause problems in the client or backend integration:

<!-- ### 1. Search (Text Input)

- **Edge Case:** User enters only whitespace or an empty string.
  - **Impact:** Backend expects at least 1 character; empty/whitespace-only input should be rejected or trimmed on the client.
- **Edge Case:** Special characters or SQL-like wildcards in search.
  - **Impact:** Could affect regex search or cause unexpected results. -->

### 2. Year (Dropdown/Select)

- **Edge Case:** Year outside the allowed range (before 1900 or after next year).
  - **Impact:** Backend validation will reject; client should restrict options.
- **Edge Case:** Non-integer or malformed year (e.g., "20O1" with letter O).
  - **Impact:** Backend expects a 4-digit number; malformed input will be rejected.

### 3. Genre (Dropdown/Select)

- **Edge Case:** Genre not in the allowed list (e.g., typo or custom entry).
  - **Impact:** Backend may ignore or reject; client should restrict to known genres.

### 4. Minimum Rating (Slider/Dropdown)

- **Edge Case:** Value outside 0–10 range, or non-numeric input.
  - **Impact:** Backend will reject; client should enforce range and type.

### 5. Sort By / Sort Order

- **Edge Case:** Invalid sort field or order (e.g., typo, unsupported value).
  - **Impact:** Backend will reject or default; client should restrict to allowed options.

### 6. Combined Filters

- **Edge Case:** Filters that result in no matches (e.g., rare genre + high rating + old year).
  - **Impact:** Empty result set; client should handle gracefully (show “no results” message).

### 7. Null/Zero Values

- **Edge Case:** Movies with `null` or `0` for duration, trailer, backdrop, or rating.
  - **Impact:** Client must handle these gracefully (e.g., show “N/A”, hide trailer button, use fallback images).

### 8. Pagination

- **Edge Case:** Page number out of range (e.g., negative, zero, or beyond total pages).
  - **Impact:** Backend will default or return empty; client should prevent invalid navigation.

### 9. API/Network Errors

- **Edge Case:** Backend returns error (validation, 500, etc.).
  - **Impact:** Client should display user-friendly error messages.

---

**Summary:**
Most edge cases are already handled by backend validation, but the client must:

- Restrict/filter user input to valid values.
- Handle empty/null/zero fields gracefully in the UI.
- Display clear messages for no results or errors.
- Never trust user input—always validate before sending to the API.

If you want, I can add a section to the guide listing these edge cases and recommended handling. Let me know!
