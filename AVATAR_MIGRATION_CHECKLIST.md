# Avatar Storage Migration Checklist

## ✅ Backend Changes (Completed)

### New Files Created
- [x] `src/config/multer.ts` - Multer configuration for file uploads
- [x] `src/middleware/uploadAvatar.ts` - Upload middleware and cleanup helper
- [x] `uploads/avatars/` - Storage directory for avatar files
- [x] `uploads/.gitkeep` - Keep uploads directory in git
- [x] `uploads/avatars/.gitkeep` - Keep avatars subdirectory in git
- [x] `scripts/test-avatar-upload.sh` - Test script for avatar uploads

### Files Modified
- [x] `src/app.ts` - Added static file serving & reduced payload limits
- [x] `src/routes/v1/users.routes.ts` - Added handleAvatarUpload middleware
- [x] `src/services/user.service.ts` - Added old avatar deletion logic
- [x] `src/validators/user.schema.ts` - Removed URL validation from avatarUrl
- [x] `src/interfaces/user.interface.ts` - Updated comments for avatarUrl
- [x] `.gitignore` - Added uploads directory with exclusions

### Dependencies Installed
- [x] `multer` - File upload middleware
- [x] `@types/multer` - TypeScript types for multer
- [x] `uuid` - Unique filename generation
- [x] `@types/uuid` - TypeScript types for uuid

### Documentation Created
- [x] `guides/AVATAR_FILE_STORAGE.md` - Comprehensive implementation guide
- [x] `guides/AVATAR_UPLOAD_FLOW.md` - Visual flow diagrams
- [x] `AVATAR_STORAGE_CHANGES.md` - Quick start guide

## 📋 Frontend Changes Required

### 1. Update Profile Form Component

**Before (JSON with base64):**
```typescript
const updateProfile = async (data: ProfileData) => {
  const response = await fetch('/api/v1/users/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: base64String  // ❌ No longer supported
    })
  });
};
```

**After (FormData with file):**
```typescript
const updateProfile = async (data: ProfileData, avatarFile?: File) => {
  const formData = new FormData();
  
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }
  formData.append('firstName', data.firstName);
  formData.append('lastName', data.lastName);
  
  const response = await fetch('/api/v1/users/update-profile', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // ❌ Do NOT set Content-Type - let browser set it with boundary
    },
    body: formData
  });
};
```

### 2. Update Avatar Display Component

**Before:**
```typescript
const Avatar = ({ user }: { user: IUser }) => {
  return <img src={user.avatarUrl} alt={user.username} />;
};
```

**After:**
```typescript
const Avatar = ({ user }: { user: IUser }) => {
  const avatarUrl = user.avatarUrl 
    ? `${import.meta.env.VITE_API_URL}${user.avatarUrl}`
    : '/images/default-avatar.png';
  
  return <img src={avatarUrl} alt={user.username} />;
};
```

### 3. Update File Input Handler

**Example React Component:**
```typescript
const ProfileSettings = () => {
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    // Add other fields...
    
    await updateProfile(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
      />
      {avatarPreview && (
        <img src={avatarPreview} alt="Preview" />
      )}
      {/* Other form fields... */}
      <button type="submit">Update Profile</button>
    </form>
  );
};
```

### 4. Update API Client/Service

**If using TanStack Query:**
```typescript
const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/v1/users/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user', 'me']);
      toast.success('Profile updated successfully');
    }
  });
};
```

### 5. Update TypeScript Interfaces

**Update IUser interface if needed:**
```typescript
export interface IUser {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string; // Now a path like "/uploads/avatars/uuid.jpg"
  createdAt?: Date;
  language?: string;
}
```

## 🧪 Testing Checklist

### Backend Testing
- [ ] Test avatar upload with valid image (JPEG, PNG, GIF, WebP)
- [ ] Test rejection of non-image files (PDF, TXT, etc.)
- [ ] Test file size limit (try >5MB file)
- [ ] Test updating avatar (old file should be deleted)
- [ ] Test profile update without avatar (should not break)
- [ ] Test GET /users/me returns correct avatar path
- [ ] Test GET /uploads/avatars/filename.jpg serves the image
- [ ] Test authentication requirement (unauthenticated should fail)

### Frontend Testing
- [ ] Test file selection UI
- [ ] Test image preview before upload
- [ ] Test successful upload
- [ ] Test error handling (file too large, wrong type)
- [ ] Test avatar display in profile
- [ ] Test avatar display in user list
- [ ] Test fallback to default avatar when none exists
- [ ] Test updating other profile fields without changing avatar

