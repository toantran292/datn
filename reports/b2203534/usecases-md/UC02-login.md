# UC02 - Dang nhap

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC02 |
| **Ten** | Dang nhap |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Khach da co tai khoan |

## Mo ta
Cho phep nguoi dung xac thuc danh tinh bang email va mat khau de truy cap he thong.

## Dieu kien tien quyet
- Nguoi dung da co tai khoan trong he thong
- Tai khoan da duoc xac thuc email
- Tai khoan khong bi khoa

## Luong xu ly chinh

```
[Nguoi dung] --> [Trang dang nhap] --> [Nhap email/password]
                                              |
                                              v
                                    [He thong xac thuc]
                                              |
                           +------------------+------------------+
                           |                  |                  |
                        [Thanh cong]    [Chua xac thuc]    [Bi khoa]
                           |                  |                  |
                           v                  v                  v
                    [Tao session]    [Yeu cau verify]    [Thong bao loi]
                           |
                           v
                    [Chuyen Dashboard]
```

### Cac buoc chi tiet

1. **Truy cap trang dang nhap**
   - Nguoi dung truy cap URL dang nhap
   - He thong hien thi form dang nhap

2. **Nhap thong tin**
   - Email (bat buoc)
   - Mat khau (bat buoc)
   - Remember me (tuy chon)

3. **Gui form**
   - Nguoi dung nhan nut "Dang nhap"
   - He thong validate thong tin

4. **Xu ly xac thuc**
   - Kiem tra email ton tai
   - So sanh password hash
   - Kiem tra trang thai tai khoan

5. **Tao phien lam viec**
   - Generate JWT access token (het han 15 phut)
   - Generate refresh token (het han 7 ngay hoac 30 ngay neu remember me)
   - Luu refresh token vao database
   - Ghi audit log

6. **Chuyen huong**
   - Redirect den Dashboard hoac URL truoc do

## Luong thay the (Alternative Flows)

### 4a. Thong tin khong chinh xac
- He thong thong bao "Email hoac mat khau khong dung"
- Khong tiet lo cu the email hay password sai (bao mat)
- Tang so lan dang nhap that bai

### 4b. Tai khoan chua xac thuc
- He thong thong bao "Vui long xac thuc email truoc khi dang nhap"
- Hien thi nut "Gui lai email xac thuc"

### 4c. Tai khoan bi khoa
- He thong thong bao "Tai khoan cua ban da bi khoa"
- Hien thi thong tin lien he ho tro

### 4d. Qua nhieu lan dang nhap that bai
- Sau 5 lan that bai: Khoa tam thoi 15 phut
- He thong thong bao thoi gian con lai

## Ket qua
- Nguoi dung dang nhap thanh cong
- Nhan duoc access token va refresh token
- Duoc chuyen den trang Dashboard

## API Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "email": "string",
  "password": "string",
  "rememberMe": false
}
```

**Response Success (200):**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "avatar": "url"
  }
}
```

**Response Error (401):**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

**Response Error (403):**
```json
{
  "error": "ACCOUNT_NOT_VERIFIED",
  "message": "Please verify your email before logging in"
}
```

### POST /api/auth/refresh
**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response Success (200):**
```json
{
  "accessToken": "new_jwt_token",
  "expiresIn": 900
}
```

## Database Schema

### Session/Refresh Token Table
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);
```

### Login Attempt Table (Rate Limiting)
```sql
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## JWT Token Structure
```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234568790,
  "type": "access"
}
```

## Security Considerations
- Password khong duoc log
- Rate limiting: 5 lan/15 phut/IP
- Secure cookie cho refresh token
- HTTPS only
- CORS configuration

## Audit Log
- Action: `USER_LOGIN_SUCCESS`
- Action: `USER_LOGIN_FAILED`
- Action: `TOKEN_REFRESHED`
