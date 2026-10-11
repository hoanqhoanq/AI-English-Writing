import {
    AIProvider,
    IGenerateQuestionsInput,
    IEvaluationInput,
    IGenerateParagraphPromptInput,
    IParagraphEvaluationInput,
    IWeaknessAnalysisInput,
    IGenerateQuizInput,
    IGeneratedQuizQuestion,
} from "../ai.interface";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IGeneratedParagraphPrompt,
    IParagraphEvaluationResult,
    IWeaknessAnalysisResult,
    IErrorDetail,
} from "../../../types";

interface IHeuristicQuizTemplate {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

// Two hand-written, grammatically correct MCQ templates per tense — used only
// when Gemini is unavailable/misconfigured (see generateQuizQuestions below).
// Fallback quality is deliberately simple, matching the existing precedent in
// generateWritingQuestions()'s own hand-written pool.
const HEURISTIC_QUIZ_TEMPLATES: Record<string, IHeuristicQuizTemplate[]> = {
    "Present Simple": [
        {
            question: "She ___ to school every day.",
            options: ["go", "goes", "going", "went"],
            correctAnswer: 1,
            explanation: "Chủ ngữ 'She' (ngôi thứ 3 số ít) ở thì hiện tại đơn cần thêm 's/es' vào động từ: 'go' → 'goes'.",
        },
        {
            question: "Water ___ at 100 degrees Celsius.",
            options: ["boil", "boils", "is boiling", "boiled"],
            correctAnswer: 1,
            explanation: "Sự thật khoa học/chân lý luôn dùng thì hiện tại đơn, chủ ngữ số ít 'Water' cần 'boils'.",
        },
    ],
    "Present Continuous": [
        {
            question: "Look! The children ___ in the yard right now.",
            options: ["play", "plays", "are playing", "played"],
            correctAnswer: 2,
            explanation: "Hành động đang xảy ra ngay lúc nói ('right now') dùng thì hiện tại tiếp diễn: 'are playing'.",
        },
        {
            question: "I ___ this book at the moment.",
            options: ["read", "am reading", "reads", "read"],
            correctAnswer: 1,
            explanation: "'At the moment' báo hiệu hành động đang diễn ra, dùng 'am/is/are + V-ing': 'am reading'.",
        },
    ],
    "Past Simple": [
        {
            question: "They ___ to Da Nang last summer.",
            options: ["travel", "travels", "traveled", "have traveled"],
            correctAnswer: 2,
            explanation: "'Last summer' là mốc thời gian đã kết thúc trong quá khứ, dùng thì quá khứ đơn: 'traveled'.",
        },
        {
            question: "He ___ his homework before dinner yesterday.",
            options: ["finish", "finishes", "finished", "was finishing"],
            correctAnswer: 2,
            explanation: "Hành động đã xảy ra và kết thúc ở quá khứ ('yesterday') dùng quá khứ đơn: 'finished'.",
        },
    ],
    "Past Continuous": [
        {
            question: "I ___ TV when my mother called me.",
            options: ["watch", "watched", "was watching", "have watched"],
            correctAnswer: 2,
            explanation: "Hành động đang diễn ra thì bị hành động khác (quá khứ đơn) xen vào dùng quá khứ tiếp diễn: 'was watching'.",
        },
        {
            question: "While she ___ dinner, the phone rang.",
            options: ["cooks", "cooked", "was cooking", "is cooking"],
            correctAnswer: 2,
            explanation: "'While' + hành động đang diễn ra trong quá khứ dùng quá khứ tiếp diễn: 'was cooking'.",
        },
    ],
    "Present Perfect": [
        {
            question: "He has lived here ___ 2020.",
            options: ["for", "since", "during", "from"],
            correctAnswer: 1,
            explanation: "'Since' đi với mốc thời gian bắt đầu (2020) trong thì hiện tại hoàn thành; 'for' đi với khoảng thời gian.",
        },
        {
            question: "I ___ never ___ sushi before.",
            options: ["have / eaten", "has / eaten", "did / eat", "am / eating"],
            correctAnswer: 0,
            explanation: "Trải nghiệm chưa từng xảy ra tính đến hiện tại dùng hiện tại hoàn thành: 'have never eaten'.",
        },
    ],
    "Present Perfect Continuous": [
        {
            question: "She ___ English for three years.",
            options: ["studies", "studied", "has been studying", "is studying"],
            correctAnswer: 2,
            explanation: "Hành động bắt đầu trong quá khứ và vẫn tiếp diễn, nhấn mạnh khoảng thời gian, dùng hiện tại hoàn thành tiếp diễn: 'has been studying'.",
        },
        {
            question: "They ___ since 8 AM this morning.",
            options: ["work", "worked", "have been working", "has worked"],
            correctAnswer: 2,
            explanation: "'Since 8 AM' + nhấn mạnh hành động liên tục đến hiện tại dùng 'have been working'.",
        },
    ],
    "Past Perfect": [
        {
            question: "By the time we arrived, the movie ___ already ___.",
            options: ["has / started", "had / started", "did / start", "was / starting"],
            correctAnswer: 1,
            explanation: "Hành động xảy ra trước một hành động khác trong quá khứ ('by the time we arrived') dùng quá khứ hoàn thành: 'had started'.",
        },
        {
            question: "She ___ finished her work before he came.",
            options: ["has", "had", "have", "was"],
            correctAnswer: 1,
            explanation: "Hành động hoàn tất trước một mốc quá khứ khác ('before he came') dùng 'had + V3'.",
        },
    ],
    "Past Perfect Continuous": [
        {
            question: "He was tired because he ___ all day.",
            options: ["worked", "had worked", "had been working", "works"],
            correctAnswer: 2,
            explanation: "Nhấn mạnh quá trình kéo dài trước một thời điểm/kết quả trong quá khứ dùng quá khứ hoàn thành tiếp diễn: 'had been working'.",
        },
        {
            question: "They ___ for two hours before the rain stopped.",
            options: ["walked", "had walked", "had been walking", "were walking"],
            correctAnswer: 2,
            explanation: "Khoảng thời gian kéo dài liên tục trước một mốc quá khứ khác dùng 'had been + V-ing'.",
        },
    ],
    "Future Simple": [
        {
            question: "I think it ___ rain tomorrow.",
            options: ["will", "is", "was", "would"],
            correctAnswer: 0,
            explanation: "Dự đoán về tương lai (không có kế hoạch/căn cứ cụ thể) dùng 'will + V': 'will rain'.",
        },
        {
            question: "She ___ help you with your homework later.",
            options: ["will", "is", "does", "did"],
            correctAnswer: 0,
            explanation: "Quyết định nhất thời tại thời điểm nói dùng 'will': 'will help'.",
        },
    ],
    "Be Going To": [
        {
            question: "Look at those clouds! It ___ to rain.",
            options: ["will", "is going", "was going", "goes"],
            correctAnswer: 1,
            explanation: "Dự đoán có căn cứ rõ ràng (nhìn thấy mây đen) dùng 'be going to': 'is going to rain'.",
        },
        {
            question: "We ___ to visit our grandparents this weekend.",
            options: ["are going", "will", "go", "went"],
            correctAnswer: 0,
            explanation: "Kế hoạch đã được sắp xếp trước dùng 'be going to': 'are going to visit'.",
        },
    ],
    "Future Continuous": [
        {
            question: "This time tomorrow, I ___ on a plane to Hanoi.",
            options: ["will be", "am", "was", "will"],
            correctAnswer: 0,
            explanation: "Hành động đang diễn ra tại một thời điểm cụ thể trong tương lai dùng tương lai tiếp diễn: 'will be flying/being'.",
        },
        {
            question: "At 8 PM tonight, we ___ dinner.",
            options: ["will have", "will be having", "have", "had"],
            correctAnswer: 1,
            explanation: "Hành động đang xảy ra tại một mốc giờ cụ thể trong tương lai dùng 'will be + V-ing': 'will be having'.",
        },
    ],
    "Future Perfect": [
        {
            question: "By next year, I ___ my degree.",
            options: ["will finish", "will have finished", "finish", "finished"],
            correctAnswer: 1,
            explanation: "Hành động sẽ hoàn tất trước một mốc thời gian trong tương lai ('by next year') dùng tương lai hoàn thành: 'will have finished'.",
        },
        {
            question: "By the time she arrives, we ___ the report.",
            options: ["will have completed", "will complete", "complete", "completed"],
            correctAnswer: 0,
            explanation: "'By the time' + mốc tương lai đòi hỏi hành động hoàn tất trước đó, dùng 'will have + V3'.",
        },
    ],
};

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

