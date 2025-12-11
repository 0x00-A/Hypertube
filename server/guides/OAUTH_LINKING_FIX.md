# User Repository - OAuth Linking Fix

## Issue Fixed
The `linkOAuthAccount` method had potential data loss issues due to improper MongoDB update syntax.

## Problems Identified

### 1. **Direct Field Assignment Instead of `$set`**
```typescript
// ❌ BEFORE: Direct assignment can cause data loss
await UserModel.findByIdAndUpdate(userId, {
  'oauth.provider': oauth.provider,
  'oauth.id': oauth.id
}, { new: true });
```

**Problem:** When you pass an object directly to `findByIdAndUpdate`, MongoDB treats it as a replacement operation for nested objects. This could potentially overwrite other fields if the schema changes.

### 2. **No User Existence Validation**
The method didn't verify if the user exists before attempting to link OAuth, leading to unclear errors.

### 3. **No `runValidators` Option**
Without `runValidators: true`, Mongoose doesn't run schema validators during updates, potentially allowing invalid data.

## Solution Implemented

### Updated Method
```typescript
async linkOAuthAccount(userId: string, oauth: IOAuth): Promise<Partial<IUser> | null> {
  // 1. Verify user exists first
  const existingUser = await UserModel.findById(userId).select('+oauth').exec();
  if (!existingUser) {
    return null; // Clear error: user not found
  }

  // 2. Optional: Check if OAuth already linked (currently commented out)
  // if (existingUser.oauth?.provider && existingUser.oauth?.id) {
  //   throw new Error(`User already has ${existingUser.oauth.provider} OAuth linked`);
  // }

  // 3. Use $set operator for safe nested field updates
  const doc = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        'oauth.provider': oauth.provider,
        'oauth.id': oauth.id
      }
    },
    { 
      new: true,           // Return updated document
      runValidators: true  // Run schema validators
    }
  ).exec();

  if (!doc) return null;
  return this.toIUser(doc);
}
```

## Benefits

### 1. **Data Safety with `$set`**
- ✅ Only updates specified fields
- ✅ Preserves other fields in the oauth object
- ✅ Explicit about what's being changed
- ✅ MongoDB best practice for nested object updates

### 2. **Better Error Handling**
- ✅ Pre-flight check for user existence
- ✅ Clear return values (null = user not found)
- ✅ Can be extended to check for existing OAuth links

### 3. **Schema Validation**
- ✅ `runValidators: true` ensures enum values are validated
- ✅ Catches invalid provider types ('google' | 'fortytwo')
- ✅ Prevents data corruption at the database level

## Testing

### Added Tests

1. **Non-existent User Handling**
```typescript
it('should handle non-existent user when linking OAuth account', async () => {
  const nonExistentId = new mongoose.Types.ObjectId().toString();
  const result = await userRepo.linkOAuthAccount(nonExistentId, {
    provider: 'google',
    id: 'google123'
  });
  expect(result).toBeNull(); // ✅ Returns null, not error
});
```

2. **Data Integrity Verification**
```typescript
it('should properly update OAuth fields without data loss', async () => {
  const user = await userRepo.create({
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword123',
    firstName: 'Test',
    lastName: 'User',
  });

  const linkedUser = await userRepo.linkOAuthAccount(user._id!, {
    provider: 'google',
    id: 'google123'
  });

  // ✅ All original fields preserved
  expect(linkedUser?.email).toBe('test@example.com');
  expect(linkedUser?.username).toBe('testuser');
  expect(linkedUser?.firstName).toBe('Test');
  expect(linkedUser?.lastName).toBe('User');
  
  // ✅ OAuth fields correctly set
  const dbUser = await UserModel.findById(user._id).select('+oauth').exec();
  expect(dbUser?.oauth?.provider).toBe('google');
  expect(dbUser?.oauth?.id).toBe('google123');
});
```

## Future Considerations

### Optional: Prevent OAuth Overwriting
Currently commented out, but can be enabled to prevent users from overwriting an existing OAuth link:

```typescript
// Check if user already has OAuth linked
if (existingUser.oauth?.provider && existingUser.oauth?.id) {
  throw new ConflictError(
    `User already has ${existingUser.oauth.provider} OAuth linked. ` +
    `Cannot link ${oauth.provider} without unlinking first.`
  );
}
```

**When to enable:**
- ✅ If business logic requires one OAuth provider per user
- ✅ To prevent accidental overwriting
- ❌ Don't enable if users should be able to switch providers

### Multiple OAuth Providers
If you want to support multiple OAuth providers (e.g., both Google and 42):

```typescript
// Change schema to array
oauth: [{
  provider: { type: String, enum: ['google', 'fortytwo'] },
  id: { type: String },
  _id: false
}]

// Update method to use $push
const doc = await UserModel.findByIdAndUpdate(
  userId,
  { $addToSet: { oauth: oauth } }, // addToSet prevents duplicates
  { new: true, runValidators: true }
);
```

## Migration Notes

### Breaking Changes
None - this is a bug fix that makes the existing behavior safer.

### Backward Compatibility
✅ Fully backward compatible - method signature unchanged
✅ Return values unchanged (null | IUser)
✅ Existing tests pass without modification

## MongoDB Update Operators Reference

| Operator | Use Case | Data Safety |
|----------|----------|-------------|
| Direct object | Replace entire field | ⚠️ Can lose data |
| `$set` | Update specific fields | ✅ Safe |
| `$unset` | Remove fields | ✅ Explicit |
| `$push` | Add to array | ✅ Safe |
| `$addToSet` | Add to array (no dups) | ✅ Safe |

## Related Files

- ✅ `/server/src/repositories/user.repository.ts` - Updated method
- ✅ `/server/tests/integration/oauth.test.ts` - Added tests
- ✅ `/server/src/services/oauth.service.ts` - Consumer (no changes needed)