### Integration Testing
```bash
# Run the automated test script
cd server
TOKEN="your-jwt-token-here"
# Edit scripts/test-avatar-upload.sh and set TOKEN variable
./scripts/test-avatar-upload.sh
```

### Manual Testing with cURL
```bash
# 1. Upload avatar
curl -X POST http://localhost:3000/api/v1/users/update-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@test-image.jpg" \
  -F "firstName=John"

# 2. Get user profile
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Access avatar directly
curl http://localhost:3000/uploads/avatars/filename.jpg -o avatar.jpg
```

## 🚀 Deployment Checklist

### Development Environment
- [ ] Ensure `uploads/avatars/` directory exists
- [ ] Ensure write permissions on uploads directory
- [ ] Test file uploads and static serving
- [ ] Verify old avatars are deleted

### Docker Setup
- [ ] Add volume mount for uploads directory in docker-compose.yml:
```yaml
services:
  backend:
    volumes:
      - ./uploads:/app/uploads
```
- [ ] Build and test Docker image
- [ ] Verify persistent storage across container restarts

### Production Deployment
- [ ] Create uploads directory on production server
- [ ] Set correct permissions (755 or 775)
- [ ] Configure backup strategy for uploads directory
- [ ] Consider CDN integration (optional, future)
- [ ] Set up monitoring for storage space
- [ ] Configure HTTPS for avatar URLs
- [ ] Add rate limiting for upload endpoint

### Environment Variables (Optional)
```env
# Optional: Configure upload directory
UPLOAD_DIR=/var/www/uploads

# Optional: Configure max file size
MAX_AVATAR_SIZE=5242880  # 5MB in bytes

# Optional: Base URL for avatars
API_URL=https://api.yourdomain.com
```

## 📊 Migration Strategy (If you have existing users)

If you have existing users with base64 avatars in the database:

### Option 1: Gradual Migration (Recommended)
- [ ] Keep old base64 avatars working temporarily
- [ ] New uploads use file storage
- [ ] Users automatically migrate on next profile update
- [ ] After X days, run cleanup script for unmigrated users

### Option 2: Immediate Migration
- [ ] Run migration script to convert all base64 to files
- [ ] Update all user documents at once
- [ ] Test thoroughly before deployment

**Migration Script Template:**
```typescript
// See guides/AVATAR_FILE_STORAGE.md for complete migration script
async function migrateBase64Avatars() {
  const users = await UserModel.find({ 
    avatarUrl: { $regex: '^data:image' } 
  });
  
  for (const user of users) {
    // Convert base64 to file
    // Save to filesystem
    // Update database
  }
}
```

## 🔍 Monitoring & Maintenance

### Things to Monitor
- [ ] Disk space usage in `/uploads/avatars/`
- [ ] Number of orphaned files (files not in database)
- [ ] Upload success/failure rates
- [ ] Average file sizes
- [ ] API response times

### Periodic Maintenance Tasks
- [ ] Clean up orphaned files (files without database reference)
- [ ] Optimize images (compress if needed)
- [ ] Backup uploads directory
- [ ] Monitor and rotate logs
- [ ] Review storage costs

### Cleanup Script (Optional)
```typescript
// Find and remove orphaned avatar files
async function cleanupOrphanedAvatars() {
  const allFiles = fs.readdirSync('uploads/avatars');
  const usedFiles = await UserModel.distinct('avatarUrl');
  
  const orphanedFiles = allFiles.filter(file => {
    const path = `/uploads/avatars/${file}`;
    return !usedFiles.includes(path);
  });
  
  // Delete orphaned files
}
```

## 📚 Documentation References

- **[AVATAR_STORAGE_CHANGES.md](../AVATAR_STORAGE_CHANGES.md)** - Quick reference
- **[guides/AVATAR_FILE_STORAGE.md](../server/guides/AVATAR_FILE_STORAGE.md)** - Complete guide
- **[guides/AVATAR_UPLOAD_FLOW.md](../server/guides/AVATAR_UPLOAD_FLOW.md)** - Visual diagrams
- **[Multer Documentation](https://github.com/expressjs/multer)** - Official docs

## 🆘 Need Help?

Common issues and solutions are documented in:
- `guides/AVATAR_FILE_STORAGE.md` - See "Troubleshooting" section
- Project's `.github/copilot-instructions.md` - For AI assistance

---

**Status**: Backend implementation complete ✅  
**Next Steps**: Update frontend components to use FormData for uploads  
**Estimated Frontend Work**: 2-4 hours
