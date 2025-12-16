# B2203514 - Use Cases Summary

Tổng hợp 15 Use Cases của phân hệ Truyền thông (Communication Module) - Hệ thống chat với tích hợp AI.

**Ngày tạo:** 2024-12-15

---

## TỔNG QUAN

| Nhóm | Số UC | Mô tả |
|------|-------|-------|
| Quản lý Kênh | 4 | UC01-UC04: Quản lý kênh, thành viên, cấu hình AI, tham gia kênh |
| Tin nhắn | 5 | UC05-UC09: Gửi/nhận tin nhắn, thread, tương tác, file |
| Tìm kiếm | 1 | UC10: Tìm kiếm tin nhắn |
| AI Features | 4 | UC11-UC14: Tóm tắt, trích xuất action items, hỏi đáp, tóm tắt tài liệu |
| Thông báo | 1 | UC15: Quản lý thông báo kênh |
| **TỔNG** | **15** | |

---

## NHÓM 1: QUẢN LÝ KÊNH (UC01-UC04)

### UC01 - Quản lý kênh trò chuyện

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC01 |
| **Tên** | Quản lý kênh trò chuyện |
| **Actor** | Workspace Owner, Channel Admin |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Channel Admin tạo mới các kênh trò chuyện (công khai, riêng tư, theo dự án), cập nhật thông tin kênh, xóa hoặc lưu trữ kênh.

**Luồng chính:**
1. Channel Admin truy cập trang quản lý kênh
2. Chọn "Tạo kênh mới"
3. Nhập thông tin: tên, mô tả, loại kênh, dự án liên kết
4. Hệ thống tạo kênh và thông báo thành công

**Subflows:**
- S1: Cập nhật thông tin kênh
- S2: Xóa kênh
- S3: Lưu trữ kênh (archived)

---

### UC02 - Quản lý thành viên kênh

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC02 |
| **Tên** | Quản lý thành viên kênh |
| **Actor** | Workspace Owner, Channel Admin |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Trung bình |

**Mô tả:** Cho phép Channel Admin mời thành viên workspace vào kênh, xóa thành viên, và phân quyền Admin/Member.

**Luồng chính:**
1. Channel Admin vào cài đặt kênh → Tab "Thành viên"
2. Chọn "Mời thành viên"
3. Chọn thành viên từ danh sách workspace
4. Hệ thống thêm thành viên và gửi thông báo

**Subflows:**
- S1: Xóa thành viên khỏi kênh
- S2: Phân quyền Admin/Member

---

### UC03 - Cấu hình AI cho kênh

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC03 |
| **Tên** | Cấu hình AI cho kênh |
| **Actor** | Workspace Owner, Channel Admin |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Đơn giản |

**Mô tả:** Cho phép Channel Admin bật/tắt AI Assistant và chọn các tính năng AI được phép sử dụng trong kênh (tóm tắt, hỏi đáp, trích xuất action items, tóm tắt tài liệu).

**Luồng chính:**
1. Channel Admin vào cài đặt kênh → Tab "AI Assistant"
2. Bật/tắt AI Assistant
3. Chọn/bỏ chọn các tính năng AI muốn cho phép
4. Lưu cấu hình

---

### UC04 - Tham gia kênh

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC04 |
| **Tên** | Tham gia kênh |
| **Actor** | Member |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Đơn giản |

**Mô tả:** Cho phép Member xem danh sách kênh, tham gia kênh công khai và rời khỏi kênh đang tham gia.

**Luồng chính:**
1. Member truy cập danh sách kênh
2. Chọn kênh công khai chưa tham gia
3. Nhấn "Tham gia kênh"
4. Có thể xem và gửi tin nhắn trong kênh

**Subflows:**
- S1: Rời khỏi kênh

---

## NHÓM 2: TIN NHẮN (UC05-UC09)

### UC05 - Gửi/nhận tin nhắn

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC05 |
| **Tên** | Gửi/nhận tin nhắn |
| **Actor** | Member |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Member gửi tin nhắn văn bản, tin nhắn có định dạng (bold, italic, code) và nhận tin nhắn từ các thành viên khác trong thời gian thực thông qua WebSocket.

