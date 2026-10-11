# 07 — Chức năng Admin (Admin Features)

Toàn bộ Admin Portal chạy trong bundle `admin.html` riêng (xem [04-system-architecture.md](04-system-architecture.md)), bọc bởi `AdminProtectedRoute` (yêu cầu `role === 'admin'`), layout chung là `AdminLayout` (Sidebar + Header + `<Outlet/>`).

## Dashboard (Tổng quan hệ thống)

```text
AdminOverviewPage.tsx
↓ GET /analytics/admin/stats
analytics.route.ts → analytics.controller.ts#getSystemStats
↓
analytics.service.ts#getSystemStats
↓
UserModel.find(), WritingQuestionModel.find(), WritingAttemptModel.find(), WritingErrorModel.find()
↓
MongoDB (hoặc memoryStore nếu không có Mongo)
```

4 card KPI hiển thị: **Tổng người dùng** (kèm số đang hoạt động/bị khóa/admin), **Ngân hàng câu hỏi** (tổng số + độ phủ 6 cấp CEFR), **Lượt làm bài đã chấm** (tổng số lượt Sentence Writing đã chấm), **Điểm số trung bình**. Nút "Cập nhật số liệu" gọi lại đúng API trên, không polling tự động. (2 biểu đồ "Phân bố câu hỏi theo CEFR" và "Tỷ lệ lỗi phổ biến", cùng dòng "Độ chính xác toàn hệ thống", đã được gỡ khỏi giao diện ở các lần chỉnh sửa trước — dữ liệu `accuracy`/`byLevel` vẫn được backend tính và trả về trong cùng response, chỉ không còn render.)

## Quản lý Người dùng (User Management)

```text
AdminUsersPage.tsx
↓ GET /users/all
user.route.ts → user.controller.ts#getAllUsers → user.service.ts#getAllUsers
↓
UserModel.find().select("-password -level -target")
↓
MongoDB
```

Bảng: Học viên (tên + email) | Vai trò | Điểm TB (`—` cho admin, điểm trung bình thật cho user) | Trạng thái | Thao tác (Khóa/Mở khóa, Sửa, Xóa). Modal tạo/sửa gồi tên, email, mật khẩu (chỉ khi tạo mới), vai trò.

- Khóa/mở khóa: `PUT /users/:id/status` → `user.service.ts#toggleUserStatus` (đảo `isActive`) — tài khoản bị khóa mất quyền truy cập **ngay lập tức** ở request kế tiếp nhờ `authenticate` middleware luôn kiểm tra lại `isActive` trong DB.
- Sửa: `PUT /users/:id` → `user.service.ts#updateUser`
- Xóa: `DELETE /users/:id` → `user.service.ts#deleteUser` (xóa cứng document `User`, không xóa kèm các `WritingAttempt`/`ParagraphAttempt` liên quan — xem Known Issues ở [17](17-admin-management.md)).
- Tạo: `POST /users` → `user.service.ts#createUser` (hash mật khẩu bằng bcrypt trước khi lưu).

## Quản lý Câu hỏi Writing (Question Bank Management)

```text
AdminQuestionsPage.tsx
↓ GET /writing/admin/questions (kèm filter level/topic/search)
writing.route.ts → writing.controller.ts#getAdminQuestions → writing.service.ts#getAllQuestionsAdmin
↓
WritingQuestionModel.find(filter) — KHÔNG lược bỏ đáp án (đây là view của Admin)
↓
MongoDB
```

Modal tạo/sửa: đề tiếng Việt, đáp án chuẩn, đáp án tương đương (mỗi dòng một câu), cấp độ CEFR, chủ đề, độ khó, chủ điểm ngữ pháp, từ khóa (phân cách bởi dấu phẩy). Lưu qua `POST/PUT /writing/admin/questions(/:id)`. Xóa qua `DELETE /writing/admin/questions/:id`.

## Quản lý Đề viết đoạn văn (Paragraph Topics Management)

Tương tự Question Bank nhưng cho `ParagraphTopic`: tiêu đề, yêu cầu đề bài, trình độ (Beginner/Intermediate/Advanced), số từ tối thiểu/tối đa, danh sách yêu cầu cụ thể. `GET/POST /paragraph/admin/topics`, `PUT/DELETE /paragraph/admin/topics/:id`.

## Quản lý Writing Learning (Learning Topics Management)

CRUD 19 chủ đề học: slug, tiêu đề (Anh/Việt), danh mục (grammar/writing_skill), mô tả, lý thuyết (cú pháp markdown rút gọn `## heading` / `- bullet`), ví dụ (mỗi dòng `câu Anh :: câu Việt (tùy chọn) :: giải thích`), lỗi thường gặp (mỗi dòng `câu sai :: câu đúng :: giải thích`), `practiceTag` (khớp với `grammarTopic` của câu hỏi để tab Practice lấy đúng bài luyện), `externalPracticePath` (nếu tab Practice/AI Writing của chủ đề này thực chất trỏ sang trang khác — dùng cho 2 chủ đề "sentence-writing"/"paragraph-writing" trỏ sang `/practice`/`/paragraph-writing`). `GET/POST /learning/admin/topics`, `PUT/DELETE /learning/admin/topics/:id`.

## Cấp độ CEFR (chỉ đọc)

`GET /topics/levels` → `topic.service.ts#getLevels()` — 6 định nghĩa cấp độ (A1–C2) là **hằng số hardcode trong method này** (mô tả, vốn từ mục tiêu, trọng tâm ngữ pháp, số câu/ngày khuyến nghị, màu hiển thị), chỉ riêng `questionCount` mỗi cấp được tính động từ `memoryStore.questions` (kể cả khi Mongo đang hoạt động — đây là hạn chế đã biết, xem [17](17-admin-management.md)).

## Lịch sử AI Chấm bài (Unified Evaluation History)

```text
AdminEvaluationsPage.tsx
↓ Promise.allSettled([
    GET /writing/admin/evaluations,
    GET /paragraph/admin/attempts
  ])
↓
writing.service.ts#getAllAttemptsAdmin  +  paragraph.service.ts#getAllAttemptsAdmin
↓
WritingAttemptModel.find() (join thủ công với UserModel lấy tên/email)
ParagraphAttemptModel.find() (join thủ công với UserModel + ParagraphTopicModel)
↓
MongoDB
```

Vì 2 backend trả 2 shape rất khác nhau (Sentence Writing là `WritingAttempt` phẳng; Paragraph Writing là `ParagraphAttempt` có mảng `revisions[]` lồng nhau), Frontend tự hợp nhất thành một bảng chung bằng 2 hàm mapper `toSentenceRow`/`toParagraphRow`, gắn `rowType: 'sentence' | 'paragraph'`. Bảng có thể lọc theo loại bài và tìm kiếm theo học viên/đề bài/câu trả lời. Modal chi tiết hiển thị đầy đủ: đề bài, câu trả lời, điểm, breakdown theo tiêu chí (chỉ Paragraph), danh sách lỗi, nhận xét AI, bản sửa gợi ý (chỉ Paragraph).

## Quy trình đăng nhập Admin

Đăng nhập Admin đi qua endpoint riêng `POST /auth/admin/login`, **không dùng chung** `POST /auth/login` với User — xem đầy đủ tại [08-authentication-and-authorization.md](08-authentication-and-authorization.md). Endpoint này từ chối ngay bất kỳ tài khoản nào không có `role === 'admin'` (trả 403, không set cookie).
