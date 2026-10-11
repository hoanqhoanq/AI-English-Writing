# 16 — Writing Learning & Analytics

## Analytics — nguồn dữ liệu và nơi tính toán

Toàn bộ nằm trong [analytics.service.ts](../../src/modules/analytics/analytics.service.ts), tính **động mỗi lần gọi API** (không có bảng thống kê được tính sẵn/cache) — trừ `AIAnalysis` là kết quả được lưu lại.

| Chỉ số | Nguồn | Hàm tính | API |
|---|---|---|---|
| Tổng số câu đã viết (`totalAttempts`) | đếm `WritingAttemptModel` theo `userId` | `getOverview` | `GET /analytics/overview` |
| Điểm trung bình (`averageScore`) | trung bình `finalScore` của các attempt | `getOverview` | `GET /analytics/overview` |
| Độ chính xác (`accuracy`) | tỉ lệ attempt có `status: "correct"` | `getOverview` | `GET /analytics/overview` |
| Streak (số ngày liên tiếp) | field `User.streak`, tính bằng `computeNextStreak()` ở `writing.service.ts#submitAttempt` khi nộp bài Sentence Writing (xem [14](14-writing-workflow.md)) | — | `GET /auth/me` (không phải qua analytics) |
| Phân bố lỗi theo loại | đếm `WritingErrorModel` theo `userId`, group theo `type` | `getErrors` | `GET /analytics/errors` |
| Thống kê theo chủ đề/ngữ pháp | group `WritingAttemptModel` theo `topic`/`grammarTopic` | `getTopics`/`getGrammar` | `GET /analytics/topics`, `/grammar` |
| Biểu đồ điểm theo thời gian | 15 attempt gần nhất + hoạt động 7 ngày gần nhất | `getTrends` | `GET /analytics/trends` |
| Chẩn đoán AI | xem mục dưới | `performAIAnalysis`/`getLatestAIAnalysis` | `GET`/`POST /analytics/ai-analysis` |
| Thống kê hệ thống (Admin) | toàn bộ `User`/`WritingQuestion`/`WritingAttempt`/`WritingError` | `getSystemStats` | `GET /analytics/admin/stats` |

**Lưu ý quan trọng đã xác minh trong code**: `totalAttempts`/`accuracy`/`averageScore` ở `/analytics/overview` chỉ tính trên `WritingAttemptModel` (Sentence Writing) — **không** gồm các lượt Paragraph Writing. Paragraph có bộ số liệu hoàn toàn riêng (`GET /paragraph/my-stats` → `paragraph.service.ts#getMyParagraphStats`).

## Chẩn đoán điểm yếu AI (AI Diagnosis)

```text
GET /analytics/ai-analysis  →  chỉ ĐỌC: trả bản chẩn đoán gần nhất đã lưu, hoặc null nếu chưa có (KHÔNG bao giờ gọi AI)
POST /analytics/ai-analysis →  LUÔN gọi AI sinh bản chẩn đoán mới và lưu lại (bấm nút "Chẩn đoán điểm yếu AI mới")
```

Nhờ vậy việc mở trang Analytics không bao giờ tự tiêu tốn lượt gọi AI: chỉ khi học viên chủ động bấm nút thì `performAIAnalysis()` mới chạy (và ghi log `[AI SERVICE] Analytics AI analysis requested explicitly`). Nếu chưa có bản chẩn đoán nào, giao diện đơn giản không hiển thị card chẩn đoán cho tới khi học viên bấm nút.

`performAIAnalysis()`: tổng hợp `errorTypeCounts`, `grammarErrorCounts`, `topicPerformance`, và tối đa 8 lỗi gần nhất kèm ví dụ cụ thể (`recentMistakes`), gọi `aiService.analyzeWeakness()` (prompt: [weakness-analysis.prompt.ts](../../src/modules/ai/prompts/weakness-analysis.prompt.ts) — yêu cầu rõ "Do NOT invent fake data, chỉ phân tích trên số liệu được cung cấp"), lưu kết quả thành document `AIAnalysisModel` mới mỗi lần chạy.

**JSON output thật** (theo `WeaknessAnalysisSchema`, Zod):
```json
{
  "overallLevel": "B1",
  "strengths": ["..."],
  "weaknesses": ["ưu tiên theo mức độ quan trọng"],
  "repeatedErrors": [
    { "type": "...", "category": "...", "frequency": 0, "exampleMistake": "...", "correction": "...", "advice": "tiếng Việt" }
  ],
  "progress": "improving | stable | needs_attention",
  "analysis": "bình luận chẩn đoán chuyên sâu, tiếng Việt",
  "recommendations": ["..."]
}
```

## Writing Learning — tiến độ & gamification

`learning.service.ts#getProgressOverview` tính:
- **% hoàn thành theo chủ đề** (`completion`): `số section đã xem / 4` (4 section: learn, examples, practice, aiWriting), đánh dấu qua `POST /learning/topics/:slug/progress/section-viewed`, lưu trong `LearningProgress.completedSections[]`.
- **Weak topics**: 5 chủ điểm ngữ pháp có điểm trung bình thấp nhất, lấy từ `analyticsService.getGrammar(userId)` (tái sử dụng trực tiếp — không viết lại logic).
- **XP/Level**: `xp = totalWriting*8 + (totalWriting*averageScore)/20 + completedTopics*100 + paragraphGoodAttempts*40`, `level = floor(sqrt(xp/100)) + 1` — công thức nằm nguyên trong `getProgressOverview`, tính lại mỗi request, **không lưu thành field**.

