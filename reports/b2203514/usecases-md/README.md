# B2203514 - Usecases Specification

Tai lieu mo ta chi tiet 15 usecase cua phan he B2203514 - He thong truyen thong (Communication Module) voi tich hop AI.

## Tong quan he thong

He thong cho phep nguoi dung tao va quan ly cac kenh tro chuyen, gui/nhan tin nhan thoi gian thuc, va su dung cac tinh nang AI de ho tro cong viec nhom.

## Danh sach Usecases

### Nhom 1: Quan ly Kenh (UC01-UC04)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC01 | [Quan ly kenh tro chuyen](UC01-create-channel.md) | Tao, cap nhat, xoa, luu tru kenh | UC01-create-channel.md |
| UC02 | [Quan ly thanh vien kenh](UC02-manage-members.md) | Moi, xoa, phan quyen thanh vien | UC02-manage-members.md |
| UC03 | [Cau hinh AI cho kenh](UC03-config-ai.md) | Bat/tat va cau hinh tinh nang AI | UC03-config-ai.md |
| UC04 | [Tham gia kenh](UC04-join-channel.md) | Tham gia/roi khoi kenh cong khai | UC04-join-channel.md |

### Nhom 2: Nhan tin (UC05-UC09)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC05 | [Gui/nhan tin nhan](UC05-send-message.md) | Gui va nhan tin nhan thoi gian thuc | UC05-send-message.md |
| UC06 | [Tao thread thao luan](UC06-thread.md) | Tao va quan ly thread | UC06-thread.md |
| UC07 | [Tuong tac tin nhan](UC07-message-interaction.md) | Reaction, reply, edit, delete, pin | UC07-message-interaction.md |
| UC08 | [Gui tep dinh kem](UC08-attach-file.md) | Upload va gui file trong chat | UC08-attach-file.md |
| UC09 | [Xem/tai tep](UC09-view-file.md) | Preview va download file | UC09-view-file.md |

### Nhom 3: Tim kiem (UC10)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC10 | [Tim kiem tin nhan](UC10-search-message.md) | Full-text va semantic search | UC10-search-message.md |

### Nhom 4: Tinh nang AI (UC11-UC14)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC11 | [Tom tat hoi thoai](UC11-summarize-conversation.md) | AI tom tat cuoc hoi thoai | UC11-summarize-conversation.md |
| UC12 | [Trich xuat action items](UC12-extract-action-items.md) | AI trich xuat cong viec | UC12-extract-action-items.md |
| UC13 | [Hoi dap theo ngu canh](UC13-ai-qa.md) | Q&A voi RAG | UC13-ai-qa.md |
| UC14 | [Tom tat tai lieu](UC14-document-summary.md) | AI tom tat document | UC14-document-summary.md |

### Nhom 5: Thong bao (UC15)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC15 | [Quan ly thong bao kenh](UC15-notification.md) | Cau hinh muc do thong bao | UC15-notification.md |

## Vai tro nguoi dung (Roles)

### Workspace Level
- **Workspace Owner**: Nguoi so huu workspace, co toan quyen
- **Channel Admin**: Quan tri vien kenh, quan ly kenh va thanh vien
- **Member**: Thanh vien thuong, gui/nhan tin nhan

## Ma tran quyen han

| Chuc nang | Owner | Channel Admin | Member |
|-----------|-------|---------------|--------|
| Tao kenh | Yes | Yes | No |
| Xoa kenh | Yes | Yes* | No |
| Cau hinh AI | Yes | Yes | No |
| Moi thanh vien | Yes | Yes | No |
| Xoa thanh vien | Yes | Yes** | No |
| Gui tin nhan | Yes | Yes | Yes |
| Tuong tac tin nhan | Yes | Yes | Yes |
| Su dung AI | Yes | Yes | Yes*** |

*Channel Admin chi xoa duoc kenh minh tao
**Channel Admin khong xoa duoc Admin khac
***Phu thuoc vao cau hinh AI cua kenh

## Cong nghe su dung

### Backend
- NestJS (Node.js framework)
- PostgreSQL (Database - metadata)
- Cassandra (Database - messages)
- Redis (Caching, Session, Pub/Sub)
- Socket.IO (Real-time)

### Frontend
- Next.js (React framework)
- TailwindCSS (Styling)
- React Query (Data fetching)

### AI Integration
- OpenAI API (GPT-4, GPT-3.5)
- Anthropic API (Claude)
- Vector Database (pgvector / Pinecone)

### File Storage
- MinIO/S3 (Object Storage)

## Cau truc file MD

Moi file usecase bao gom:
1. **Thong tin co ban**: ID, ten, muc do, do phuc tap, actor
2. **Mo ta**: Mo ta ngan gon chuc nang
3. **Cac thanh phan tham gia**: Actors va moi quan tam
4. **Dieu kien tien quyet**: Dieu kien truoc khi thuc hien
5. **Trigger**: Su kien khoi dong usecase
6. **Luong xu ly chinh**: So do va cac buoc chi tiet
7. **Luong su kien con**: Cac subflows
8. **Luong thay the**: Cac truong hop ngoai le
9. **API Endpoints**: Request/Response format
10. **Database Schema**: Cau truc du lieu
11. **Validation Rules**: Quy tac validate
12. **Audit Log**: Cac action duoc ghi log

## Huong dan su dung

### Cho Developer
1. Doc file usecase tuong ung voi chuc nang can implement
2. Tham khao API Endpoints de thiet ke API
3. Tham khao Database Schema de tao migration
4. Lam theo luong xu ly chinh va xu ly cac exception

### Cho Claude/AI
Khi implement mot chuc nang:
1. Doc file usecase de hieu yeu cau
2. Lam theo luong xu ly chinh
3. Xu ly cac truong hop ngoai le (alternative flows)
4. Tao API theo format da dinh nghia
5. Ghi audit log theo danh sach actions

## Lien ket

- [Specifications HTML](../specifications/usecases_phan_he_truyen_thong/)
- [Use Cases Summary](../USECASES_SUMMARY.md)