**Luồng chính:**
1. Member mở kênh đang tham gia
2. Hệ thống kết nối WebSocket và tải lịch sử tin nhắn
3. Member nhập nội dung và nhấn "Gửi"
4. Server lưu và broadcast đến tất cả thành viên
5. Tin nhắn hiển thị trong khung chat theo thời gian thực

**Subflows:**
- S1: Gửi tin nhắn có định dạng (markdown)

---

### UC06 - Tạo thread thảo luận

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC06 |
| **Tên** | Tạo thread thảo luận |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Trung bình |

**Mô tả:** Cho phép Member tạo thread (luồng thảo luận phụ) từ một tin nhắn cụ thể để thảo luận sâu mà không ảnh hưởng đến luồng chat chính.

**Luồng chính:**
1. Member hover vào tin nhắn
2. Chọn "Tạo thread" hoặc "Reply in thread"
3. Hệ thống mở panel thread bên phải
4. Member nhập và gửi nội dung trong thread
5. Số reply hiển thị trên tin nhắn gốc

---

### UC07 - Tương tác tin nhắn

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC07 |
| **Tên** | Tương tác tin nhắn |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Đơn giản |

**Mô tả:** Cho phép Member tương tác với tin nhắn: thêm reaction (emoji), reply, chỉnh sửa tin nhắn của mình, xóa và ghim tin nhắn quan trọng.

**Luồng chính:**
1. Member hover vào tin nhắn
2. Hệ thống hiển thị toolbar với các tùy chọn
3. Member chọn hành động (reaction, reply, edit, delete, pin)
4. Hệ thống cập nhật và hiển thị cho tất cả thành viên

**Subflows:**
- S1: Reply tin nhắn
- S2: Chỉnh sửa tin nhắn (chỉ của mình)
- S3: Xóa tin nhắn
- S4: Ghim tin nhắn

---

### UC08 - Gửi tệp đính kèm

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC08 |
| **Tên** | Gửi tệp đính kèm |
| **Actor** | Member |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Trung bình |

**Mô tả:** Cho phép Member gửi tệp đính kèm (tài liệu, hình ảnh, PDF) trong tin nhắn. Tệp được upload lên File Service và liên kết với tin nhắn.

**Luồng chính:**
1. Member nhấn icon "Đính kèm" hoặc kéo thả file
2. Chọn file cần gửi
3. Hệ thống kiểm tra định dạng và kích thước
4. Upload lên File Service
5. Tin nhắn với preview file hiển thị trong kênh

---

### UC09 - Xem/tải tệp

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC09 |
| **Tên** | Xem/tải tệp |
| **Actor** | Member |
| **Mức độ** | Bắt buộc |
| **Độ phức tạp** | Đơn giản |

**Mô tả:** Cho phép Member xem trước (preview) nội dung các tệp đính kèm trực tiếp trong chat và tải tệp về máy tính.

**Luồng chính:**
1. Member click vào tệp đính kèm
2. Hệ thống xác định loại tệp
3. Hiển thị preview tệp (hình ảnh, PDF, văn bản)
4. Member có thể nhấn "Tải về" để download

---

## NHÓM 3: TÌM KIẾM (UC10)

### UC10 - Tìm kiếm tin nhắn

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC10 |
| **Tên** | Tìm kiếm tin nhắn |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Trung bình |

**Mô tả:** Cho phép Member tìm kiếm tin nhắn trong các kênh có quyền truy cập. Hỗ trợ tìm kiếm theo từ khóa (full-text) và tìm kiếm ngữ nghĩa (semantic search) sử dụng vector database.

**Luồng chính:**
1. Member click vào ô tìm kiếm hoặc nhấn Ctrl+K
2. Nhập từ khóa cần tìm
3. Hệ thống thực hiện tìm kiếm full-text
4. Hiển thị danh sách kết quả với highlight
5. Member click vào kết quả để chuyển đến tin nhắn

**Subflows:**
- S1: Tìm kiếm nâng cao (filter theo kênh, người gửi, thời gian)
- S2: Tìm kiếm ngữ nghĩa (semantic search)

---

## NHÓM 4: AI FEATURES (UC11-UC14)

