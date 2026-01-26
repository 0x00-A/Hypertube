# Avatar File Storage System

## Overview

This guide explains the file-based avatar storage system that replaced the previous base64/binary storage approach. This refactoring improves performance, reduces database size, and follows best practices for handling user-uploaded files.

## Architecture

### Before (Base64 Storage)

- Avatars stored as base64 strings directly in MongoDB
- Large response payloads (can be 100KB+ per avatar)
- Increased database size and slower queries
- 5MB JSON payload limits required

### After (File Storage)

- Avatars stored as files in `/uploads/avatars` directory
- Only file paths stored in database (e.g., `/uploads/avatars/uuid-timestamp.jpg`)
- Served via Express static file middleware
- Reduced payload sizes to ~1MB

## Implementation Details

### 1. File Storage Configuration

**Location**: `src/config/multer.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, filename);
  },
});
```

**Key Features**:

- **Unique Filenames**: Combines UUID v4 with timestamp to prevent conflicts
- **Storage Location**: `server/uploads/avatars/`
- **File Types**: JPEG, PNG, GIF, WebP only
- **Size Limit**: 5MB per file

### 2. Upload Middleware

**Location**: `src/middleware/uploadAvatar.ts`

The `handleAvatarUpload` middleware:

1. Accepts a file from the `avatar` field in multipart/form-data
2. Validates file type and size using multer
3. Saves the file with a unique name
4. Attaches the file path to `req.body.avatarUrl`

**Helper Function**: `deleteOldAvatar(avatarPath: string)`

- Safely deletes old avatar files when users upload a new one
- Skips external URLs (OAuth avatars)
- Handles errors gracefully without breaking updates

### 3. Database Schema

**Model**: `src/models/User.ts`

```typescript
avatarUrl: {
  type: String;
}
```

**Stored Values**:

- Local uploads: `/uploads/avatars/uuid-timestamp.jpg`
- OAuth avatars: `https://...` (external URLs)
- No avatar: `undefined` or `null`

### 4. API Endpoint

**Route**: `POST /api/v1/users/update-profile`

**Middleware Chain**:

```typescript
auth → handleAvatarUpload → validate(UpdateProfileSchema) → controller.updateProfile
```

**Request Format**:

```http
POST /api/v1/users/update-profile
Content-Type: multipart/form-data
Authorization: Bearer <token>

avatar: <file>
firstName: John
lastName: Doe
language: en
```

**Response**:

```json
{
  "status": "success",
  "message": "Profile updated successfully"
}
```

### 5. Static File Serving

**Configuration**: `src/app.ts`

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

**Access URLs**:

- Local: `http://localhost:3000/uploads/avatars/abc123-1234567890.jpg`
- Production: `https://yourdomain.com/uploads/avatars/abc123-1234567890.jpg`

### 6. Service Layer Logic

**Location**: `src/services/user.service.ts`

When updating a profile with a new avatar:

1. Fetch the current user to get the old avatar path
2. Delete the old avatar file using `deleteOldAvatar()`
3. Update the database with the new avatar path

