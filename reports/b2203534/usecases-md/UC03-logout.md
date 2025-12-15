# UC03 - Dang xuat

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC03 |
| **Ten** | Dang xuat |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Nguoi dung da dang nhap |

## Mo ta
Cho phep nguoi dung dang xuat khoi he thong, huy phien lam viec hien tai.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Co phien lam viec hien tai (access token hop le)

## Luong xu ly chinh

```
[Nguoi dung] --> [Click "Dang xuat"] --> [Xac nhan (optional)]
                                               |
                                               v
                                      [He thong xu ly]
                                               |
                        +----------------------+----------------------+
                        |                      |                      |
                [Huy access token]    [Revoke refresh token]   [Ghi audit log]
                                               |
                                               v
                                    [Xoa client-side tokens]
                                               |
                                               v
                                    [Chuyen trang dang nhap]
```

### Cac buoc chi tiet

1. **Nguoi dung yeu cau dang xuat**
   - Click nut "Dang xuat" trong menu nguoi dung
   - Hoac goi API logout

2. **He thong xu ly**
   - Invalidate access token (them vao blacklist hoac kiem tra expiry)
   - Revoke refresh token trong database
   - Ghi audit log

3. **Client-side cleanup**
   - Xoa access token khoi localStorage/memory
   - Xoa refresh token khoi cookies
   - Clear cached user data

4. **Chuyen huong**
   - Redirect den trang dang nhap
   - Hien thi thong bao "Dang xuat thanh cong"

## Luong thay the (Alternative Flows)

### Token het han
- Neu token het han, van xu ly logout binh thuong
- Khong can thong bao loi

### Logout tat ca thiet bi
- Nguoi dung co the chon "Dang xuat tat ca thiet bi"
- Revoke tat ca refresh tokens cua user

## Ket qua
- Phien lam viec bi huy
- Refresh token bi vo hieu hoa
- Nguoi dung duoc chuyen ve trang dang nhap

## API Endpoints

### POST /api/auth/logout
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request (optional):**
```json
{
  "allDevices": false
}
```

**Response Success (200):**
```json
{
  "message": "Logged out successfully"
}
```

### POST /api/auth/logout-all
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response Success (200):**
```json
{
  "message": "Logged out from all devices",
  "revokedSessions": 3
}
```

## Implementation Notes

### Backend
```typescript
// Revoke refresh token
async function logout(userId: string, refreshToken: string): Promise<void> {
  await db.refreshTokens.update({
    where: { token: refreshToken, userId },
    data: { revokedAt: new Date() }
  });

  await auditLog.create({
    userId,
    action: 'USER_LOGOUT',
    timestamp: new Date()
  });
}

// Logout all devices
async function logoutAll(userId: string): Promise<number> {
  const result = await db.refreshTokens.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  return result.count;
}
```

### Frontend
```typescript
async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    // Always clean up client-side
    localStorage.removeItem('accessToken');
    deleteCookie('refreshToken');
    clearUserCache();
    router.push('/login');
  }
}
```

## Security Considerations
- Logout phai hoat dong ngay ca khi token het han
- Khong de lo thong tin ve session khac
- Clear tat ca sensitive data tren client

## Audit Log
- Action: `USER_LOGOUT`
- Action: `USER_LOGOUT_ALL_DEVICES`
- Metadata: device_info, ip_address