### UC11 - Tóm tắt hội thoại

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC11 |
| **Tên** | Tóm tắt hội thoại |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Member yêu cầu AI tóm tắt một đoạn hội thoại được chọn hoặc tóm tắt toàn bộ kênh từ một mốc thời gian (ví dụ: từ lần truy cập cuối).

**Luồng chính:**
1. Member chọn một hoặc nhiều tin nhắn
2. Click "Tóm tắt với AI"
3. Hệ thống gửi nội dung đến AI Service
4. AI Service sử dụng LLM để sinh bản tóm tắt
5. Hiển thị bản tóm tắt trong panel AI Assistant

**Subflows:**
- S1: Tóm tắt từ lần truy cập cuối

---

### UC12 - Trích xuất action items

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC12 |
| **Tên** | Trích xuất action items |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Member yêu cầu AI phân tích cuộc hội thoại và trích xuất danh sách các công việc, nhiệm vụ (action items), bao gồm người chịu trách nhiệm và deadline nếu có.

**Luồng chính:**
1. Member mở panel AI Assistant
2. Chọn "Trích xuất action items"
3. Hệ thống gửi nội dung hội thoại đến AI Service
4. AI Service phân tích và trích xuất các công việc
5. Hiển thị danh sách: Task - Người thực hiện - Deadline
6. Member có thể copy hoặc export danh sách

---

### UC13 - Hỏi đáp theo ngữ cảnh

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC13 |
| **Tên** | Hỏi đáp theo ngữ cảnh |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Member đặt câu hỏi về nội dung đã trao đổi trong kênh. AI sử dụng kiến trúc RAG để truy xuất ngữ cảnh liên quan từ vector database và sinh câu trả lời chính xác.

**Luồng chính:**
1. Member mở panel AI Assistant
2. Nhập câu hỏi về nội dung kênh
3. Hệ thống tạo embedding cho câu hỏi
4. Truy xuất tin nhắn/tài liệu liên quan từ vector database
5. Gửi câu hỏi + context đến LLM
6. Hiển thị câu trả lời kèm nguồn tham chiếu
7. Member có thể click vào nguồn để xem tin nhắn gốc

**Kỹ thuật:** RAG (Retrieval-Augmented Generation)

---

### UC14 - Tóm tắt tài liệu

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC14 |
| **Tên** | Tóm tắt tài liệu |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Phức tạp |

**Mô tả:** Cho phép Member yêu cầu AI tóm tắt nội dung của một tài liệu đính kèm trong chat (PDF, DOCX, v.v.) ngay trong khung chat.

**Luồng chính:**
1. Member click vào tài liệu đính kèm
2. Chọn "Tóm tắt với AI"
3. Hệ thống lấy nội dung từ File Service
4. Trích xuất văn bản (PDF parser, DOCX parser)
5. Gửi nội dung đến AI Service
6. Hiển thị bản tóm tắt trong panel AI Assistant

---

## NHÓM 5: THÔNG BÁO (UC15)

### UC15 - Quản lý thông báo kênh

| Thuộc tính | Giá trị |
|------------|---------|
| **ID** | UC15 |
| **Tên** | Quản lý thông báo kênh |
| **Actor** | Member |
| **Mức độ** | Quan trọng |
| **Độ phức tạp** | Đơn giản |

**Mô tả:** Cho phép Member cấu hình mức độ thông báo cho từng kênh: nhận tất cả, chỉ mention, hoặc tắt thông báo. Cũng có thể xem danh sách tin nhắn chưa đọc.

**Luồng chính:**
1. Member click vào cài đặt kênh
2. Chọn "Cài đặt thông báo"
3. Chọn mức độ: Tất cả tin nhắn / Chỉ mention / Tắt thông báo
4. Lưu cấu hình

**Subflows:**
- S1: Xem và đánh dấu tin chưa đọc

---

## TỔNG HỢP THEO ĐỘ PHỨC TẠP

| Độ phức tạp | Use Cases |
|-------------|-----------|
| **Phức tạp** | UC01, UC05, UC11, UC12, UC13, UC14 |
| **Trung bình** | UC02, UC06, UC08, UC10 |
| **Đơn giản** | UC03, UC04, UC07, UC09, UC15 |

