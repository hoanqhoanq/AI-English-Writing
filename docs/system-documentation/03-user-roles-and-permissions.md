# 03 — Vai trò & Phân quyền (User Roles & Permissions)

## Vai trò

Hệ thống có đúng 2 vai trò, định nghĩa một lần dưới dạng type (`UserRole = "user" | "admin"` trong [src/types/index.ts](../../src/types/index.ts)) và lưu trên mỗi document `User` (field `role`, mặc định `"user"`). Không có vai trò thứ ba, không có hệ thống phân quyền theo từng resource, không có khái niệm nhóm/team.

## Backend kiểm tra quyền như thế nào

Hai middleware, đều nằm trong [src/middlewares/auth.middleware.ts](../../src/middlewares/auth.middleware.ts):

- **`authenticate`** — yêu cầu header `Authorization: Bearer <accessToken>` hợp lệ. Verify JWT (`verifyToken`), sau đó **kiểm tra lại `isActive` trực tiếp trong database ở MỌI request** (không chỉ tin vào claim trong JWT) — nhờ vậy tài khoản bị khóa/xóa mất quyền truy cập ngay lập tức, không cần đợi access token hết hạn. Gán `req.user = { id, email, role, name }` từ payload JWT đã verify.
- **`authorize(...roles)`** — phải chạy sau `authenticate`. Trả lỗi 403 nếu `req.user.role` không nằm trong danh sách cho phép. Mọi route chỉ-dành-cho-admin trong codebase đều gọi `authorize("admin")`; không có route nào dùng tổ hợp vai trò khác.

Mọi route có tiền tố `/admin/*` (các segment admin bên trong router `writing`, `paragraph`, `learning`, `topics`, `users`, cộng thêm `/analytics/admin/stats`) đều là `authenticate + authorize("admin")`. Các route công khai (danh sách câu hỏi, danh sách chủ đề, danh sách đề đoạn văn, health check, đăng ký/đăng nhập/refresh) không có middleware nào. Mọi route còn lại (attempts, sessions, analytics overview, profile, learning progress) chỉ yêu cầu `authenticate` — bất kỳ ai đã đăng nhập, bất kể vai trò.

## Bảng vai trò

| Vai trò | Chức năng | API | Quyền |
|---|---|---|---|
| Bất kỳ (public, không cần token) | Xem ngân hàng câu hỏi, xem đề bài đoạn văn, đăng ký, đăng nhập | `GET /writing/questions(/:id)`, `GET /paragraph/topics(/:id)`, `GET /topics`, `GET /topics/grammar`, `GET /topics/levels`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` | Đọc công khai + tự đăng ký/đăng nhập |
| `user` | Toàn bộ luyện tập, xem/nộp bài, xem thống kê cá nhân, sửa hồ sơ | `POST /writing/attempts`, `POST /paragraph/attempts`, `POST /paragraph/generate`, `POST /learning/ai-writing/generate`, `POST /ai/evaluate-writing`, `/quiz/*` (sinh, nộp, lịch sử, thống kê), `GET /analytics/*` (không phải admin), `GET/PUT /users/profile`, `GET /learning/*` (không phải admin) | Chỉ dữ liệu **của chính mình** (mọi query đều lọc theo `req.user.id`) |
| `admin` | Mọi quyền của `user`, cộng thêm: quản lý người dùng, câu hỏi, đề đoạn văn, nội dung học, xem toàn bộ lịch sử chấm bài, thống kê hệ thống | Mọi route `*/admin/*`, `GET /analytics/admin/stats`, `/users/*` quản trị (`GET /users/all`, `POST /users`, `PUT`/`DELETE /users/:id`) | Toàn hệ thống — không giới hạn theo `userId` |

Lưu ý: tài khoản `admin` **không** bị chặn dùng các chức năng của User Portal (luyện viết, v.v.) — `authorize("admin")` chỉ chặn các endpoint có tiền tố admin; không có gì ngăn một admin đồng thời cũng là một học viên. Ngược lại, theo thiết kế hiện tại, **truy cập Admin Portal bắt buộc phải có `role === 'admin'`**, cả ở phía server (endpoint `/auth/admin/login` riêng sẽ từ chối thông tin đăng nhập không phải admin, xem [08](08-authentication-and-authorization.md)) lẫn phía client (`AdminProtectedRoute`).

## Cơ chế bảo vệ ở Frontend

Hai portal hoàn toàn độc lập (xem [04-system-architecture.md](04-system-architecture.md) để hiểu vì sao chúng là 2 bundle riêng), mỗi portal có route guard riêng:

- **`ProtectedRoute`** ([client/src/routes/ProtectedRoute.tsx](../../client/src/routes/ProtectedRoute.tsx)) — bọc toàn bộ route User cần đăng nhập trong `AppRoutes.tsx`. Chưa đăng nhập → `<Navigate to="/login">`.
- **`UserRoute`** ([client/src/routes/UserRoute.tsx](../../client/src/routes/UserRoute.tsx)) — lớp bảo vệ thứ hai, mỏng hơn, nằm lồng bên trong `ProtectedRoute` trong `AppRoutes.tsx`. Hiện tại có hiệu ứng giống hệt `ProtectedRoute` (chuyển hướng người chưa đăng nhập về `/login`); **không** kiểm tra vai trò — bất kỳ tài khoản nào đã đăng nhập (`user` hay `admin`) đều duyệt được User Portal.
- **`AdminProtectedRoute`** ([client/src/routes/AdminProtectedRoute.tsx](../../client/src/routes/AdminProtectedRoute.tsx)) — bọc toàn bộ route Admin trong `admin/main.tsx`. Chuyển hướng về `/admin/login` nếu chưa đăng nhập **hoặc** đã đăng nhập nhưng `user.role !== 'admin'`. Không bao giờ điều hướng ra ngoài bundle Admin (không có navigation chéo portal), đây là chủ đích thiết kế — xem [08](08-authentication-and-authorization.md) để biết lịch sử bug mà cách này đã khắc phục.

Cả hai guard đều đọc từ `useAuth()`, nhưng mỗi instance `AuthContext` của từng portal được nạp dữ liệu độc lập từ chính endpoint đăng nhập/refresh của portal đó và cookie riêng của portal đó — xem [08-authentication-and-authorization.md](08-authentication-and-authorization.md) để hiểu đầy đủ cơ chế.