## Cơ chế cập nhật thống kê KHÔNG cần F5 (điểm quan trọng, mới sửa gần đây)

### Vấn đề trước khi sửa
Trước đây, sau khi User làm bài xong (Sentence Writing/Question Bank/AI Writing/Paragraph Writing), quay về Dashboard hoặc Analytics vẫn thấy **số liệu cũ** cho tới khi bấm F5.

### Nguyên nhân gốc rễ (đã xác minh trong code, không chỉ là caching)
Ngoài việc thiếu cơ chế refetch, còn có một **lỗi tên field thật sự**: `AnalyticsPage.tsx` từng đọc `overview?.totalWriting` và `overview?.currentStreak`, nhưng response thật của `GET /analytics/overview` chỉ có `totalAttempts` (không có `totalWriting`) và **không có field streak nào cả**. Vì vậy 2 trong 3 chỉ số luôn rơi vào giá trị fallback hardcode (`?? 18`, `?? 4`) ở **mọi lần tải**, kể cả sau khi F5 — không phải chỉ là vấn đề "chưa refetch". Điểm trung bình (`averageScore`) thì tên field khớp đúng nên vẫn luôn lấy được số thật.

### Cách khắc phục
1. **Sửa đúng tên field**: `AnalyticsPage.tsx` đổi sang đọc `overview?.totalAttempts`; bỏ hẳn `overview?.currentStreak` (không tồn tại), streak lấy từ `user?.streak` (nguồn đúng — field trên chính `User` document). Kiểu `AnalyticsOverview` ở [client/src/types/index.ts](../../client/src/types/index.ts) cũng được sửa để khớp đúng response backend thật.
2. **Cơ chế refresh, dựa trên kiến trúc sẵn có (React Query), không tạo hệ thống mới**: dự án đã dùng `@tanstack/react-query` với một `QueryClient` dùng chung toàn bundle User (`App.tsx`). `AnalyticsPage.tsx` được chuyển từ `useState`+`useEffect` sang `useQuery(['analytics','overview'])`/`useQuery(['analytics','ai-analysis'])`. Ba flow làm bài (`PracticePage.tsx`, `WritingQuestionPage.tsx`, `ParagraphTopicPage.tsx`) — ngay trong `onSuccess` của mutation submit — gọi:
   ```ts
   queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
   refreshUser();
   ```
3. **`refreshUser()`** — hàm mới thêm vào `AuthContext.tsx`, gọi `GET /auth/me` và thay toàn bộ object `user` trong Context (nơi giữ `streak`/`totalWriting`/`averageScore` thật) — vì đây là dữ liệu Context (không phải React Query), cần cơ chế riêng, không thể dùng `invalidateQueries`.
4. Kết quả: Dashboard đọc `user?.streak` trực tiếp từ Context → tự động thấy giá trị mới ngay khi `refreshUser()` chạy xong, không cần điều hướng hay F5. Analytics đọc từ `useQuery` → tự động refetch ngay khi bị `invalidateQueries` đánh dấu cũ.

### Vì sao không polling liên tục
Không có `setInterval` nào được thêm vào — refetch chỉ xảy ra đúng lúc có sự kiện thật (làm bài xong), hoặc khi component Analytics tự mount lần đầu (hành vi mặc định của `useQuery`, `staleTime` không được set → mặc định coi là stale, tự refetch khi mount/focus lại).

### Vì sao AI diagnosis không tự sinh lại sau mỗi lượt bài
Query `['analytics','ai-analysis']` **không** nằm trong danh sách bị `invalidateQueries` sau mỗi lượt làm bài, và `GET /analytics/ai-analysis` chỉ đọc bản đã lưu (không gọi AI). Card chẩn đoán AI trên Analytics chỉ được sinh mới khi user chủ động bấm "Chẩn đoán điểm yếu AI mới" (`POST /analytics/ai-analysis`), và chỉ đọc lại khi trang được mount lại.

## Thống kê Grammar Quiz

Trang Analytics còn có card thống kê Quiz, lấy từ module Quiz (không nằm trong `analytics.service.ts`):

| Dữ liệu | Nguồn | API |
|---|---|---|
| 5 bài quiz gần nhất | `QuizAttempt` có `status: "completed"` | `GET /quiz/history?limit=5` |
| Tổng bài, tổng câu, điểm trung bình, tỷ lệ đúng, độ chính xác theo thì và theo cấp độ | tính từ các `QuizAttempt` đã hoàn thành (`quiz.service.ts#getQuizStats`) | `GET /quiz/stats` |

Điểm một bài quiz = `round(số câu đúng / tổng số câu × 100)`, tính ở server khi nộp bài. Card này chỉ hiện khi học viên đã làm ít nhất một bài quiz. Module Quiz cần MongoDB.

## Vòng lặp học: Học → Quiz → Viết → Chấm → Sửa → Ôn lại

Các chức năng được nối với nhau bằng liên kết trực tiếp, không cần API riêng:

- Trang một chủ đề Writing Learning ([LearningTopicPage.tsx](../../client/src/user/pages/LearningTopicPage.tsx)) có nút nhanh "Luyện viết {chủ đề}" (chuyển sang tab AI Writing của chính trang đó); riêng chủ đề thuộc nhóm ngữ pháp còn có thêm "Làm Quiz {thì}" (`/quiz?tense=<slug>`, trang quiz tự chọn sẵn thì đó, người dùng vẫn đổi được).
- Kết quả chấm câu có nút "Ôn lại" và "Quiz" cho thì liên quan, cùng panel so sánh giữa các lần nộp (xem [14](14-writing-workflow.md)).
