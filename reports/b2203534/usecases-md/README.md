# B2203534 - Usecases Specification

Tai lieu mo ta chi tiet 17 usecase cua phan he B2203534 - He thong quan ly khong gian lam viec (Workspace Management System) voi tich hop AI.

## Tong quan he thong

He thong cho phep nguoi dung tao va quan ly cac khong gian lam viec (workspace), upload tai lieu, va tao bao cao tu dong su dung AI (LLM).

## Danh sach Usecases

### Nhom 1: Xac thuc va Quan ly tai khoan (UC01-UC05)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC01 | [Dang ky tai khoan](UC01-register.md) | Khach dang ky tai khoan moi voi email verification | UC01-register.md |
| UC02 | [Dang nhap](UC02-login.md) | Xac thuc nguoi dung voi JWT token | UC02-login.md |
| UC03 | [Dang xuat](UC03-logout.md) | Ket thuc phien lam viec | UC03-logout.md |
| UC04 | [Quan ly mat khau](UC04-password.md) | Doi mat khau va quen mat khau | UC04-password.md |
| UC05 | [Cap nhat thong tin](UC05-profile.md) | Chinh sua thong tin ca nhan | UC05-profile.md |

### Nhom 2: Quan ly Workspace (UC06-UC12)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC06 | [Tao Workspace](UC06-create-workspace.md) | Tao khong gian lam viec moi | UC06-create-workspace.md |
| UC07 | [Cau hinh Workspace](UC07-config-workspace.md) | Xem va chinh sua cau hinh workspace | UC07-config-workspace.md |
| UC08 | [Quan ly trang thai](UC08-workspace-status.md) | Khoa/Mo khoa workspace (Super Admin) | UC08-workspace-status.md |
| UC09 | [Xem Dashboard](UC09-dashboard.md) | Xem tong quan workspace | UC09-dashboard.md |
| UC10 | [Xem Audit Log](UC10-audit-log.md) | Xem lich su hoat dong | UC10-audit-log.md |
| UC11 | [Quan ly thanh vien](UC11-members.md) | Moi, xoa, phan quyen thanh vien | UC11-members.md |
| UC12 | [Chuyen quyen so huu](UC12-ownership.md) | Chuyen hoac thu hoi quyen Owner | UC12-ownership.md |

### Nhom 3: Quan ly Tep (UC13-UC14)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC13 | [Upload tep](UC13-upload.md) | Tai tep len workspace | UC13-upload.md |
| UC14 | [Quan ly tep](UC14-files.md) | Xem, tai, xoa, tim kiem tep | UC14-files.md |

### Nhom 4: Thong bao va Bao cao (UC15-UC17)
| UC | Ten | Mo ta | File |
|----|-----|-------|------|
| UC15 | [Quan ly thong bao](UC15-notifications.md) | Xem va cau hinh thong bao | UC15-notifications.md |
| UC16 | [Tao bao cao AI](UC16-create-report.md) | Tao bao cao tu dong voi LLM | UC16-create-report.md |
| UC17 | [Xem va xuat bao cao](UC17-export-report.md) | Xem va export bao cao | UC17-export-report.md |

## Vai tro nguoi dung (Roles)

### System Level
- **Super Admin**: Quan tri vien he thong, co quyen khoa/mo khoa workspace, thu hoi quyen Owner

### Workspace Level
- **Owner**: Nguoi tao va so huu workspace, co toan quyen
- **Admin**: Quan tri vien workspace, quan ly thanh vien va cau hinh
- **Member**: Thanh vien thuong, xem va upload tep

## Ma tran quyen han

| Chuc nang | Super Admin | Owner | Admin | Member |
|-----------|-------------|-------|-------|--------|
| Tao workspace | - | Yes | - | - |
| Cau hinh workspace | - | Yes | Yes | No |
| Khoa/Mo khoa workspace | Yes | No | No | No |
| Xem dashboard | - | Yes | Yes | Yes |
| Xem audit log | - | Yes | Yes | No |
| Moi thanh vien | - | Yes | Yes | No |
| Xoa thanh vien | - | Yes | Yes* | No |
| Phan quyen | - | Yes | Yes** | No |
| Chuyen quyen so huu | Yes*** | Yes | No | No |
| Upload tep | - | Yes | Yes | Yes |
| Xoa tep | - | Yes | Yes | No |
| Tao bao cao AI | - | Yes | Yes | No |
| Xem/Xuat bao cao | - | Yes | Yes | Yes |

*Admin chi xoa duoc Member, khong xoa duoc Admin khac
**Admin chi phan quyen cho Member, khong phan quyen cho Admin
***Super Admin co the thu hoi quyen Owner

## Cong nghe su dung

### Backend
- NestJS (Node.js framework)
- PostgreSQL (Database)
- Redis (Caching, Session)
- MinIO/S3 (Object Storage)
- Socket.IO (Real-time)

### Frontend
- Next.js (React framework)
- TailwindCSS (Styling)
- React Query (Data fetching)

### AI Integration
- OpenAI API (GPT-4, GPT-3.5)
- Anthropic API (Claude)
- Google AI API (Gemini)

## Cau truc file MD

Moi file usecase bao gom:
1. **Thong tin co ban**: ID, ten, muc do, do phuc tap, actor
2. **Mo ta**: Mo ta ngan gon chuc nang
3. **Dieu kien tien quyet**: Dieu kien truoc khi thuc hien
4. **Luong xu ly chinh**: So do va cac buoc chi tiet
5. **Luong thay the**: Cac truong hop ngoai le
6. **API Endpoints**: Request/Response format
7. **Database Schema**: Cau truc du lieu
8. **Implementation Notes**: Code mau, huong dan implement
9. **Audit Log**: Cac action duoc ghi log

## Huong dan su dung

### Cho Developer
1. Doc file usecase tuong ung voi chuc nang can implement
2. Tham khao API Endpoints de thiet ke API
3. Tham khao Database Schema de tao migration
4. Su dung Implementation Notes lam code reference

### Cho Claude/AI
Khi implement mot chuc nang:
1. Doc file usecase de hieu yeu cau
2. Lam theo luong xu ly chinh
3. Xu ly cac truong hop ngoai le (alternative flows)
4. Tao API theo format da dinh nghia
5. Ghi audit log theo danh sach actions

## Lien ket

- [Specifications HTML](../specifications/)
- [Report LaTeX](../report/)
