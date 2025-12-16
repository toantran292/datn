# UC08 - Gui tep dinh kem

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC08 |
| **Ten** | Gui tep dinh kem |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Trung binh |
| **Actor** | Member |

## Mo ta
Cho phep Member gui tep dinh kem (tai lieu, hinh anh, PDF, v.v.) trong tin nhan. Tep duoc upload len File Service cua phan he nen tang va lien ket voi tin nhan.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon chia se tai lieu, hinh anh hoac cac tep khac trong cuoc tro chuyen.
- **File Service:** Nhan va luu tru tep dinh kem.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh

## Trigger
Member chon chuc nang dinh kem file hoac keo tha file vao khung chat.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Nhan icon "Dinh kem"] --> [Hien thi dialog chon file]
                                               |
                                               v
                                      [Chon file can gui]
                                               |
                                               v
                                      [Kiem tra dinh dang va kich thuoc]
                                               |
                                               v
                                      [Upload len File Service]
                                               |
                                               v
                                      [Tao tin nhan voi tep dinh kem]
                                               |
                                               v
                                      [Hien thi preview trong kenh]
```

### Cac buoc chi tiet

1. **Chon dinh kem**
   - Member nhan icon "Dinh kem" hoac keo tha file vao khung chat

2. **Hien thi dialog**
   - He thong hien thi dialog chon file (neu nhan icon)

3. **Chon file**
   - Member chon file can gui

4. **Kiem tra file**
   - He thong kiem tra dinh dang va kich thuoc file

5. **Upload file**
   - He thong upload file len File Service

6. **Tao tin nhan**
   - He thong tao tin nhan voi tep dinh kem

7. **Hien thi**
   - Tin nhan voi preview file hien thi trong kenh

## Luong thay the (Alternative Flows)

### 4a. File qua lon
- He thong thong bao "File vuot qua kich thuoc cho phep (toi da XX MB)"

### 4b. Dinh dang khong duoc ho tro
- He thong thong bao "Dinh dang file khong duoc ho tro"

## Ket qua
Tep duoc upload va hien thi trong tin nhan cho tat ca thanh vien kenh.

## API Endpoints

### POST /api/channels/:channelId/messages/upload
**Mo ta:** Upload file va tao tin nhan

**Request:** multipart/form-data
- `file`: Binary file
- `message`: Optional message text

**Response Success (201):**
```json
{
  "message": {
    "id": "uuid",
    "content": "string",
    "attachment": {
      "id": "uuid",
      "fileName": "string",
      "fileSize": "number",
      "mimeType": "string",
      "url": "string",
      "thumbnailUrl": "string"
    },
    "createdAt": "timestamp"
  }
}
```

**Response Error (400):**
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds maximum limit of 50MB"
}
```

### WebSocket Events

```javascript
// Thong bao file moi
socket.on('message:file', {
  messageId: 'uuid',
  channelId: 'uuid',
  senderId: 'uuid',
  attachment: {
    id: 'uuid',
    fileName: 'string',
    fileSize: 'number',
    mimeType: 'string',
    url: 'string',
    thumbnailUrl: 'string'
  }
});
```

## Database Schema

### Message Attachments Table
```sql
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  file_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Supported File Types

| Category | Extensions | Max Size |
|----------|------------|----------|
| Images | jpg, jpeg, png, gif, webp | 10MB |
| Documents | pdf, doc, docx, xls, xlsx, ppt, pptx | 50MB |
| Archives | zip, rar, 7z | 100MB |
| Text | txt, csv, json, xml | 5MB |
| Others | * | 25MB |

## Validation Rules
| Field | Rules |
|-------|-------|
| file | Required, max size theo loai |
| mimeType | Required, phai nam trong danh sach cho phep |

## Audit Log
- Action: `FILE_UPLOADED`
- Action: `MESSAGE_WITH_FILE_SENT`
