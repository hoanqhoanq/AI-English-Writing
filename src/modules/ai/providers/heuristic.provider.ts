import {
    AIProvider,
    IEvaluationInput,
    IWeaknessAnalysisInput,
} from "../ai.interface";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IWeaknessAnalysisResult,
    IErrorDetail,
} from "../../../types";

export class HeuristicProvider implements AIProvider {
    readonly name = "heuristic_fallback";

    async generateWritingQuestions(params: {
        level: CefrLevel;
        topic: string;
        grammarTopic?: string;
        difficulty?: DifficultyLevel;
        count?: number;
    }): Promise<IGeneratedQuestion[]> {
        const count = params.count || 3;
        const pool: IGeneratedQuestion[] = [
            {
                vietnameseSentence: `Chúng tôi thường thảo luận về chủ đề ${params.topic} vào các buổi tối.`,
                referenceAnswer: `We often discuss the topic of ${params.topic} in the evenings.`,
                alternativeAnswers: [
                    `We frequently talk about ${params.topic} in the evening.`,
                    `In the evenings, we usually discuss ${params.topic}.`,
                ],
                level: params.level,
                topic: params.topic,
                grammarTopic: params.grammarTopic || "Present Simple",
                difficulty: params.difficulty || "medium",
                keywords: ["discuss", "often", "in the evenings"],
            },
            {
                vietnameseSentence: `Nếu có cơ hội tìm hiểu sâu hơn về ${params.topic}, tôi sẽ tham gia ngay.`,
                referenceAnswer: `If I have the opportunity to learn more about ${params.topic}, I will participate immediately.`,
                alternativeAnswers: [
                    `Were I to have the chance to explore ${params.topic}, I would join at once.`,
                    `If given the chance to study ${params.topic} in depth, I'll join right away.`,
                ],
                level: params.level,
                topic: params.topic,
                grammarTopic: params.grammarTopic || "Conditionals",
                difficulty: params.difficulty || "medium",
                keywords: ["opportunity", "participate", "immediately"],
            },
            {
                vietnameseSentence: `Nhiều chuyên gia nhấn mạnh rằng ${params.topic} đóng vai trò thiết yếu trong đời sống hiện đại.`,
                referenceAnswer: `Many experts emphasize that ${params.topic} plays an essential role in modern life.`,
                alternativeAnswers: [
                    `Numerous specialists highlight that ${params.topic} is crucial in contemporary society.`,
                ],
                level: params.level,
                topic: params.topic,
                grammarTopic: params.grammarTopic || "Subject-Verb Agreement",
                difficulty: params.difficulty || "hard",
                keywords: ["experts emphasize", "essential role", "modern life"],
            },
        ];

        return pool.slice(0, count);
    }

