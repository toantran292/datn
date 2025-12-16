# UC04 - Quan ly mat khau

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC04 |
| **Ten** | Quan ly mat khau |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Nguoi dung da co tai khoan |

## Mo ta
Cho phep nguoi dung doi mat khau hien tai hoac dat lai mat khau thong qua email khi quen.

## Chuc nang con

### A. Doi mat khau (Change Password)

#### Dieu kien tien quyet
- Nguoi dung da dang nhap
- Biet mat khau hien tai

#### Luong xu ly

```
[Nguoi dung] --> [Trang doi mat khau] --> [Nhap mat khau cu]
                                                |
                                                v
                                    [Nhap mat khau moi]
                                                |
                                                v
                                       [Xac nhan mat khau]
                                                |
                                                v
                                    [He thong xac thuc]
                                                |
                            +-------------------+-------------------+
                            |                                       |
                    [Mat khau cu dung]                    [Mat khau cu sai]
                            |                                       |
                            v                                       v
                    [Cap nhat mat khau]                   [Thong bao loi]
                            |
                            v
                    [Revoke tat ca sessions]
                            |
                            v
                    [Yeu cau dang nhap lai]
```

#### Cac buoc chi tiet

1. **Truy cap chuc nang**
   - Nguoi dung vao Settings > Security > Doi mat khau

2. **Nhap thong tin**
   - Mat khau hien tai
   - Mat khau moi
   - Xac nhan mat khau moi

3. **Xu ly backend**
   - Verify mat khau hien tai
   - Validate mat khau moi
   - Hash va luu mat khau moi
   - Revoke tat ca refresh tokens (bao mat)
   - Ghi audit log

4. **Ket qua**
   - Logout tat ca sessions
   - Yeu cau dang nhap lai voi mat khau moi

---

### B. Quen mat khau (Forgot Password)

#### Dieu kien tien quyet
- Co tai khoan trong he thong
- Co quyen truy cap email da dang ky

#### Luong xu ly

```
[Nguoi dung] --> [Click "Quen mat khau"] --> [Nhap email]
                                                  |
                                                  v
                                       [He thong kiem tra]
                                                  |
                           +----------------------+----------------------+
                           |                                             |
                   [Email ton tai]                              [Email khong ton tai]
                           |                                             |
                           v                                             v
               [Gui email reset link]                      [Van thong bao "da gui"]
                           |                                  (bao mat - khong tiet lo)
                           v
               [Nguoi dung click link]
                           |
                           v
               [Trang dat lai mat khau]
                           |
                           v
               [Nhap mat khau moi]
                           |
                           v
               [Cap nhat mat khau]
```

#### Cac buoc chi tiet

1. **Yeu cau reset**
   - Nguoi dung click "Quen mat khau" tren trang dang nhap
   - Nhap email da dang ky
   - Nhan "Gui link dat lai"

2. **Xu ly backend**
   - Kiem tra email ton tai
   - Tao reset token (het han sau 1 gio)
   - Gui email chua link reset
   - Luon tra ve message thanh cong (bao mat)

3. **Dat lai mat khau**
   - Nguoi dung click link trong email
   - He thong validate token
   - Nguoi dung nhap mat khau moi
   - He thong cap nhat va invalidate token

4. **Ket qua**
   - Mat khau duoc cap nhat
   - Revoke tat ca sessions cu
   - Chuyen den trang dang nhap

## Luong thay the (Alternative Flows)

### A4a. Mat khau hien tai khong dung
- Thong bao "Mat khau hien tai khong chinh xac"
- Cho phep thu lai

### A4b/B3a. Mat khau moi khong du manh
- Hien thi yeu cau mat khau
- Khong cho submit cho den khi hop le

### B2a. Reset token het han
- Thong bao "Link da het han"
- Hien thi nut "Gui lai link moi"

### B2b. Reset token da su dung
- Thong bao "Link da duoc su dung"
- Huong dan lien he ho tro neu khong phai minh

## API Endpoints

### POST /api/auth/change-password
**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response Success (200):**
```json
{
  "message": "Password changed successfully. Please login again."
}
```

**Response Error (400):**
```json
{
  "error": "INVALID_CURRENT_PASSWORD",
  "message": "Current password is incorrect"
}
```

### POST /api/auth/forgot-password
**Request:**
```json
{
  "email": "string"
}
```

**Response Success (200):**
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

### POST /api/auth/reset-password
**Request:**
```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response Success (200):**
```json
{
  "message": "Password reset successfully. Please login with your new password."
}
```

**Response Error (400):**
```json
{
  "error": "INVALID_OR_EXPIRED_TOKEN",
  "message": "Reset link is invalid or has expired"
}
```

## Database Schema

### Password Reset Token Table
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| currentPassword | Required (change password only) |
| newPassword | Required, min 8 ky tu, 1 uppercase, 1 lowercase, 1 number |
| confirmPassword | Required, match newPassword |

## Security Considerations
- Reset token chi su dung 1 lan
- Reset token het han sau 1 gio
- Khong tiet lo email co ton tai hay khong
- Rate limiting: 3 reset requests/gio/email
- Revoke tat ca sessions sau khi doi mat khau

## Audit Log
- Action: `PASSWORD_CHANGED`
- Action: `PASSWORD_RESET_REQUESTED`
- Action: `PASSWORD_RESET_COMPLETED`
- Action: `PASSWORD_RESET_FAILED`
