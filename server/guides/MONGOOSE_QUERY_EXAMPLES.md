# Mongoose Query Return Types - Examples

## 1. Without `.lean()` and without `.exec()`

```typescript
const movie = await MovieModel.findById(id);
```

**Returns:** `Query<IMovieDocument | null, IMovieDocument>`
**What you get:** Mongoose Document instance

```javascript
// Example response
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  title: "Inception",
  year: 2010,
  rating: 8.8,

  // Mongoose magic methods ✨
  save: [Function],
  validate: [Function],
  remove: [Function],
  toObject: [Function],
  toJSON: [Function],

  // Hidden properties
  $__: { ... },        // Internal Mongoose state
  $isNew: false,
  isModified: [Function],
  _doc: { ... },       // Actual data

  // Virtuals work
  get fullTitle() { return this.title + " (" + this.year + ")" }
}
```

**Pros:**

- Can call `.save()`, `.remove()`, etc.
- Virtuals work
- Middleware runs
- Validation available

**Cons:**

- Heavy object (40-50KB overhead)
- Slower serialization
- TypeScript types can be confusing

---

## 2. With `.lean()`

```typescript
const movie = await MovieModel.findById(id).lean();
```

**Returns:** Plain JavaScript Object
**What you get:** Just the data, no Mongoose magic

```javascript
// Example response
{
  _id: "507f1f77bcf86cd799439011",  // Plain string, not ObjectId
  title: "Inception",
  year: 2010,
  rating: 8.8,
  torrents: [
    { quality: "1080p", seeds: 150, ... }
  ],

  // No methods
  // No hidden properties
  // Just pure JSON-like data
}
```

**Pros:**

- Fast (3-5x faster)
- Lightweight (no overhead)
- Clean JSON response
- Perfect for APIs

**Cons:**

- Can't call `.save()`, `.remove()`
- No virtuals
- No validation
- Read-only

---

## 3. With `.lean<Type>()`

```typescript
const movie = await MovieModel.findById(id).lean<IMovie>();
```

**Returns:** Plain object **typed as** `IMovie | null`

```typescript
// TypeScript knows the exact type
const movie: IMovie | null = await MovieModel.findById(id).lean<IMovie>();

// Now you get autocomplete for:
movie?.title; // ✅ string
movie?.year; // ✅ number
movie?.torrents; // ✅ ITorrent[]
```

**This is the best for APIs!**

---

## 4. With `.exec()`

```typescript
const movie = await MovieModel.findById(id).exec();
```

**Returns:** Same as without `.exec()` - Mongoose Document

**Why use it?**

- Returns a **real Promise** (not a thenable Query)
- Better for TypeScript inference
- Works better with Promise utilities like `Promise.all()`

```typescript
// Without .exec() - returns Query (thenable)
const query = MovieModel.findById(id);
query.then(...);  // Works but it's a Query

// With .exec() - returns Promise
const promise = MovieModel.findById(id).exec();
promise.then(...);  // Real Promise
```

---

## 5. Combining `.lean()` and `.exec()`

```typescript
const movie = await MovieModel.findById(id).lean().exec();
```

**Same as just `.lean()`** - returns plain object
The `.exec()` just makes it a real Promise.

---

## When to Use What?

### Use `.lean()` when:

- ✅ Sending data to API responses
- ✅ Read-only operations
- ✅ Performance matters
- ✅ You need plain JSON

### Don't use `.lean()` when:

- ❌ You need to call `.save()` or modify the doc
- ❌ You need virtuals to run
- ❌ You need pre/post middleware

---

## Real-World Example for Our API

```typescript
// ❌ BAD - Returns Mongoose document with overhead
async findById(id: string): Promise<IMovieDocument | null> {
  return MovieModel.findById(id) as any;  // Heavy, needs 'as any'
}

// ✅ GOOD - Returns plain object, typed correctly
async findById(id: string): Promise<IMovie | null> {
  return MovieModel.findById(id).lean<IMovie>();  // Fast, clean, typed
}
```

```typescript
// API Response Comparison:

// Without .lean() - 42KB response
{
  _id: ObjectId(...),
  title: "Inception",
  $__: { ... 30KB of Mongoose internals ... },
  _doc: { ... },
  // ... lots of hidden properties
}

// With .lean() - 2KB response
{
  _id: "507f1f77bcf86cd799439011",
  title: "Inception",
  year: 2010,
  rating: 8.8
}
```

---

## Summary Table

| Method                 | Return Type        | Use Case            | Speed   |
| ---------------------- | ------------------ | ------------------- | ------- |
| `find()`               | Mongoose Document  | Need to modify/save | Slow    |
| `find().lean()`        | Plain Object       | API responses       | Fast ✅ |
| `find().lean<T>()`     | Typed Plain Object | API + TypeScript    | Fast ✅ |
| `find().exec()`        | Mongoose Document  | Better Promises     | Slow    |
| `find().lean().exec()` | Plain Object       | API + Real Promise  | Fast ✅ |

**For our Hypertube API: Always use `.lean<IMovie>()`**
