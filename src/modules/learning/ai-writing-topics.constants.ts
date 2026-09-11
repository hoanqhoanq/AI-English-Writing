// Fixed topic choices shown in the AI Writing tab's topic picker. Single
// source of truth — both the frontend picker and the backend validation of
// `topicKey` read from this same list.
export interface IAIWritingTopicOption {
    key: string;
    label: string;
    labelVi: string;
}

export const AI_WRITING_TOPICS: IAIWritingTopicOption[] = [
    { key: "daily-routine", label: "Daily Routine", labelVi: "Sinh hoạt hàng ngày" },
    { key: "hobbies", label: "Hobbies", labelVi: "Sở thích" },
    { key: "school-study", label: "School & Study", labelVi: "Học tập" },
    { key: "family", label: "Family", labelVi: "Gia đình" },
    { key: "work", label: "Work", labelVi: "Công việc" },
    { key: "free-time", label: "Free Time", labelVi: "Thời gian rảnh" },
    { key: "travel", label: "Travel", labelVi: "Du lịch" },
];

export const findAIWritingTopic = (key: string): IAIWritingTopicOption | undefined =>
    AI_WRITING_TOPICS.find((t) => t.key === key);
