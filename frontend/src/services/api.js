import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Exams API
export const examsAPI = {
  getAllExams: (path) => api.get('/exams', { params: { path } }),
  getExamById: (examId) => api.get(`/exams/${examId}`),
  startExam: (examId) => api.get(`/exams/${examId}/start`),
  getExamQuestions: (examId, attemptId) => 
    api.get(`/exams/${examId}/questions`, { params: { attempt_id: attemptId } }),
};

// Attempts API
export const attemptsAPI = {
  saveAnswer: (attemptId, data) => api.post(`/attempts/${attemptId}/answers`, data),
  getProgress: (attemptId) => api.get(`/attempts/${attemptId}/progress`),
  submitExam: (attemptId) => api.post(`/attempts/${attemptId}/submit`),
  getAttemptDetails: (attemptId) => api.get(`/attempts/${attemptId}`),
  getUserAttempts: () => api.get('/users/me/attempts'),
};

// Users API
export const usersAPI = {
  getUserAttempts: () => api.get('/users/me/attempts'),
  getUserStats: () => api.get('/users/me/stats'),
};

// Admin API
export const adminAPI = {
  // Exams
  getAllExamsAdmin: () => api.get('/admin/exams'),
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (examId, data) => api.put(`/admin/exams/${examId}`, data),
  deleteExam: (examId) => api.delete(`/admin/exams/${examId}`),
  
  // Questions
  getAllQuestions: (examId) => api.get('/admin/questions', { params: { exam_id: examId } }),
  getQuestion: (questionId) => api.get(`/admin/questions/${questionId}`),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestion: (questionId, data) => api.put(`/admin/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/admin/questions/${questionId}`),
  bulkImportQuestions: (formData) => api.post('/admin/questions/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  bulkImportQuestionsEnhanced: (formData) => api.post('/admin/questions/bulk-enhanced', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadTemplate: () => api.get('/admin/questions/template', {
    responseType: 'blob',
  }),
  downloadEnhancedTemplate: () => api.get('/admin/questions/template/enhanced', {
    responseType: 'blob',
  }),
  checkTemplateStatus: () => api.get('/admin/questions/template/status'),
  
  // Case Studies
  getAllCaseStudies: (examId) => api.get('/admin/case-studies', { params: { exam_id: examId } }),
  createCaseStudy: (data) => api.post('/admin/case-studies', data),
  updateCaseStudy: (id, data) => api.put(`/admin/case-studies/${id}`, data),
  deleteCaseStudy: (id) => api.delete(`/admin/case-studies/${id}`),
  
  // Users
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  
  // Statistics
  getAdminStats: () => api.get('/admin/stats'),
};

export default api;