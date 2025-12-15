# UC05 - Cap nhat thong tin ca nhan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC05 |
| **Ten** | Cap nhat thong tin ca nhan |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Nguoi dung da dang nhap |

## Mo ta
Cho phep nguoi dung chinh sua va cap nhat thong tin ho so ca nhan nhu ho ten, so dien thoai, anh dai dien.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong

## Luong xu ly chinh

```
[Nguoi dung] --> [Trang thong tin ca nhan] --> [Xem thong tin hien tai]
                                                       |
                                                       v
                                              [Chinh sua thong tin]
                                                       |
                                                       v
                                              [Nhan "Luu thay doi"]
                                                       |
                                                       v
                                              [He thong validate]
                                                       |
                            +--------------------------+-------------------------+
                            |                                                    |
                    [Du lieu hop le]                                    [Du lieu khong hop le]
                            |                                                    |
                            v                                                    v
                    [Cap nhat database]                                 [Hien thi loi]
                            |
                            v
                    [Ghi audit log]
                            |
                            v
                    [Thong bao thanh cong]
```

### Cac buoc chi tiet

1. **Truy cap trang profile**
   - Nguoi dung click vao avatar/ten > "Thong tin ca nhan"
   - Hoac vao Settings > Profile

2. **Xem thong tin hien tai**
   - He thong hien thi form voi du lieu hien tai:
     - Ho ten
     - Email (khong cho sua)
     - So dien thoai
     - Anh dai dien
     - Bio/Mo ta

3. **Chinh sua thong tin**
   - Nguoi dung thay doi cac truong can cap nhat
   - Co the upload anh dai dien moi

4. **Luu thay doi**
   - Nguoi dung nhan "Luu thay doi"
   - He thong validate du lieu
   - Cap nhat vao database
   - Ghi audit log

5. **Ket qua**
   - Thong bao thanh cong
   - Hien thi thong tin moi

## Luong thay the (Alternative Flows)

### 3a. Upload anh khong dung dinh dang
- Chi chap nhan: JPG, PNG, GIF, WebP
- Kich thuoc toi da: 5MB
- He thong thong bao loi va yeu cau chon anh khac

### 4a. Du lieu khong hop le
- Hien thi loi validation cu the cho tung truong
- Khong mat du lieu da nhap

## Ket qua
- Thong tin ca nhan duoc cap nhat thanh cong
- Avatar moi duoc luu vao storage

## API Endpoints

### GET /api/users/me
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response Success (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+84123456789",
  "avatar": "https://storage.example.com/avatars/uuid.jpg",
  "bio": "Software Developer",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### PATCH /api/users/me
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "bio": "string"
}
```

**Response Success (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+84123456789",
    "bio": "Software Developer"
  }
}
```

### POST /api/users/me/avatar
**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
```
avatar: (file)
```

**Response Success (200):**
```json
{
  "message": "Avatar uploaded successfully",
  "avatarUrl": "https://storage.example.com/avatars/uuid.jpg"
}
```

**Response Error (400):**
```json
{
  "error": "INVALID_FILE_TYPE",
  "message": "Only JPG, PNG, GIF, WebP files are allowed"
}
```

### DELETE /api/users/me/avatar
**Response Success (200):**
```json
{
  "message": "Avatar removed successfully"
}
```

## Database Schema

### User Table (Additional Fields)
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN bio TEXT;
```

## Validation Rules
| Field | Rules |
|-------|-------|
| firstName | Required, 2-100 ky tu, chi chu va khoang trang |
| lastName | Required, 2-100 ky tu, chi chu va khoang trang |
| phone | Optional, dinh dang so dien thoai quoc te |
| bio | Optional, toi da 500 ky tu |
| avatar | Optional, JPG/PNG/GIF/WebP, max 5MB |

## Avatar Processing
- Resize ve toi da 500x500px
- Tao thumbnail 100x100px
- Luu tru tren object storage (S3/MinIO)
- Xoa avatar cu khi upload moi

## Implementation Notes

### Avatar Upload Service
```typescript
async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Validate file
  validateFileType(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  validateFileSize(file, 5 * 1024 * 1024); // 5MB

  // Process image
  const processed = await sharp(file.buffer)
    .resize(500, 500, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Upload to storage
  const filename = `avatars/${userId}/${Date.now()}.jpg`;
  const url = await storage.upload(filename, processed);

  // Update user
  await db.users.update({
    where: { id: userId },
    data: { avatarUrl: url }
  });

  return url;
}
```

## Audit Log
- Action: `PROFILE_UPDATED`
- Action: `AVATAR_UPLOADED`
- Action: `AVATAR_REMOVED`
- Metadata: changed_fields
