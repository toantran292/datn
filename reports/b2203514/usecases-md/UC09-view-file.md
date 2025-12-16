# UC09 - Xem/tai tep

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC09 |
| **Ten** | Xem/tai tep |
| **Muc do** | Bat buoc |
| **Do phuc tap** | Don gian |
| **Actor** | Member |

## Mo ta
Cho phep Member xem truoc (preview) noi dung cac tep dinh kem truc tiep trong chat va tai tep ve may tinh.

## Cac thanh phan tham gia va moi quan tam
- **Member:** Muon xem truoc noi dung tep hoac tai tep ve may.
- **File Service:** Cung cap noi dung tep de xem va tai.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung la thanh vien cua kenh
- Co tep dinh kem trong tin nhan

## Trigger
Member click vao tep dinh kem trong tin nhan.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Member] --> [Click vao tep dinh kem] --> [Xac dinh loai tep]
                                                 |
                                                 v
                                        [Hien thi preview]
                                                 |
                                                 v
                                        [Xem noi dung trong modal]
                                                 |
                                                 v
                                        [Nhan "Tai ve"]
                                                 |
                                                 v
                                        [Download file ve may]
```

### Cac buoc chi tiet

1. **Click vao tep**
   - Member click vao tep dinh kem trong tin nhan

2. **Xac dinh loai tep**
   - He thong xac dinh loai tep

3. **Hien thi preview**
   - He thong hien thi preview tep (hinh anh, PDF, van ban)

4. **Xem noi dung**
   - Member xem noi dung tep trong modal/lightbox

5. **Tai ve (tuy chon)**
   - Member co the nhan "Tai ve" de download file

6. **Download**
   - He thong goi File Service de lay file va tai ve may Member

## Luong thay the (Alternative Flows)

### 3a. Khong ho tro preview
- He thong hien thi icon file va nut "Tai ve" thay vi preview

## Ket qua
Member xem duoc noi dung tep hoac tai tep ve may thanh cong.

## API Endpoints

### GET /api/files/:fileId/preview
**Mo ta:** Lay URL preview cua file

**Response Success (200):**
```json
{
  "previewUrl": "string",
  "previewType": "image | pdf | document | unsupported",
  "fileName": "string",
  "fileSize": "number",
  "mimeType": "string"
}
```

### GET /api/files/:fileId/download
**Mo ta:** Download file

**Response:** Binary file stream with appropriate headers
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="filename.ext"
```

## Preview Support

| File Type | Preview Type | Description |
|-----------|--------------|-------------|
| jpg, jpeg, png, gif, webp | Image viewer | Hien thi trong lightbox |
| pdf | PDF viewer | Su dung PDF.js |
| doc, docx | Document preview | Convert sang HTML hoac hinh anh |
| txt, csv, json | Text viewer | Hien thi voi syntax highlight |
| Others | No preview | Chi hien thi icon va nut download |

## Database Schema

Su dung bang `message_attachments` tu UC08.

## Validation Rules
| Field | Rules |
|-------|-------|
| fileId | Required, UUID hop le |
| User phai co quyen truy cap kenh chua file |

## Audit Log
- Action: `FILE_VIEWED`
- Action: `FILE_DOWNLOADED`
