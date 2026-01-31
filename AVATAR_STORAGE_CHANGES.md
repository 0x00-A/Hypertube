# Avatar Storage - Quick Start

## What Changed?

Your avatar storage system has been refactored from base64/database storage to file-based storage.

### Before ❌
- Avatars stored as base64 strings in MongoDB
- Large database entries (~100KB per avatar)
- Slow responses with 5MB payload limits

### After ✅
- Avatars stored as files in `/uploads/avatars/`
- Only file paths in database (~50 bytes)
- Fast responses with 1MB payload limits
- Better caching and performance

## File Structure

```
server/
├── uploads/
│   └── avatars/
│       ├── .gitkeep
│       └── [uuid-timestamp.jpg files]
├── src/
│   ├── config/
│   │   └── multer.ts          # Multer configuration
│   ├── middleware/
│   │   └── uploadAvatar.ts    # Upload middleware
│   └── ...
└── guides/
    └── AVATAR_FILE_STORAGE.md # Complete documentation
```

## Key Changes

| File | Change |
|------|--------|
| `src/config/multer.ts` | **NEW** - Multer configuration for file uploads |
| `src/middleware/uploadAvatar.ts` | **NEW** - Upload middleware & cleanup helper |
| `src/routes/v1/users.routes.ts` | **UPDATED** - Added `handleAvatarUpload` middleware |
| `src/services/user.service.ts` | **UPDATED** - Added old avatar deletion logic |
| `src/validators/user.schema.ts` | **UPDATED** - Removed URL validation from avatarUrl |
| `src/app.ts` | **UPDATED** - Added static file serving & reduced payload limits |
| `uploads/avatars/` | **NEW** - Storage directory for avatar files |

## API Usage

### Upload Avatar (Frontend)

```typescript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');

fetch('/api/v1/users/update-profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData  // Don't set Content-Type header!
});
```

### Display Avatar

```typescript
const Avatar = ({ user }) => {
  const avatarUrl = user.avatarUrl 
    ? `${process.env.API_URL}${user.avatarUrl}`
    : '/default-avatar.png';
    
  return <img src={avatarUrl} alt={user.username} />;
};
```

## Testing

### Manual Test with cURL

```bash
# Upload avatar
curl -X POST http://localhost:3000/api/v1/users/update-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"

# Get user profile (returns avatar path)
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Access avatar directly
curl http://localhost:3000/uploads/avatars/filename.jpg
```

### Automated Test Script

```bash
# Edit the TOKEN variable in the script first
./scripts/test-avatar-upload.sh
```

## Important Notes

### ⚠️ Breaking Changes

1. **Frontend Must Change**: Frontend must now send `multipart/form-data` instead of JSON with base64
2. **Avatar URLs**: `avatarUrl` now contains paths like `/uploads/avatars/abc123.jpg` instead of base64 strings
3. **Response Format**: Profile responses are smaller (no base64 data)

### ✅ Automatic Cleanup

- Old avatars are automatically deleted when uploading new ones
- OAuth avatars (external URLs) are NOT deleted
- Cleanup errors don't break the update process

### 🔒 Security

- File type validation (JPEG, PNG, GIF, WebP only)
- File size limit (5MB maximum)
- Unique filename generation (UUID + timestamp)
- Authentication required for uploads

### 📦 Deployment

**Docker**: Ensure uploads directory is persisted:
```yaml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads
```

**Permissions**: Ensure write access:
```bash
chmod -R 755 server/uploads
```

## Dependencies Added

The avatar file storage feature uses the following packages (see `server/package.json` for the exact versions):
- `multer`
- `@types/multer`
- `uuid`
- `@types/uuid`

## Documentation

For complete documentation, see:
- **[guides/AVATAR_FILE_STORAGE.md](guides/AVATAR_FILE_STORAGE.md)** - Comprehensive implementation guide
- **[guides/GLOBAL_ERROR_HANDLING.md](guides/GLOBAL_ERROR_HANDLING.md)** - Error handling patterns

## Common Issues

### Issue: "File not found" errors
**Solution**: Ensure uploads directory exists:
```bash
mkdir -p server/uploads/avatars
```

### Issue: Images not loading in browser
**Solution**: Check static file configuration in `app.ts`:
```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### Issue: "File too large"
**Solution**: Increase limit in `src/config/multer.ts`:
```typescript
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

---

**Need Help?** Check the comprehensive guide at `guides/AVATAR_FILE_STORAGE.md`
