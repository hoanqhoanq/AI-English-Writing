import api from './api';
import {
  AdminUser,
  WritingQuestion,
  Topic,
  GrammarTopic,
  CefrLevelDef,
  SystemStats,
  AdminEvaluationRecord,
  ParagraphTopic,
  AdminParagraphAttemptRecord,
  AdminLearningTopic,
} from '../types';

export const adminService = {
  // System Statistics
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await api.get('/analytics/admin/stats');
    return res.data.data;
  },

  // User Management
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get('/users/all');
    return res.data.data;
  },

  toggleUserStatus: async (userId: string): Promise<AdminUser> => {
    const res = await api.put(`/users/${userId}/status`);
    return res.data.data;
  },

  updateUser: async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    const res = await api.put(`/users/${userId}`, data);
    return res.data.data;
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  }): Promise<AdminUser> => {
    const res = await api.post('/users', data);
    return res.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  // Writing Questions Management
  getAdminQuestions: async (params?: {
    level?: string;
    topic?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ questions: WritingQuestion[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/writing/admin/questions', { params });
    return res.data.data;
  },

  createQuestion: async (data: Partial<WritingQuestion>): Promise<WritingQuestion> => {
    const res = await api.post('/writing/admin/questions', data);
    return res.data.data;
  },

  updateQuestion: async (id: string, data: Partial<WritingQuestion>): Promise<WritingQuestion> => {
    const res = await api.put(`/writing/admin/questions/${id}`, data);
    return res.data.data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await api.delete(`/writing/admin/questions/${id}`);
  },

  // Topic/Grammar read-only lookups — used by Admin Question management filters.
  // Admin CRUD for these was removed with the "Chủ đề & Ngữ pháp" page; the
  // backend write routes stay in place (dormant), the data itself is still
  // used by User/AI features.
  getTopics: async (all: boolean = true): Promise<Topic[]> => {
    const res = await api.get('/topics/topics', { params: { all } });
    return res.data.data;
  },

  getGrammars: async (all: boolean = true): Promise<GrammarTopic[]> => {
    const res = await api.get('/topics/grammar', { params: { all } });
    return res.data.data;
  },

  // CEFR Levels Management
  getLevels: async (): Promise<CefrLevelDef[]> => {
    const res = await api.get('/topics/levels');
    return res.data.data;
  },

  // AI Evaluation Audit History
  getEvaluations: async (params?: {
    status?: string;
    level?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ attempts: AdminEvaluationRecord[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/writing/admin/evaluations', { params });
    return res.data.data;
  },

  // Paragraph Topics Management
  getAdminParagraphTopics: async (params?: {
    levelTier?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ topics: ParagraphTopic[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/paragraph/admin/topics', { params });
    return res.data.data;
  },

  createParagraphTopic: async (data: Partial<ParagraphTopic>): Promise<ParagraphTopic> => {
    const res = await api.post('/paragraph/admin/topics', data);
    return res.data.data;
  },

  updateParagraphTopic: async (id: string, data: Partial<ParagraphTopic>): Promise<ParagraphTopic> => {
    const res = await api.put(`/paragraph/admin/topics/${id}`, data);
    return res.data.data;
  },

  deleteParagraphTopic: async (id: string): Promise<void> => {
    await api.delete(`/paragraph/admin/topics/${id}`);
  },

  getAdminParagraphAttempts: async (params?: {
    topicId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ attempts: AdminParagraphAttemptRecord[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/paragraph/admin/attempts', { params });
    return res.data.data;
  },

  // Writing Learning Topics Management
  getAdminLearningTopics: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ topics: AdminLearningTopic[]; total: number; page: number; totalPages: number }> => {
    const res = await api.get('/learning/admin/topics', { params });
    return res.data.data;
  },

  createLearningTopic: async (data: Partial<AdminLearningTopic>): Promise<AdminLearningTopic> => {
    const res = await api.post('/learning/admin/topics', data);
    return res.data.data;
  },

  updateLearningTopic: async (id: string, data: Partial<AdminLearningTopic>): Promise<AdminLearningTopic> => {
    const res = await api.put(`/learning/admin/topics/${id}`, data);
    return res.data.data;
  },

  deleteLearningTopic: async (id: string): Promise<void> => {
    await api.delete(`/learning/admin/topics/${id}`);
  },
};

export default adminService;
