// Streak = số NGÀY LIÊN TIẾP học viên có luyện viết câu (không phải số lần nộp bài).
// "Ngày" được tính theo múi giờ Việt Nam để mốc đổi ngày là 00:00 giờ VN,
// không phụ thuộc múi giờ của máy chủ (server thường chạy giờ UTC).
const STREAK_TIME_ZONE = "Asia/Ho_Chi_Minh";
const MS_PER_DAY = 86_400_000;

// en-CA cho ra định dạng YYYY-MM-DD.
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const toDayNumber = (date: Date): number => {
    const [year, month, day] = dayFormatter.format(date).split("-").map(Number);
    return Date.UTC(year, month - 1, day) / MS_PER_DAY;
};

// Tính streak MỚI khi học viên vừa nộp một bài viết câu. Phải gọi TRƯỚC khi ghi đè lastPracticeDate.
//  - Chưa từng luyện viết:              streak = 1
//  - Đã luyện trong ngày hôm nay rồi:   giữ nguyên (ít nhất 1)
//  - Lần trước là hôm qua:              streak + 1
//  - Lần trước cách từ 2 ngày trở lên:  bắt đầu lại từ 1
export const computeNextStreak = (
    previousStreak: number,
    lastPracticeDate: Date | string | null | undefined,
    now: Date = new Date()
): number => {
    const previous = Math.max(0, Math.floor(previousStreak || 0));
    if (!lastPracticeDate) return 1;

    const last = new Date(lastPracticeDate);
    if (Number.isNaN(last.getTime())) return 1;

    const gapInDays = toDayNumber(now) - toDayNumber(last);
    if (gapInDays <= 0) return Math.max(previous, 1);
    if (gapInDays === 1) return previous + 1;
    return 1;
};
