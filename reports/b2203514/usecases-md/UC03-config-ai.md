# UC03 - Cau hinh AI cho kenh

## Thong tin co ban
| Thuoc tinh | Gia tri |
|------------|---------|
| **ID** | UC03 |
| **Ten** | Cau hinh AI cho kenh |
| **Muc do** | Quan trong |
| **Do phuc tap** | Don gian |
| **Actor** | Workspace Owner, Channel Admin |

## Mo ta
Cho phep Channel Admin bat/tat AI Assistant va chon cac tinh nang AI cu the duoc phep su dung trong kenh (tom tat, hoi dap, trich xuat action items, tom tat tai lieu).

## Cac thanh phan tham gia va moi quan tam
- **Channel Admin:** Muon kiem soat cac tinh nang AI duoc phep su dung trong kenh de phu hop voi muc dich va chinh sach bao mat cua to chuc.

## Dieu kien tien quyet
- Nguoi dung da dang nhap vao he thong
- Nguoi dung co quyen Workspace Owner hoac Channel Admin
- Kenh da duoc tao va dang hoat dong

## Trigger
Channel Admin truy cap vao cai dat AI cua kenh.

**Kieu su kien:** External

## Luong xu ly chinh

```
[Channel Admin] --> [Cai dat kenh] --> [Tab "AI Assistant"]
                                              |
                                              v
                                   [Hien thi trang thai AI]
                                              |
                                              v
                                   [Bat/tat AI Assistant]
                                              |
                                              v
                                   [Chon cac tinh nang AI]
                                              |
                                              v
                                   [Luu cau hinh]
```

### Cac buoc chi tiet

1. **Truy cap cai dat kenh**
   - Channel Admin truy cap vao cai dat cua kenh

2. **Chon tab AI Assistant**
   - Channel Admin chon tab "AI Assistant"

3. **Hien thi trang thai**
   - He thong hien thi trang thai bat/tat AI va danh sach cac tinh nang

4. **Bat/tat AI Assistant**
   - Channel Admin bat/tat AI Assistant

5. **Chon tinh nang AI**
   - Channel Admin chon/bo chon cac tinh nang AI muon cho phep:
     - Tom tat hoi thoai
     - Hoi dap theo ngu canh
     - Trich xuat action items
     - Tom tat tai lieu

6. **Luu cau hinh**
   - Channel Admin nhan "Luu cau hinh"

7. **Cap nhat**
   - He thong luu cau hinh va thong bao thanh cong

## Luong thay the (Alternative Flows)

### 4a. AI Assistant bi tat o cap workspace
- He thong thong bao "AI Assistant da bi vo hieu hoa boi Workspace Owner"
- Cac tuy chon cau hinh bi disabled

## Ket qua
Cau hinh AI cho kenh duoc cap nhat, cac thanh vien chi co the su dung cac tinh nang AI duoc cho phep.

## API Endpoints

### GET /api/channels/:channelId/ai-config
**Mo ta:** Lay cau hinh AI cua kenh

**Response Success (200):**
```json
{
  "enabled": true,
  "features": {
    "summarize": true,
    "qa": true,
    "actionItems": false,
    "documentSummary": true
  },
  "workspaceAiEnabled": true
}
```

### PUT /api/channels/:channelId/ai-config
**Mo ta:** Cap nhat cau hinh AI

**Request:**
```json
{
  "enabled": true,
  "features": {
    "summarize": true,
    "qa": true,
    "actionItems": false,
    "documentSummary": true
  }
}
```

## Database Schema

### Channel AI Config Table
```sql
CREATE TABLE channel_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID UNIQUE NOT NULL REFERENCES channels(id),
  enabled BOOLEAN DEFAULT true,
  feature_summarize BOOLEAN DEFAULT true,
  feature_qa BOOLEAN DEFAULT true,
  feature_action_items BOOLEAN DEFAULT true,
  feature_document_summary BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);
```

## Validation Rules
| Field | Rules |
|-------|-------|
| enabled | Required, boolean |
| features | Object voi cac boolean values |

## Audit Log
- Action: `AI_CONFIG_UPDATED`
