// Static, per-grammar-topic scaffolding tips — never tied to any specific
// question's content or answer. Reused across every question that shares a
// grammarTopic, so this is never "hardcoded per question": the same entry
// serves every question tagged with that topic, exactly like a textbook
// reference note. Keys match the real grammarTopic values already used
// across the seeded question bank and the 12-tense Learning topics.
const GRAMMAR_STRUCTURE_HINTS: Record<string, string> = {
    "present simple": "Dùng để diễn tả thói quen, sự thật hiển nhiên. Chia động từ theo chủ ngữ (thêm -s/-es với ngôi thứ ba số ít). Cấu trúc: S + V(s/es) + O.",
    "present continuous": "Diễn tả hành động đang xảy ra tại thời điểm nói. Cấu trúc: S + am/is/are + V-ing.",
    "past simple": "Diễn tả hành động đã xảy ra và kết thúc trong quá khứ. Cấu trúc: S + V-ed/V2 + O.",
    "past continuous": "Diễn tả hành động đang diễn ra tại một thời điểm xác định trong quá khứ. Cấu trúc: S + was/were + V-ing.",
    "present perfect": "Diễn tả hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại, hoặc kinh nghiệm/kết quả. Cấu trúc: S + have/has + V3/V-ed.",
    "present perfect continuous": "Nhấn mạnh khoảng thời gian một hành động đã và đang diễn ra tính đến hiện tại. Cấu trúc: S + have/has been + V-ing.",
    "past perfect": "Diễn tả một hành động xảy ra trước một hành động khác trong quá khứ. Cấu trúc: S + had + V3/V-ed, before/after S + V-ed.",
    "past perfect continuous": "Nhấn mạnh khoảng thời gian một hành động đã diễn ra trước một hành động khác trong quá khứ. Cấu trúc: S + had been + V-ing.",
    "future simple": "Diễn tả dự đoán hoặc quyết định tức thời trong tương lai. Cấu trúc: S + will + V (nguyên mẫu).",
    "be going to": "Diễn tả dự định đã lên kế hoạch hoặc dự đoán có căn cứ. Cấu trúc: S + am/is/are + going to + V.",
    "future continuous": "Diễn tả hành động sẽ đang diễn ra tại một thời điểm xác định trong tương lai. Cấu trúc: S + will be + V-ing.",
    "future perfect": "Diễn tả hành động sẽ hoàn thành trước một thời điểm/mốc trong tương lai. Cấu trúc: S + will have + V3/V-ed.",
    "articles": "Chú ý cách dùng mạo từ a/an (danh từ đếm được, số ít, chưa xác định) và the (đã xác định, đã được nhắc tới). Cấu trúc: a/an/the + Noun.",
    "comparatives": "Dùng để so sánh hơn giữa hai đối tượng. Cấu trúc: Adj-er/more + Adj + than.",
    "superlatives": "Dùng để so sánh nhất giữa từ ba đối tượng trở lên. Cấu trúc: the + Adj-est/most + Adj.",
    "conditionals": "Diễn tả điều kiện và kết quả — chú ý chọn đúng loại câu điều kiện phù hợp với ngữ cảnh (hiện tại/tương lai có thật, giả định không thật ở hiện tại, giả định không thật ở quá khứ). Cấu trúc: If + S + V, S + will/would/would have + V.",
    "gerunds & infinitives": "Một số động từ theo sau bởi V-ing (gerund), một số theo sau bởi to V (infinitive) — cần ghi nhớ theo từng động từ cụ thể. Cấu trúc: V + V-ing hoặc V + to V.",
    "modal verbs": "Dùng động từ khuyết thiếu (can, could, must, should, may...) để diễn tả khả năng, sự cho phép, lời khuyên, sự bắt buộc. Cấu trúc: S + modal verb + V (nguyên mẫu).",
    "passive voice": "Dùng khi muốn nhấn mạnh vào đối tượng chịu tác động thay vì người/vật thực hiện hành động. Cấu trúc: S + be + V3/V-ed (+ by O).",
    "prepositions": "Chú ý các giới từ đi kèm cố định với danh từ/động từ/tính từ (collocation). Cấu trúc: V/Adj/Noun + preposition + Noun.",
    "relative clauses": "Dùng để nối hai ý và bổ sung thông tin cho danh từ đứng trước. Cấu trúc: Noun + who/which/that + clause.",
    "reported speech": "Khi tường thuật lại lời nói, cần lùi thì phù hợp và đổi đại từ/trạng từ chỉ thời gian, nơi chốn. Cấu trúc: S + said (that) + S + V (lùi thì).",
    "subject-verb agreement": "Động từ phải chia phù hợp với chủ ngữ về số ít/số nhiều. Cấu trúc: Chủ ngữ số ít + V(s/es); Chủ ngữ số nhiều + V (nguyên mẫu).",
};

const GENERIC_FALLBACK_HINT = (grammarTopic: string) =>
    `Câu này thuộc chủ điểm ngữ pháp "${grammarTopic}". Hãy chú ý sử dụng đúng cấu trúc và cách chia thì phù hợp với ngữ cảnh của đề bài.`;

export const getGrammarStructureHint = (grammarTopic: string): string => {
    if (!grammarTopic) return "";
    const key = grammarTopic.trim().toLowerCase();
    return GRAMMAR_STRUCTURE_HINTS[key] || GENERIC_FALLBACK_HINT(grammarTopic);
};
