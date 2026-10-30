# AI English Writing Practice API

Ứng dụng luyện viết tiếng Anh, cung cấp API xác thực, luyện viết câu/đoạn văn, học ngữ pháp, quiz và thống kê. Backend dùng Express + TypeScript; dữ liệu lưu trên MongoDB khi có cấu hình `MONGODB_URI`, nếu không thì tự chạy bằng bộ nhớ trong (dữ liệu sẽ mất khi khởi động lại server). Frontend nằm trong thư mục `client`.

## Chạy dự án

Yêu cầu Node.js và npm. Tại thư mục gốc, cài dependencies và chạy:

```bash
npm install
npm run dev
```

Backend mặc định chạy tại `http://localhost:3000`. Có thể tạo file `.env` từ `.env.example` để cấu hình cổng, MongoDB và nhà cung cấp AI. MongoDB và API key AI không bắt buộc cho testcase đăng ký tài khoản dưới đây.

Kiểm tra server:

```http
GET http://localhost:3000/health
```

Kết quả mong đợi: HTTP `200` và JSON có `success: true`.

## Testcase Postman: Đăng ký tài khoản học viên

**Mục tiêu:** xác nhận API tạo tài khoản mới trả về thành công và access token.

1. Mở Postman, tạo request mới.
2. Chọn method `POST`, nhập URL:

   ```text
   http://localhost:3000/api/auth/register
   ```

3. Trong tab **Body**, chọn **raw** và kiểu **JSON**, nhập dữ liệu (email cần chưa được đăng ký):

   ```json
   {
     "name": "Nguyen Van A",
     "email": "nguyenvana.postman@example.com",
     "password": "Password123",
     "confirmPassword": "Password123"
   }
   ```

4. Nhấn **Send**.

**Kết quả mong đợi:** HTTP `201 Created`; JSON phản hồi có `success: true`, thông báo đăng ký thành công, `data.user` chứa thông tin tài khoản và `data.accessToken` không rỗng. Response cũng thiết lập cookie `user_refresh_token` dạng HttpOnly. Mật khẩu không được trả về trong thông tin user.

**Lưu ý:** mỗi lần chạy lại cần đổi sang email chưa tồn tại. Để kiểm tra validation, gửi `password` ngắn hơn 8 ký tự hoặc `confirmPassword` không trùng; request sẽ bị từ chối với lỗi validation. Cấu trúc lỗi cụ thể được middleware trả về.

## API xác thực liên quan

Các endpoint được gắn dưới tiền tố `/api/auth`:

- `POST /register` — đăng ký tài khoản.
- `POST /login` — đăng nhập, nhận access token và refresh cookie.
- `GET /me` — lấy hồ sơ hiện tại; cần header `Authorization: Bearer <accessToken>`.
- `POST /refresh` — làm mới access token bằng refresh cookie.
- `POST /logout` — đăng xuất và xóa refresh cookie.

Các route nghiệp vụ khác được khai báo trong `src/app.ts` và các file `*.route.ts` tương ứng trong `src/modules`.

## Phân tích JWT và testcase Postman

### Chức năng JWT hiện tại

- Khi đăng ký hoặc đăng nhập, API cấp **access token dạng JWT** trong `data.accessToken`. Payload gồm `id`, `email`, `role`, `name`; thời hạn mặc định là `15m` (`JWT_EXPIRES_IN`). Client gửi token này qua header `Authorization: Bearer <accessToken>`.
- Middleware `authenticate` xác minh chữ ký bằng `JWT_SECRET`, kiểm tra hạn token, sau đó kiểm tra tài khoản còn tồn tại và đang hoạt động. Token sai, hết hạn, tài khoản không tồn tại hoặc bị khóa đều bị từ chối với HTTP `401`.
- Middleware `authorize` kiểm tra role đã có trong access token. Đúng token nhưng không đủ quyền nhận HTTP `403`.
- **Refresh token không phải JWT**: đây là chuỗi ngẫu nhiên, được trả qua cookie HttpOnly (`user_refresh_token` hoặc `admin_refresh_token`). Server chỉ lưu HMAC hash của token; refresh sẽ thu hồi token cũ và cấp cặp token mới. Thời hạn mặc định là 30 ngày (`REFRESH_TOKEN_EXPIRES_IN_DAYS`).
- Đăng xuất thu hồi refresh token và xóa cookie, nhưng access token đã cấp vẫn dùng được đến khi hết hạn. Middleware kiểm tra trạng thái `isActive` trên mỗi request, nhưng role được tin theo payload access token; thay đổi role không có hiệu lực với access token cũ cho đến khi token hết hạn.
- Cấu hình mặc định có secret dự phòng trong mã nguồn. Khi triển khai thật, cần đặt `JWT_SECRET` và `REFRESH_TOKEN_SECRET` riêng, đủ mạnh, qua biến môi trường.

