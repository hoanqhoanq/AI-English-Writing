# 15 — Ngân hàng câu hỏi (Question Bank)

## Model

`WritingQuestion` ([question.model.ts](../../src/modules/writing/question.model.ts)) — xem field đầy đủ tại [09-database-design.md](09-database-design.md). Các field then chốt: `vietnameseSentence`, `referenceAnswer`, `alternativeAnswers[]`, `level` (A1–C2), `topic` (chuỗi tự do, trùng tên `Topic.name`), `grammarTopic` (chuỗi tự do, trùng tên `GrammarTopic.name`), `difficulty`, `keywords[]`, `hints{vocabulary[], grammar}`, `source` (`admin_manual` | `ai_user_generated`).

## Topic & Grammar Topic (dữ liệu tham khảo)

`Topic` (15 chủ đề: Daily Life, Family, School, Work, Travel, Food, Shopping, Health, Technology, Environment, Entertainment, Relationships, Sports, Business, Education) và `GrammarTopic` (18 chủ điểm: Present Simple, Present Continuous, Past Simple, Past Continuous, Present Perfect, Future Simple, Be going to, Modal Verbs, Articles, Prepositions, Comparatives, Superlatives, Conditionals, Passive Voice, Relative Clauses, Reported Speech, Subject-Verb Agreement, Gerunds & Infinitives) là 2 collection riêng, seed sẵn ([seedData.ts](../../src/seeds/seedData.ts)), dùng làm nguồn cho bộ lọc Question Bank và các dropdown chọn chủ đề/ngữ pháp khi Admin soạn câu hỏi mới. Liên kết với `WritingQuestion` là liên kết **lỏng qua tên chuỗi**, không phải khóa ngoại (xem [09-database-design.md](09-database-design.md) mục Lưu ý quan trọng).

## CEFR Level

6 cấp độ (A1–C2) là **hằng số hardcode** trong `topic.service.ts#getLevels()` (mô tả, vốn từ mục tiêu, trọng tâm ngữ pháp, số câu/ngày khuyến nghị) — không phải một collection. Field duy nhất tính động là `questionCount` (đếm số `WritingQuestion` đang có ở mỗi cấp).

## Reference answer & Hint — 2 cơ chế bảo vệ đáp án

Xem chi tiết đầy đủ tại [06-user-features.md](06-user-features.md) (mục "Làm bài trực tiếp" và "Hệ thống Gợi ý") và [12-ai-writing-evaluation.md](12-ai-writing-evaluation.md) (mục "Reference answer được xử lý thế nào"). Tóm tắt: `getQuestionById(id, includeAnswers=false)` là nhánh **duy nhất** mọi request công khai/của học viên đi qua, luôn lược bỏ `referenceAnswer`/`alternativeAnswers`; gợi ý (`hints`) được tính riêng trong nhánh an toàn này, không bao giờ dẫn xuất từ đáp án thật.

## Tạo / Sửa / Xóa câu hỏi (Admin)

```text
AdminQuestionsPage.tsx (form)
↓ POST/PUT /writing/admin/questions(/:id)
writing.controller.ts#createQuestion / updateQuestion
↓
writing.service.ts#createQuestion / updateQuestion
↓
WritingQuestionModel.create() / findByIdAndUpdate()
↓
MongoDB
```

`alternativeAnswers` và `keywords` được nhập dưới dạng text (mỗi dòng một câu / phân cách bởi dấu phẩy) rồi parse thành mảng ở cả 2 tầng — Frontend (`AdminQuestionsPage.tsx`, trước khi gửi) và Backend (`writing.service.ts#createQuestion`, cũng tự parse nếu nhận được string thay vì mảng — chấp nhận cả 2 dạng input). Xóa qua `DELETE /writing/admin/questions/:id` — xóa cứng, không kiểm tra/xóa kèm các `WritingAttempt` đã tham chiếu tới câu hỏi này (ghi ở [17](17-admin-management.md) Known Issues).

## Câu hỏi được chọn và đưa cho User như thế nào

Có 3 đường:
1. **Duyệt trực tiếp** — `GET /writing/questions` (có filter), User tự chọn 1 câu, `Play/Luyện câu này` → `/writing/question/:id`.
2. **Chọn ngẫu nhiên theo phiên (session)** — `POST /writing/sessions { level, topic?, grammarTopic?, difficulty?, questionCount }` → `writing.service.ts#createSession` lấy tập câu hỏi phù hợp filter, `shuffle` bằng `Array.sort(() => 0.5 - Math.random())`, nếu không đủ số lượng thì nới lỏng filter dần (bỏ topic/difficulty → chỉ theo level → bất kỳ câu active nào). **[PARTIAL]**: cơ chế session này có API đầy đủ (`POST /writing/sessions`, `GET /writing/sessions/:id`) nhưng không tìm thấy trang Frontend nào trong `client/src/user/pages/` gọi tới `POST /writing/sessions` — có khả năng là tính năng cũ còn lại từ một phiên bản UI trước, hiện chưa (hoặc không còn) được UI sử dụng.
3. **AI sinh riêng cho user** — xem [13-ai-paragraph-generation.md](13-ai-paragraph-generation.md) mục B.
