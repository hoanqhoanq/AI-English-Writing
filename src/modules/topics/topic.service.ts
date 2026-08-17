import mongoose from "mongoose";
import { TopicModel } from "./topic.model";
import { GrammarTopicModel } from "./grammar.model";
import { memoryStore } from "../../db/memoryStore";

export class TopicService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    async getAllTopics(activeOnly: boolean = true) {
        if (this.isMongoActive()) {
            const filter = activeOnly ? { isActive: true } : {};
            return TopicModel.find(filter).sort({ order: 1 });
        } else {
            return memoryStore.topics
                .filter((t) => (activeOnly ? t.isActive : true))
                .sort((a, b) => a.order - b.order);
        }
    }

    async getAllGrammarTopics(activeOnly: boolean = true) {
        if (this.isMongoActive()) {
            const filter = activeOnly ? { isActive: true } : {};
            return GrammarTopicModel.find(filter).sort({ order: 1 });
        } else {
            return memoryStore.grammars
                .filter((g) => (activeOnly ? g.isActive : true))
                .sort((a, b) => a.order - b.order);
        }
    }

    async createTopic(data: any) {
        if (this.isMongoActive()) {
            return TopicModel.create(data);
        } else {
            const newTopic = {
                _id: "top_" + Date.now(),
                name: data.name,
                description: data.description || "",
                icon: data.icon || "BookOpen",
                isActive: data.isActive !== undefined ? data.isActive : true,
                order: data.order || memoryStore.topics.length + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.topics.push(newTopic);
            return newTopic;
        }
    }

    async updateTopic(id: string, data: any) {
        if (this.isMongoActive()) {
            return TopicModel.findByIdAndUpdate(id, data, { new: true });
        } else {
            const idx = memoryStore.topics.findIndex((t) => t._id === id);
            if (idx === -1) throw new Error("Không tìm thấy chủ đề");
            memoryStore.topics[idx] = { ...memoryStore.topics[idx], ...data, updatedAt: new Date() };
            return memoryStore.topics[idx];
        }
    }

    async deleteTopic(id: string) {
        if (this.isMongoActive()) {
            return TopicModel.findByIdAndDelete(id);
        } else {
            const idx = memoryStore.topics.findIndex((t) => t._id === id);
            if (idx === -1) throw new Error("Không tìm thấy chủ đề");
            const deleted = memoryStore.topics.splice(idx, 1)[0];
            return deleted;
        }
    }

    async createGrammar(data: any) {
        if (this.isMongoActive()) {
            return GrammarTopicModel.create(data);
        } else {
            const newGrm = {
                _id: "grm_" + Date.now(),
                name: data.name,
                description: data.description || "",
                level: data.level || "All",
                isActive: data.isActive !== undefined ? data.isActive : true,
                order: data.order || memoryStore.grammars.length + 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.grammars.push(newGrm);
            return newGrm;
        }
    }

    async updateGrammar(id: string, data: any) {
        if (this.isMongoActive()) {
            return GrammarTopicModel.findByIdAndUpdate(id, data, { new: true });
        } else {
            const idx = memoryStore.grammars.findIndex((g) => g._id === id);
            if (idx === -1) throw new Error("Không tìm thấy chủ điểm ngữ pháp");
            memoryStore.grammars[idx] = { ...memoryStore.grammars[idx], ...data, updatedAt: new Date() };
            return memoryStore.grammars[idx];
        }
    }

    async deleteGrammar(id: string) {
        if (this.isMongoActive()) {
            return GrammarTopicModel.findByIdAndDelete(id);
        } else {
            const idx = memoryStore.grammars.findIndex((g) => g._id === id);
            if (idx === -1) throw new Error("Không tìm thấy chủ điểm ngữ pháp");
            const deleted = memoryStore.grammars.splice(idx, 1)[0];
            return deleted;
        }
    }

    async getLevels() {
        const cefrDefs = [
            {
                code: "A1",
                name: "Beginner (Cơ bản)",
                cefr: "A1",
                description: "Diễn đạt các nhu cầu cụ thể, câu ngắn đơn giản thường ngày (thì hiện tại đơn, đại từ, số lượng).",
                targetVocab: "500 - 1,000 từ",
                grammarFocus: "Present Simple, Pronouns, Basic Articles, Prepositions of place",
                recommendedDaily: 5,
                color: "emerald",
            },
            {
                code: "A2",
                name: "Elementary (Sơ cấp)",
                cefr: "A2",
                description: "Mô tả người, nơi chốn, thói quen và sự kiện trong quá khứ một cách mạch lạc.",
                targetVocab: "1,000 - 2,000 từ",
                grammarFocus: "Past Simple, Future with going to/will, Modal verbs, Comparatives",
                recommendedDaily: 7,
                color: "teal",
            },
            {
                code: "B1",
                name: "Intermediate (Trung cấp)",
                cefr: "B1",
                description: "Viết đoạn văn liền mạch về chủ đề quen thuộc, giải thích lý do và kế hoạch.",
                targetVocab: "2,000 - 3,500 từ",
                grammarFocus: "Present Perfect, Conditionals Type 1 & 2, Relative Clauses, Passive Voice",
                recommendedDaily: 10,
                color: "indigo",
            },
            {
                code: "B2",
                name: "Upper Intermediate (Trung cao cấp)",
                cefr: "B2",
                description: "Trình bày lập luận chi tiết, câu phức và tổng hợp các quan điểm đa chiều.",
                targetVocab: "3,500 - 5,000 từ",
                grammarFocus: "Mixed Conditionals, Inversion, Advanced Passive, Cleft Sentences",
                recommendedDaily: 10,
                color: "blue",
            },
            {
                code: "C1",
                name: "Advanced (Cao cấp)",
                cefr: "C1",
                description: "Sử dụng ngôn ngữ linh hoạt, cấu trúc học thuật, văn phong tự nhiên và sắc sảo.",
                targetVocab: "5,000 - 8,000 từ",
                grammarFocus: "Subjunctive Mood, Participle Clauses, Nuanced Cohesion, Idiomatic phrases",
                recommendedDaily: 12,
                color: "purple",
            },
            {
                code: "C2",
                name: "Proficiency (Thành thạo)",
                cefr: "C2",
                description: "Khả năng diễn đạt tinh tế, sắc thái nghĩa chuyên sâu, chuẩn người bản xứ.",
                targetVocab: "8,000+ từ",
                grammarFocus: "Mastery of all registers, subtle stylistic nuances, stylistic inversion",
                recommendedDaily: 15,
                color: "rose",
            },
        ];

        return cefrDefs.map((def) => {
            const questionCount = memoryStore.questions.filter((q) => q.level === def.code).length;
            const usersCount = memoryStore.users.filter((u) => u.level === def.code).length;
            return {
                ...def,
                questionCount,
                usersCount,
            };
        });
    }
}

export const topicService = new TopicService();