### Chuẩn bị Postman

Tạo environment với `baseUrl` bằng `http://localhost:3000`, `userEmail`, `userPassword`, `userAccessToken`, `adminEmail`, `adminPassword`, `adminAccessToken`. Server lắng nghe cổng `3000` mặc định; nếu thay `PORT`, cập nhật `baseUrl` tương ứng. Đăng ký một tài khoản user và chuẩn bị một tài khoản admin đã được cấp role `admin`.

Trong request đăng nhập user/admin, có thể dùng tab **Tests** để lưu access token tương ứng:

```javascript
const body = pm.response.json();
if (body.success && body.data.accessToken) {
   pm.environment.set("userAccessToken", body.data.accessToken);
}
```

Với request admin, thay `userAccessToken` bằng `adminAccessToken`. Bật cookie jar cho `localhost` để Postman tự gửi và cập nhật refresh cookie. Để thử token hết hạn, tạm đặt `JWT_EXPIRES_IN=1s` trong `.env`, khởi động lại server, đăng nhập lấy token mới, đợi vài giây rồi gọi endpoint cần đăng nhập; sau khi kiểm thử, xóa biến này và khởi động lại.

| ID | Mục tiêu | Tiền điều kiện / request Postman | Kết quả mong đợi |
|---|---|---|---|
| JWT-01 | Cấp token khi đăng ký | Email chưa tồn tại; `POST {{baseUrl}}/api/auth/register`, body đăng ký hợp lệ | HTTP `201`; có `data.accessToken`; cookie `user_refresh_token` được thiết lập với `HttpOnly`; user không chứa mật khẩu. |
| JWT-02 | Cấp token khi đăng nhập user | Tài khoản user hợp lệ; `POST {{baseUrl}}/api/auth/login`, Body raw JSON gồm `email={{userEmail}}` và `password={{userPassword}}` | HTTP `200`; `data.accessToken` không rỗng; cookie `user_refresh_token` được thiết lập. Lưu token vào `userAccessToken`. |
| JWT-03 | Từ chối thông tin đăng nhập sai | `POST {{baseUrl}}/api/auth/login`; dùng email hợp lệ và mật khẩu sai | HTTP `401`; `success = false`; không có access token mới. |
| JWT-04 | Truy cập endpoint yêu cầu đăng nhập | `GET {{baseUrl}}/api/auth/me`; Authorization Bearer `{{userAccessToken}}` | HTTP `200`; dữ liệu hồ sơ khớp user, không có trường mật khẩu. |
| JWT-05 | Từ chối khi thiếu Authorization | `GET {{baseUrl}}/api/auth/me`; bỏ header Authorization | HTTP `401`; không trả hồ sơ. |
| JWT-06 | Từ chối sai scheme hoặc token rỗng | Gọi `GET {{baseUrl}}/api/auth/me` với `Authorization: Basic abc`, `Bearer` hoặc `Bearer ` | HTTP `401`; không truy cập được tài nguyên. |
| JWT-07 | Từ chối chuỗi token sai định dạng | `GET {{baseUrl}}/api/auth/me`; đặt `Authorization: Bearer abc.def.ghi` | HTTP `401`; `success = false`. |
| JWT-08 | Từ chối token bị sửa chữ ký | Lấy access token hợp lệ, sửa một ký tự ở phần cuối rồi gửi đến `GET {{baseUrl}}/api/auth/me` | HTTP `401`; JWT không vượt qua kiểm tra chữ ký. |
| JWT-09 | Từ chối token hết hạn | Làm theo hướng dẫn `JWT_EXPIRES_IN=1s`, đăng nhập mới, chờ token hết hạn rồi gọi `GET {{baseUrl}}/api/auth/me` | HTTP `401`; thông báo phiên hết hạn hoặc không hợp lệ. Đăng nhập lại sẽ cấp token dùng được. |
| JWT-10 | Không chấp nhận refresh token làm Bearer JWT | Gửi giá trị cookie refresh làm `Authorization: Bearer <refresh-token>` tới `GET {{baseUrl}}/api/auth/me` | HTTP `401`; refresh token opaque không phải access JWT. |
| JWT-11 | Từ chối tài khoản không hoạt động | Có tài khoản và access token; admin khóa tài khoản bằng `PUT {{baseUrl}}/api/users/{{userId}}/status` với admin Bearer token | Lần gọi tiếp theo `GET {{baseUrl}}/api/auth/me` bằng token user nhận HTTP `401`; mở khóa lại để tiếp tục test. |
| JWT-12 | Từ chối user truy cập chức năng admin | `GET {{baseUrl}}/api/analytics/admin/stats` với `{{userAccessToken}}` | HTTP `403`; token hợp lệ nhưng role không đủ quyền. |
| JWT-13 | Cho phép admin truy cập chức năng admin | Đăng nhập tại `POST {{baseUrl}}/api/auth/admin/login` bằng tài khoản admin; gọi `GET {{baseUrl}}/api/analytics/admin/stats` với admin Bearer token | Login HTTP `200`, có `data.accessToken` và cookie `admin_refresh_token`; endpoint admin không bị từ chối do quyền (thường HTTP `200`). Lưu token vào `adminAccessToken`. |
| JWT-14 | Từ chối user đăng nhập cổng admin | `POST {{baseUrl}}/api/auth/admin/login` bằng credentials user | HTTP `403`; không cấp cookie admin; phiên refresh vừa tạo bị thu hồi. |
| JWT-15 | Refresh user session hợp lệ | Đăng nhập user và để Postman giữ `user_refresh_token`; `POST {{baseUrl}}/api/auth/refresh`, không cần body | HTTP `200`; có access token mới và cookie refresh mới. Lưu access token mới; token refresh cũ không được dùng lại. |
| JWT-16 | Từ chối refresh khi thiếu cookie | Xóa `user_refresh_token` trong Cookie Manager; `POST {{baseUrl}}/api/auth/refresh` | HTTP `401`; không cấp token; cookie user refresh bị xóa trong response. |
| JWT-17 | Từ chối refresh token không hợp lệ | Gửi `POST {{baseUrl}}/api/auth/refresh` với cookie `user_refresh_token=invalid-value` | HTTP `401`; không cấp access token. |
| JWT-18 | Từ chối dùng lại refresh token đã xoay vòng | Sao lưu giá trị cookie user cũ trước JWT-15; sau khi refresh thành công, gửi request refresh khác với cookie cũ | HTTP `401`; token cũ đã bị thu hồi. Postman thường tự cập nhật cookie, vì vậy cần gửi giá trị cookie cũ thủ công cho request này. |
| JWT-19 | Refresh token bị thu hồi sau logout | Đăng nhập user, sao lưu refresh cookie; gọi `POST {{baseUrl}}/api/auth/logout`, sau đó gửi `POST {{baseUrl}}/api/auth/refresh` với cookie đã sao lưu | Logout HTTP `200` và xóa cookie; refresh bằng cookie cũ nhận HTTP `401`. Access JWT cũ vẫn có thể gọi endpoint đến khi hết hạn. |
| JWT-20 | Tách biệt phiên user và admin | Đăng nhập ở cả hai cổng; kiểm tra Cookie Manager và gọi riêng `/api/auth/refresh` rồi `/api/auth/admin/refresh` | Cookie lần lượt là `user_refresh_token` và `admin_refresh_token`; refresh mỗi cổng chỉ xoay vòng phiên tương ứng. |
| JWT-21 | Kiểm tra access token admin sau khi hạ role | Dùng admin token gọi `PUT {{baseUrl}}/api/users/{{adminUserId}}` với body raw JSON `{"role":"user"}`; sau đó gọi `GET {{baseUrl}}/api/analytics/admin/stats` bằng access token admin cũ | **Hành vi hiện tại:** access token cũ vẫn được chấp nhận đến khi hết hạn vì middleware chỉ tải lại `isActive`, không tải lại role. Đây là giới hạn cần lưu ý nếu yêu cầu thu hồi quyền admin ngay lập tức. |
| JWT-22 | Từ chối admin refresh sau khi hạ role | Sau JWT-21, gọi `POST {{baseUrl}}/api/auth/admin/refresh` khi Postman giữ cookie admin cũ | HTTP `403`; cookie admin bị xóa và refresh session bị thu hồi vì role hiện tại không còn là admin. |
| JWT-23 | JWT không thay thế xác thực cho refresh | Bỏ cookie và chỉ gửi Bearer access token tới `POST {{baseUrl}}/api/auth/refresh` | HTTP `401`; refresh endpoint chỉ đọc refresh cookie, không dùng access token. |

