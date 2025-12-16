# UC01 - Dang ky tai khoan

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC01 |
| **Ten** | Dang ky tai khoan |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Khach (Guest) |

## Mo ta
Cho phep khach dang ky tai khoan moi bang cach cung cap thong tin ca nhan va xac thuc email.

## Dieu kien tien quyet
- Khach chua co tai khoan trong he thong
- Khach co dia chi email hop le

## Luong xu ly chinh

```
[Khach] --> [Trang dang ky] --> [Nhap thong tin] --> [He thong kiem tra]
                                                          |
                                                          v
                                                   [Tao tai khoan]
                                                          |
                                                          v
                                               [Gui email xac thuc]
                                                          |
                                                          v
[Khach] <-- [Nhan email] <-- [Click link xac thuc] --> [Xac thuc thanh cong]
                                                          |
                                                          v
                                               [Chuyen trang dang nhap]
```

### Cac buoc chi tiet

1. **Truy cap trang dang ky**
   - Khach click "Dang ky" hoac "Tao tai khoan" tren trang dang nhap
   - He thong hien thi form dang ky

2. **Nhap thong tin**
   - Ho ten (bat buoc)
   - Email (bat buoc, unique)
   - Mat khau (bat buoc, toi thieu 8 ky tu, co chu hoa, chu thuong, so)
   - Xac nhan mat khau (bat buoc, khop voi mat khau)

3. **Gui form**
   - Khach nhan nut "Dang ky"
   - He thong validate thong tin

4. **Xu ly backend**
   - Kiem tra email da ton tai chua
   - Hash mat khau
   - Tao tai khoan voi trang thai `UNVERIFIED`
   - Tao verification token (het han sau 24h)
   - Gui email chua link xac thuc

5. **Xac thuc email**
   - Khach mo email va click link xac thuc
   - He thong kiem tra token hop le
   - Cap nhat trang thai tai khoan thanh `ACTIVE`
   - Chuyen huong den trang dang nhap

## Luong thay the (Alternative Flows)

### 4a. Email da ton tai
- He thong thong bao "Email da duoc su dung"
- Yeu cau nhap email khac hoac chuyen den trang quen mat khau

### 4b. Mat khau khong du manh
- He thong hien thi yeu cau mat khau:
  - Toi thieu 8 ky tu
  - Co it nhat 1 chu hoa
  - Co it nhat 1 chu thuong
  - Co it nhat 1 so

### 5a. Link xac thuc het han
- He thong thong bao link het han
- Hien thi nut "Gui lai email xac thuc"
- Khach click de nhan email moi

## Ket qua
- Tai khoan moi duoc tao thanh cong
- Trang thai tai khoan: `ACTIVE`
- Khach co the dang nhap vao he thong

## API Endpoints

### POST /api/auth/register
**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response Success (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "uuid"
}
```

**Response Error (400):**
```json
{
  "error": "EMAIL_EXISTS",
  "message": "Email already registered"
}
```

### GET /api/auth/verify-email?token={token}
**Response Success (200):**
```json
{
  "message": "Email verified successfully"
}
```

### POST /api/auth/resend-verification
**Request:**
```json
{
  "email": "string"
}
```

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('UNVERIFIED', 'ACTIVE', 'LOCKED') DEFAULT 'UNVERIFIED',
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Email Verification Token Table
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| firstName | Required, 2-100 ky tu |
| lastName | Required, 2-100 ky tu |
| email | Required, email format, unique |
| password | Required, min 8 ky tu, 1 uppercase, 1 lowercase, 1 number |
| confirmPassword | Required, match password |

## Audit Log
- Action: `USER_REGISTERED`
- Action: `EMAIL_VERIFICATION_SENT`
- Action: `EMAIL_VERIFIED`