        // 3. Deliberately NOT a "differs from reference = wrong" check. This
        // fallback has no way to verify true semantic equivalence, so when
        // neither concrete rule above fired, it must not penalize a legitimate
        // paraphrase just for using different words than the one sample answer
        // — the reference answer is an example, not the only correct wording.
        // (Previously this block flagged any reference word missing from the
        // user's answer as a VOCABULARY error with a 25-point penalty, which
        // scored valid paraphrases like "Every day, she attends school." as
        // partially_correct against "She goes to school every day." — that is
        // exactly the "reference answer = only correct answer" anti-pattern.)

        const score = Math.max(20, Math.min(90, 100 - detectedPenalty));
        const status = score >= 90 ? "correct" : score >= 60 ? "partially_correct" : "incorrect";
        const isCorrect = status === "correct";
        const grammarScore = Math.max(30, score - 5);
        const vocabScore = score;
        const meaningScore = Math.max(50, score + 5);
        const structureScore = score;
        const naturalnessScore = Math.max(40, score - 10);
        const noConcreteIssue = errors.length === 0;

        return {
            isCorrect,
            status,
            score,
            summary: noConcreteIssue
                ? "Không phát hiện lỗi ngữ pháp cụ thể qua bộ quy tắc dự phòng; câu trả lời diễn đạt khác câu mẫu nhưng điều đó không tự nó là lỗi."
                : "Câu trả lời còn một số điểm khác biệt so với cách diễn đạt chuẩn, được đánh giá bằng bộ quy tắc dự phòng (không phải AI) vì dịch vụ AI hiện không khả dụng.",
            meaningAnalysis: { score: meaningScore, correct: meaningScore >= 70, feedback: "Ý nghĩa cơ bản đã được truyền tải nhưng chưa được AI phân tích sâu do đang dùng chế độ dự phòng." },
            grammarAnalysis: { score: grammarScore, feedback: "Phát hiện bằng quy tắc cố định, có thể chưa đầy đủ so với phân tích AI thực sự." },
            vocabularyAnalysis: {
                score: vocabScore,
                feedback: noConcreteIssue
                    ? "Từ vựng khác với câu mẫu nhưng không bị xem là lỗi (câu mẫu không phải đáp án duy nhất)."
                    : "Từ vựng được so sánh sơ bộ với đáp án mẫu.",
            },
            structureAnalysis: { score: structureScore, feedback: "Cấu trúc câu chưa được phân tích chi tiết ở chế độ dự phòng." },
            naturalnessAnalysis: { score: naturalnessScore, feedback: "Độ tự nhiên chưa được đánh giá đầy đủ ở chế độ dự phòng." },
            correctAnswer: refTrim,
            alternativeAnswers: altAnswers,
            errors,
            strengths: noConcreteIssue
                ? ["Không phát hiện lỗi ngữ pháp cụ thể", "Diễn đạt được ý câu gốc theo cách riêng"]
                : ["Ý nghĩa cơ bản đã được truyền tải", "Cố gắng sử dụng từ vựng đúng ngữ cảnh"],
            weaknesses: noConcreteIssue ? [] : ["Chưa thể phân tích chi tiết do dịch vụ AI đang tạm thời không khả dụng"],
            overallFeedback: noConcreteIssue
                ? "Câu trả lời của bạn không khớp với câu mẫu nhưng không phát hiện lỗi ngữ pháp cụ thể - đây có thể là một cách diễn đạt đúng khác. (Đánh giá tạm thời bằng bộ quy tắc dự phòng, không phải AI, vì dịch vụ AI hiện không khả dụng.)"
                : score >= 80
                    ? "Bạn đã làm khá tốt, chỉ cần chỉnh sửa một số lỗi ngữ pháp hoặc dùng từ chưa chuẩn. (Đánh giá tạm thời bằng bộ quy tắc dự phòng, không phải AI.)"
                    : "Câu trả lời có một số điểm ngữ pháp cần lưu ý để tự nhiên và chính xác hơn. (Đánh giá tạm thời bằng bộ quy tắc dự phòng, không phải AI.)",
            recommendations: noConcreteIssue
                ? ["Thử nộp lại sau ít phút để nhận đánh giá chi tiết hơn từ AI khi dịch vụ khả dụng trở lại."]
                : [
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

    async evaluateParagraph(input: IParagraphEvaluationInput): Promise<IParagraphEvaluationResult> {
        const text = input.userAnswer.trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const meetsLength = wordCount >= input.minWords && wordCount <= input.maxWords;
        const score = meetsLength ? 65 : 40;

        const errors: IErrorDetail[] = [];
        if (!meetsLength) {
            errors.push({
                type: "SENTENCE_STRUCTURE",
                category: "WORD_COUNT",
                severity: "minor",
                wrongText: text.slice(0, 40),
                correctText: `${input.minWords}-${input.maxWords} từ`,
                explanation: `Đoạn văn hiện có khoảng ${wordCount} từ, chưa nằm trong khoảng yêu cầu ${input.minWords}-${input.maxWords} từ. Hãy bổ sung hoặc rút gọn ý để đạt độ dài phù hợp.`,
            });
        }

        return {
            overallScore: score,
            wordCount,
            meetsRequirements: meetsLength,
            content: { score, feedback: "Nội dung chưa được AI phân tích sâu do đang dùng chế độ dự phòng." },
            organization: { score, feedback: "Cấu trúc đoạn văn chưa được phân tích chi tiết ở chế độ dự phòng." },
            coherence: { score, feedback: "Tính liên kết chưa được đánh giá đầy đủ ở chế độ dự phòng." },
            grammar: { score, feedback: "Ngữ pháp chưa được kiểm tra chi tiết do dịch vụ AI hiện không khả dụng." },
            vocabulary: { score, feedback: "Từ vựng chưa được đánh giá chi tiết ở chế độ dự phòng." },
            sentenceStructure: { score, feedback: "Cấu trúc câu chưa được phân tích chi tiết ở chế độ dự phòng." },
            naturalness: { score, feedback: "Độ tự nhiên chưa được đánh giá đầy đủ ở chế độ dự phòng." },
            errors,
            strengths: ["Đã hoàn thành và nộp bài viết đoạn văn"],
            weaknesses: ["Chưa thể phân tích chi tiết do dịch vụ AI đang tạm thời không khả dụng"],
            correctedSuggestion: text,
            overallFeedback: "Đây là đánh giá tạm thời bằng bộ quy tắc dự phòng (không phải AI) vì dịch vụ AI hiện không khả dụng. Vui lòng thử nộp lại sau ít phút để nhận đánh giá đầy đủ từ AI.",
            recommendations: [
                "Thử nộp lại bài sau ít phút để nhận đánh giá chi tiết từ AI.",
                "Đọc kỹ yêu cầu đề bài và đảm bảo đủ số từ quy định.",
            ],
        };
    }

    async generateParagraphPrompt(params: IGenerateParagraphPromptInput): Promise<IGeneratedParagraphPrompt> {
        const wordRange = `${params.minWords}-${params.maxWords} từ`;
        // Vietnamese-only, matching the AI path's language contract even in fallback mode.
        const templateByDifficulty: Record<IGenerateParagraphPromptInput["difficulty"], string> = {
            easy: `Hãy viết một đoạn văn ngắn từ ${wordRange} bằng tiếng Anh mô tả về chủ đề "${params.topic}".`,
            medium: `Hãy viết một đoạn văn từ ${wordRange} bằng tiếng Anh về chủ đề "${params.topic}". Hãy giải thích rõ hơn và nêu ít nhất một ví dụ cụ thể.`,
            hard: `Hãy viết một đoạn văn từ ${wordRange} bằng tiếng Anh trình bày quan điểm của bạn về chủ đề "${params.topic}", nêu rõ lý do và ví dụ minh họa.`,
        };

        return {
            promptVi: `${templateByDifficulty[params.difficulty]} (Đề tạm thời bằng bộ quy tắc dự phòng, không phải AI, vì dịch vụ AI hiện không khả dụng.)`,
            requirements: [],
        };
    }

    private buildTenseQuestion(tense: string, template: IHeuristicQuizTemplate, params: IGenerateQuizInput): IGeneratedQuizQuestion {
        return {
            question: template.question,
            options: template.options,
            correctAnswer: template.correctAnswer,
            explanation: `${template.explanation} (Câu hỏi tạm thời bằng bộ quy tắc dự phòng, không phải AI, vì dịch vụ AI hiện không khả dụng.)`,
            tense,
            difficulty: params.difficulty,
            topic: params.topic,
        };
    }

    async generateQuizQuestions(params: IGenerateQuizInput): Promise<IGeneratedQuizQuestion[]> {
        const tenses = params.grammarTopics.length > 0 ? params.grammarTopics : ["Present Simple"];

        if (params.perTenseTargets) {
            // Respect the exact per-tense breakdown so distribution stays
            // correct even in fallback mode — cycle each tense's own small
            // template pool to fill its target count.
            const results: IGeneratedQuizQuestion[] = [];
            for (const [tense, count] of Object.entries(params.perTenseTargets)) {
                const templates = HEURISTIC_QUIZ_TEMPLATES[tense] || HEURISTIC_QUIZ_TEMPLATES["Present Simple"];
                for (let i = 0; i < count; i++) {
                    results.push(this.buildTenseQuestion(tense, templates[i % templates.length], params));
                }
            }
            return results;
        }

        const pool: IGeneratedQuizQuestion[] = [];
        for (const tense of tenses) {
            const templates = HEURISTIC_QUIZ_TEMPLATES[tense] || HEURISTIC_QUIZ_TEMPLATES["Present Simple"];
            for (const t of templates) {
                pool.push(this.buildTenseQuestion(tense, t, params));
            }
        }

        if (pool.length === 0) {
            pool.push(
                ...HEURISTIC_QUIZ_TEMPLATES["Present Simple"].map((t) => this.buildTenseQuestion("Present Simple", t, params))
            );
        }

        return Array.from({ length: params.questionCount }, (_, index) => pool[index % pool.length]);
    }
}