Với các ca `401`/`403`, kiểm tra thêm `success = false` và không có dữ liệu nhạy cảm/token mới trong response. Kiểm tra cookie tại **Headers** (`Set-Cookie`) hoặc Cookie Manager; không thể đọc cookie HttpOnly bằng JavaScript trong Postman. JWT-21 ghi nhận giới hạn hiện tại: nếu yêu cầu nghiệp vụ là quyền admin phải mất hiệu lực ngay sau khi hạ role, kết quả hiện tại chưa đáp ứng yêu cầu đó.

## Bộ testcase Postman bổ sung

**Quy ước:** Base URL là `http://localhost:3000`. Với request cần xác thực, chọn **Authorization → Bearer Token** và điền access token lấy từ testcase đăng ký/đăng nhập ở trên. Các testcase `TC-02` đến `TC-11` là 10 testcase bổ sung; thay email mẫu bằng tài khoản đã tạo trong môi trường test. Kết quả dưới đây mô tả phản hồi thành công dự kiến theo API hiện tại.

| ID | Chức năng / mục tiêu | Tiền điều kiện | Request Postman | Kết quả mong đợi |
|---|---|---|---|---|
| TC-02 | Kiểm tra health check | Server đang chạy | `GET {{baseUrl}}/health` | HTTP `200`; `success = true`; thông báo API đang hoạt động. |
| TC-03 | Đăng nhập thành công | Tài khoản học viên đã đăng ký | `POST {{baseUrl}}/api/auth/login`; Body JSON: `{"email":"nguyenvana.postman@example.com","password":"Password123"}` | HTTP `200`; `success = true`; `data.accessToken` không rỗng, `data.user.email` đúng tài khoản; response có cookie `user_refresh_token`. |
| TC-04 | Từ chối đăng nhập sai mật khẩu | Tài khoản có tồn tại | `POST {{baseUrl}}/api/auth/login`; Body JSON: `{"email":"nguyenvana.postman@example.com","password":"WrongPassword"}` | HTTP `401`; `success = false`; không trả access token. |
| TC-05 | Lấy hồ sơ người dùng đã xác thực | Có access token hợp lệ | `GET {{baseUrl}}/api/auth/me`; Authorization: Bearer Token | HTTP `200`; `success = true`; `data.email` khớp tài khoản; không có trường mật khẩu. |
| TC-06 | Chặn truy cập hồ sơ khi chưa đăng nhập | Không gửi Authorization token | `GET {{baseUrl}}/api/auth/me` | HTTP `401`; `success = false`; không trả thông tin hồ sơ. |
| TC-07 | Làm mới access token | Đã đăng nhập; Postman giữ cookie `user_refresh_token` | `POST {{baseUrl}}/api/auth/refresh`; không cần body; bật cookie jar cho `localhost` | HTTP `200`; `success = true`; có `data.accessToken` mới và cookie refresh được cập nhật. |
| TC-08 | Từ chối refresh khi thiếu cookie | Xóa cookie `user_refresh_token` trong Postman Cookie Manager | `POST {{baseUrl}}/api/auth/refresh`; không body, không cookie | HTTP `401`; `success = false`; thông báo không tìm thấy phiên đăng nhập hoặc không thể làm mới phiên. |
| TC-09 | Lấy danh sách chủ đề | Không cần đăng nhập | `GET {{baseUrl}}/api/topics` | HTTP `200`; `success = true`; `data` là danh sách chủ đề (có thể rỗng nếu chưa có dữ liệu). |
| TC-10 | Lấy danh sách chủ điểm ngữ pháp | Không cần đăng nhập | `GET {{baseUrl}}/api/grammar` | HTTP `200`; `success = true`; `data` là danh sách chủ điểm ngữ pháp (có thể rỗng nếu chưa có dữ liệu). |
| TC-11 | Lấy danh sách câu hỏi luyện viết | Không cần đăng nhập | `GET {{baseUrl}}/api/writing/questions?level=A1&limit=5&page=1` | HTTP `200`; `success = true`; phản hồi chứa kết quả phân trang; không tiết lộ đáp án chuẩn trong câu hỏi công khai. |

### Cách ghi nhận kết quả kiểm thử

Trong Postman, lưu lại cho từng testcase: **Actual Result** (status code và trường phản hồi chính), **Status** (`Pass` / `Fail`), thời điểm chạy và ghi chú lỗi nếu có. Đánh dấu `Pass` khi toàn bộ điều kiện trong cột “Kết quả mong đợi” được đáp ứng. Nếu dùng MongoDB hoặc seed data khác nhau, nội dung danh sách có thể thay đổi; kiểm tra cấu trúc phản hồi thay vì so sánh cứng từng phần tử.