---

## TỔNG HỢP THEO MỨC ĐỘ CẦN THIẾT

| Mức độ | Use Cases |
|--------|-----------|
| **Bắt buộc** | UC01, UC02, UC04, UC05, UC08, UC09 |
| **Quan trọng** | UC03, UC06, UC07, UC10, UC11, UC12, UC13, UC14, UC15 |

---

## VAI TRÒ NGƯỜI DÙNG (ACTORS)

| Vai trò | Use Cases |
|---------|-----------|
| **Workspace Owner** | UC01, UC02, UC03 |
| **Channel Admin** | UC01, UC02, UC03 |
| **Member** | UC04, UC05, UC06, UC07, UC08, UC09, UC10, UC11, UC12, UC13, UC14, UC15 |

---

## MA TRẬN QUYỀN HẠN

| Chức năng | Workspace Owner | Channel Admin | Member |
|-----------|-----------------|---------------|--------|
| Tạo/sửa/xóa kênh | Yes | Yes | No |
| Quản lý thành viên kênh | Yes | Yes | No |
| Cấu hình AI | Yes | Yes | No |
| Tham gia kênh công khai | Yes | Yes | Yes |
| Gửi/nhận tin nhắn | Yes | Yes | Yes |
| Tạo thread | Yes | Yes | Yes |
| Tương tác tin nhắn | Yes | Yes | Yes |
| Gửi/xem tệp | Yes | Yes | Yes |
| Tìm kiếm | Yes | Yes | Yes |
| Sử dụng AI features | Yes | Yes | Yes* |
| Cấu hình thông báo | Yes | Yes | Yes |

*Nếu AI được bật cho kênh

---

## CÔNG NGHỆ SỬ DỤNG

### Real-time Communication
- **WebSocket** (Socket.io) - Gửi/nhận tin nhắn thời gian thực

### AI/ML
- **LLM** (OpenAI, Anthropic, Google) - Tóm tắt, hỏi đáp
- **RAG** (Retrieval-Augmented Generation) - Hỏi đáp theo ngữ cảnh
- **Vector Database** - Tìm kiếm ngữ nghĩa, lưu trữ embeddings

### File Processing
- **PDF Parser** - Trích xuất văn bản từ PDF
- **DOCX Parser** - Trích xuất văn bản từ Word

### Search
- **Full-text Search** - Tìm kiếm theo từ khóa
- **Semantic Search** - Tìm kiếm theo ý nghĩa

---

## LIÊN KẾT VỚI PHÂN HỆ KHÁC (B2203534)

| B2203514 (Truyền thông) | B2203534 (Nền tảng) | Mô tả |
|-------------------------|---------------------|-------|
| UC08 - Gửi tệp | UC13 - Upload tệp | Sử dụng File Service để lưu trữ file |
| UC09 - Xem/tải tệp | UC14 - Quản lý tệp | Sử dụng File Service để lấy file |
| UC11-UC14 - AI Features | UC16 - Tạo báo cáo AI | Sử dụng chung LLM Provider |
| - | UC01-UC05 | Xác thực và quản lý user |
| - | UC06-UC12 | Quản lý Workspace |

---

## FILE LOCATION

```
reports/b2203514/specifications/usecases_phan_he_truyen_thong/
├── UC01.html  - Quản lý kênh trò chuyện
├── UC02.html  - Quản lý thành viên kênh
├── UC03.html  - Cấu hình AI cho kênh
├── UC04.html  - Tham gia kênh
├── UC05.html  - Gửi/nhận tin nhắn
├── UC06.html  - Tạo thread thảo luận
├── UC07.html  - Tương tác tin nhắn
├── UC08.html  - Gửi tệp đính kèm
├── UC09.html  - Xem/tải tệp
├── UC10.html  - Tìm kiếm tin nhắn
├── UC11.html  - Tóm tắt hội thoại
├── UC12.html  - Trích xuất action items
├── UC13.html  - Hỏi đáp theo ngữ cảnh
├── UC14.html  - Tóm tắt tài liệu
├── UC15.html  - Quản lý thông báo kênh
└── usecase_latex.tex  - LaTeX source
```