```typescript
async updateProfile(username: string, newData: IUserProfileUpdate): Promise<void> {
  if (newData.avatarUrl) {
    const user = await this._repo.findByUsernameWithOauth(username);
    if (user?.avatarUrl) {
      deleteOldAvatar(user.avatarUrl);
    }
  }
  await this._repo.updateByUsername(username, newData);
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
const uploadAvatar = async (file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('firstName', 'John');
  formData.append('lastName', 'Doe');

  const response = await fetch('http://localhost:3000/api/v1/users/update-profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

### React Example

```tsx
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await fetch('/api/v1/users/update-profile', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (response.ok) {
      console.log('Avatar uploaded successfully');
    }
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Usage in component
<input type="file" accept="image/*" onChange={handleAvatarUpload} />;
```

### Displaying Avatars

```tsx
const Avatar = ({ user }: { user: IUser }) => {
  const avatarUrl = user.avatarUrl
    ? `${import.meta.env.VITE_API_URL}${user.avatarUrl}`
    : '/images/default-avatar.png';

  return <img src={avatarUrl} alt={user.username} />;
};
```

## Testing

### Manual Testing with cURL

```bash
# Upload avatar
curl -X POST http://localhost:3000/api/v1/users/update-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg" \
  -F "firstName=John" \
  -F "lastName=Doe"

# Get user profile (returns avatar path)
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Access avatar directly
curl http://localhost:3000/uploads/avatars/abc123-1234567890.jpg --output avatar.jpg
```

### Unit Testing

```typescript
import request from 'supertest';
import path from 'path';

describe('Avatar Upload', () => {
  it('should upload avatar successfully', async () => {
    const response = await request(app)
      .post('/api/v1/users/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', path.join(__dirname, 'fixtures/test-avatar.jpg'))
      .field('firstName', 'John');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  it('should reject non-image files', async () => {
    const response = await request(app)
      .post('/api/v1/users/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', path.join(__dirname, 'fixtures/document.pdf'));

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Only image files are allowed');
  });
});
```

## Error Handling

All avatar upload errors are handled by the global error handler:

| Error             | Status | Message                                             |
| ----------------- | ------ | --------------------------------------------------- |
| File too large    | 400    | File size exceeds 5MB limit                         |
| Invalid file type | 400    | Only image files are allowed (JPEG, PNG, GIF, WebP) |
| No file provided  | 200    | Profile updated without avatar change               |
| Upload failure    | 400    | File upload failed                                  |

## Best Practices

### 1. File Naming

- ✅ Use UUID + timestamp for uniqueness
- ✅ Preserve original file extension
- ❌ Don't use user-provided filenames (security risk)

### 2. Validation

- ✅ Validate file types using mime types
- ✅ Set reasonable file size limits (5MB)
- ✅ Use multer's built-in validators

### 3. Storage

- ✅ Store files outside the `src` directory
- ✅ Use absolute paths in multer config
- ✅ Create uploads directory in `.gitignore` but keep `.gitkeep`

### 4. Cleanup

- ✅ Delete old avatars when uploading new ones
- ✅ Handle deletion errors gracefully
- ❌ Don't delete OAuth avatars (external URLs)

### 5. Security

- ✅ Validate file types on the backend (never trust frontend)
- ✅ Use authentication middleware
- ✅ Sanitize file paths to prevent directory traversal
- ✅ Set appropriate CORS headers for static files

## Performance Benefits

| Metric            | Before (Base64)  | After (File Storage) | Improvement      |
| ----------------- | ---------------- | -------------------- | ---------------- |
| Avatar size in DB | ~100KB           | ~50 bytes (path)     | 99.95% reduction |
| JSON payload      | 5MB limit needed | 1MB limit sufficient | 80% reduction    |
| Database size     | Large            | Minimal impact       | Significant      |
| Query speed       | Slower           | Faster               | Noticeable       |
| Browser caching   | Not possible     | Full caching support | Better UX        |

## Deployment Considerations

### Docker

Ensure the uploads directory is persisted using volumes:

```yaml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads
```

### Production

1. **Use CDN**: Consider moving uploaded files to S3/CloudFlare for better performance
2. **Backup**: Include `/uploads` in your backup strategy
3. **Permissions**: Ensure the uploads directory has proper write permissions
4. **HTTPS**: Always serve user content over HTTPS
5. **Rate Limiting**: Add rate limits to prevent abuse

### Environment Variables

```env
# Optional: Configure upload directory
UPLOAD_DIR=/var/www/uploads

# Optional: Configure max file size
MAX_AVATAR_SIZE=5242880  # 5MB in bytes
```

## Migration Guide

If you have existing users with base64 avatars, create a migration script:

```typescript
import fs from 'fs';
import path from 'path';
import { UserModel } from './models/User';

async function migrateBase64Avatars() {
  const users = await UserModel.find({
    avatarUrl: { $regex: '^data:image' },
  });

  for (const user of users) {
    try {
      // Extract base64 data
      const matches = user.avatarUrl.match(/^data:image\/(\\w+);base64,(.+)$/);
      if (!matches) continue;

      const [, ext, data] = matches;
      const buffer = Buffer.from(data, 'base64');

      // Generate filename
      const filename = `${uuidv4()}-${Date.now()}.${ext}`;
      const filePath = path.join(__dirname, '../uploads/avatars', filename);

      // Save file
      fs.writeFileSync(filePath, buffer);

      // Update database
      user.avatarUrl = `/uploads/avatars/${filename}`;
      await user.save();

      console.log(`Migrated avatar for user ${user.username}`);
    } catch (error) {
      console.error(`Failed to migrate avatar for ${user.username}:`, error);
    }
  }
}
```

## Troubleshooting

### Issue: "ENOENT: no such file or directory"

**Solution**: Ensure the uploads directory exists:

```bash
mkdir -p server/uploads/avatars
```

### Issue: "File size exceeds limit"

**Solution**: Increase the limit in `multer.ts`:

```typescript
limits: {
  fileSize: 10 * 1024 * 1024;
} // 10MB
```

### Issue: Images not loading

**Solution**: Check CORS and static file configuration in `app.ts`:

```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### Issue: Old avatars not being deleted

**Solution**: Verify file paths and permissions:

```bash
ls -la server/uploads/avatars/
chmod -R 755 server/uploads/
```

## Related Files

- `src/config/multer.ts` - Multer configuration
- `src/middleware/uploadAvatar.ts` - Upload middleware and cleanup helper
- `src/routes/v1/users.routes.ts` - User routes with upload handling
- `src/services/user.service.ts` - Business logic for avatar updates
- `src/models/User.ts` - User schema with avatarUrl field
- `src/app.ts` - Static file serving configuration