    async evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult> {
        const userTrim = input.userAnswer.trim();
        const refTrim = input.referenceAnswer.trim();
        const altAnswers = input.alternativeAnswers || [];

        // Check exact match (ignoring case and ending punctuation)
        const normalize = (s: string) =>
            s.toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();
        const normUser = normalize(userTrim);
        const normRef = normalize(refTrim);

        if (normUser === normRef || altAnswers.some((alt) => normalize(alt) === normUser)) {
            return {
                status: "correct",
                score: 100,
                correctAnswer: refTrim,
                errors: [],
                strengths: ["Cấu trúc ngữ pháp hoàn toàn chính xác", "Lựa chọn từ vựng chuẩn xác và tự nhiên"],
                overallFeedback: "Tuyệt vời! Câu trả lời của bạn hoàn toàn chính xác và tự nhiên.",
                recommendations: ["Tiếp tục duy trì độ chính xác này ở các câu hỏi tiếp theo."],
                scoreBreakdown: {
                    grammar: 100,
                    vocabulary: 100,
                    meaning: 100,
                    sentenceStructure: 100,
                    naturalness: 100,
                },
            };
        }

        // Token-level heuristic analysis
        const userWords = userTrim.split(/\s+/);
        const refWords = refTrim.split(/\s+/);

        const errors: IErrorDetail[] = [];
        let detectedPenalty = 0;

        // Check common grammar rules
        // 1. Past simple check
        if (
            (input.vietnameseSentence.includes("đã") || input.vietnameseSentence.includes("hôm qua") || input.vietnameseSentence.includes("năm ngoái")) &&
            userTrim.match(/\b(go|see|buy|eat|is|are|have|do)\b/i)
        ) {
            const match = userTrim.match(/\b(go|see|buy|eat|is|are|have|do)\b/i);
            if (match) {
                const pastMap: Record<string, string> = {
                    go: "went",
                    see: "saw",
                    buy: "bought",
                    eat: "ate",
                    is: "was",
                    are: "were",
                    have: "had",
                    do: "did",
                };
                const wrong = match[0];
                const correct = pastMap[wrong.toLowerCase()] || "V2/V-ed";
                errors.push({
                    type: "GRAMMAR",
                    category: "TENSE",
                    wrongText: wrong,
                    correctText: correct,
                    explanation: `Câu mang ngữ cảnh quá khứ (đã/năm ngoái/hôm qua), động từ '${wrong}' cần chia ở quá khứ đơn là '${correct}'.`,
                });
                detectedPenalty += 20;
            }
        }

        // 2. Article check
        if (
            refTrim.toLowerCase().includes("the ") &&
            !userTrim.toLowerCase().includes("the ") &&
            !userTrim.toLowerCase().includes("a ") &&
            !userTrim.toLowerCase().includes("an ")
        ) {
            errors.push({
                type: "ARTICLE",
                category: "ARTICLE",
                wrongText: userWords[userWords.length - 1] || "noun",
                correctText: `the ${userWords[userWords.length - 1] || "noun"}`,
                explanation: "Thiếu mạo từ xác định 'the' trước danh từ được đề cập cụ thể.",
            });
            detectedPenalty += 15;
        }

        // 3. Word difference fallback
        if (errors.length === 0) {
            const missingInUser = refWords.filter(
                (rw) => !userWords.some((uw) => normalize(uw) === normalize(rw))
            );
            if (missingInUser.length > 0) {
                errors.push({
                    type: "VOCABULARY",
                    category: "WORD_CHOICE",
                    wrongText: userTrim,
                    correctText: refTrim,
                    explanation: `Câu của bạn chưa diễn đạt trọn vẹn so với mẫu: cần lưu ý cách dùng các từ '${missingInUser.slice(0, 3).join(", ")}'.`,
                });
                detectedPenalty += 25;
            }
        }

        const score = Math.max(20, Math.min(90, 100 - detectedPenalty));
        const status = score >= 90 ? "correct" : score >= 60 ? "partially_correct" : "incorrect";

        return {
            status,
            score,
            correctAnswer: refTrim,
            errors,
            strengths: ["Ý nghĩa cơ bản đã được truyền tải", "Cố gắng sử dụng từ vựng đúng ngữ cảnh"],
            overallFeedback:
                score >= 80
                    ? "Bạn đã làm khá tốt, chỉ cần chỉnh sửa một số lỗi ngữ pháp hoặc dùng từ chưa chuẩn."
                    : "Câu trả lời có một số điểm ngữ pháp cần lưu ý để tự nhiên và chính xác hơn.",
            recommendations: [
                "Đọc kỹ câu gốc tiếng Việt để chú ý thì và mạo từ.",
                "So sánh câu của bạn với đáp án gợi ý để rút kinh nghiệm.",
            ],
            scoreBreakdown: {
                grammar: Math.max(30, score - 5),
                vocabulary: score,
                meaning: Math.max(50, score + 5),
                sentenceStructure: score,
                naturalness: Math.max(40, score - 10),
            },
        };
    }

    async analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult> {
        const topGrammarErrors = Object.entries(input.grammarErrorCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const topErrorTypes = Object.entries(input.errorTypeCounts || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const weaknesses = topGrammarErrors.length > 0
            ? topGrammarErrors.map(([name, count]) => `Chủ điểm ngữ pháp '${name}' (${count} lỗi ghi nhận)`)
            : ["Cần chú ý chia thì động từ chính xác", "Cần bổ sung mạo từ (a/an/the)"];

        const repeated = topErrorTypes.map(([type, count]) => ({
            type,
            category: type,
            frequency: count,
            exampleMistake: "Chia sai thì động từ hoặc thiếu giới từ đi kèm",
            correction: "Sử dụng đúng thì và tra cứu collocation của động từ",
            advice: `Tập trung luyện thêm 15-20 câu liên quan đến ${type} để cải thiện độ phản xạ.`,
        }));

        return {
            overallLevel: input.overallLevel,
            strengths: [
                "Có tinh thần luyện tập viết đều đặn",
                "Khả năng nắm bắt đại ý câu tiếng Việt tốt",
            ],
            weaknesses,
            repeatedErrors: repeated,
            progress: input.averageScore >= 75 ? "improving" : "needs_attention",
            analysis: `Dựa trên ${input.totalAttempts} câu đã luyện với điểm trung bình ${Math.round(input.averageScore)}/100, bạn đang thể hiện sự tiến bộ rõ rệt ở việc xây dựng khung câu. Điểm yếu tập trung chủ yếu ở các lỗi: ${topErrorTypes.map((t) => t[0]).join(", ") || "ngữ pháp cơ bản"}.`,
            recommendations: [
                "Luyện tập thêm các bài viết theo chủ đề ngữ pháp còn yếu.",
                "Tập thói quen kiểm tra lại thì động từ và mạo từ trước khi submit câu.",
                "Luyện viết đều đặn ít nhất 5 câu mỗi ngày để duy trì streak.",
            ],
        };
    }
}
