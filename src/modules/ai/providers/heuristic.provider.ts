import {
    AIProvider,
    IGenerateQuestionsInput,
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

    async generateWritingQuestions(params: IGenerateQuestionsInput): Promise<IGeneratedQuestion[]> {
        const count = params.numberOfQuestions;
        const topic = params.topicPrompt;
        const grammarTopic = params.grammarTopics.join(", ");
        const pool: IGeneratedQuestion[] = [
            {
                vietnameseSentence: `Chúng tôi thường thảo luận về chủ đề ${topic} vào các buổi tối.`,
                referenceAnswer: `We often discuss the topic of ${topic} in the evenings.`,
                alternativeAnswers: [
                    `We frequently talk about ${topic} in the evening.`,
                    `In the evenings, we usually discuss ${topic}.`,
                ],
                level: params.level,
                topic,
                grammarTopic,
                difficulty: params.difficulty,
                keywords: ["discuss", "often", "in the evenings"],
            },
            {
                vietnameseSentence: `Nếu có cơ hội tìm hiểu sâu hơn về ${topic}, tôi sẽ tham gia ngay.`,
                referenceAnswer: `If I have the opportunity to learn more about ${topic}, I will participate immediately.`,
                alternativeAnswers: [
                    `Were I to have the chance to explore ${topic}, I would join at once.`,
                    `If given the chance to study ${topic} in depth, I'll join right away.`,
                ],
                level: params.level,
                topic,
                grammarTopic,
                difficulty: params.difficulty,
                keywords: ["opportunity", "participate", "immediately"],
            },
            {
                vietnameseSentence: `Nhiều chuyên gia nhấn mạnh rằng ${topic} đóng vai trò thiết yếu trong đời sống hiện đại.`,
                referenceAnswer: `Many experts emphasize that ${topic} plays an essential role in modern life.`,
                alternativeAnswers: [
                    `Numerous specialists highlight that ${topic} is crucial in contemporary society.`,
                ],
                level: params.level,
                topic,
                grammarTopic,
                difficulty: params.difficulty,
                keywords: ["experts emphasize", "essential role", "modern life"],
            },
        ];

        return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
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
                isCorrect: true,
                status: "correct",
                score: 100,
                summary: "Câu trả lời khớp với đáp án tham khảo.",
                meaningAnalysis: { score: 100, correct: true, feedback: "Truyền đạt đúng ý câu gốc." },
                grammarAnalysis: { score: 100, feedback: "Không phát hiện lỗi ngữ pháp." },
                vocabularyAnalysis: { score: 100, feedback: "Từ vựng phù hợp." },
                structureAnalysis: { score: 100, feedback: "Cấu trúc câu rõ ràng." },
                naturalnessAnalysis: { score: 100, feedback: "Câu văn tự nhiên." },
                correctAnswer: refTrim,
                alternativeAnswers: altAnswers,
                errors: [],
                strengths: ["Cấu trúc ngữ pháp hoàn toàn chính xác", "Lựa chọn từ vựng chuẩn xác và tự nhiên"],
                weaknesses: [],
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
                    severity: "major",
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
                severity: "minor",
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
                    severity: "major",
                    wrongText: userTrim,
                    correctText: refTrim,
                    explanation: `Câu của bạn chưa diễn đạt trọn vẹn so với mẫu: cần lưu ý cách dùng các từ '${missingInUser.slice(0, 3).join(", ")}'.`,
                });
                detectedPenalty += 25;
            }
        }

        const score = Math.max(20, Math.min(90, 100 - detectedPenalty));
        const status = score >= 90 ? "correct" : score >= 60 ? "partially_correct" : "incorrect";
        const grammarScore = Math.max(30, score - 5);
        const vocabScore = score;
        const meaningScore = Math.max(50, score + 5);
        const structureScore = score;
        const naturalnessScore = Math.max(40, score - 10);

        return {
            isCorrect: false,
            status,
            score,
            summary: "Câu trả lời còn một số điểm khác biệt so với cách diễn đạt chuẩn, được đánh giá bằng bộ quy tắc dự phòng (không phải AI) vì dịch vụ AI hiện không khả dụng.",
            meaningAnalysis: { score: meaningScore, correct: meaningScore >= 70, feedback: "Ý nghĩa cơ bản đã được truyền tải nhưng chưa được AI phân tích sâu do đang dùng chế độ dự phòng." },
            grammarAnalysis: { score: grammarScore, feedback: "Phát hiện bằng quy tắc cố định, có thể chưa đầy đủ so với phân tích AI thực sự." },
            vocabularyAnalysis: { score: vocabScore, feedback: "Từ vựng được so sánh sơ bộ với đáp án mẫu." },
            structureAnalysis: { score: structureScore, feedback: "Cấu trúc câu chưa được phân tích chi tiết ở chế độ dự phòng." },
            naturalnessAnalysis: { score: naturalnessScore, feedback: "Độ tự nhiên chưa được đánh giá đầy đủ ở chế độ dự phòng." },
            correctAnswer: refTrim,
            alternativeAnswers: altAnswers,
            errors,
            strengths: ["Ý nghĩa cơ bản đã được truyền tải", "Cố gắng sử dụng từ vựng đúng ngữ cảnh"],
            weaknesses: ["Chưa thể phân tích chi tiết do dịch vụ AI đang tạm thời không khả dụng"],
            overallFeedback:
                score >= 80
                    ? "Bạn đã làm khá tốt, chỉ cần chỉnh sửa một số lỗi ngữ pháp hoặc dùng từ chưa chuẩn. (Đánh giá tạm thời bằng bộ quy tắc dự phòng, không phải AI.)"
                    : "Câu trả lời có một số điểm ngữ pháp cần lưu ý để tự nhiên và chính xác hơn. (Đánh giá tạm thời bằng bộ quy tắc dự phòng, không phải AI.)",
            recommendations: [
                "Đọc kỹ câu gốc tiếng Việt để chú ý thì và mạo từ.",
                "So sánh câu của bạn với đáp án gợi ý để rút kinh nghiệm.",
            ],
            scoreBreakdown: {
                grammar: grammarScore,
                vocabulary: vocabScore,
                meaning: meaningScore,
                sentenceStructure: structureScore,
                naturalness: naturalnessScore,
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
