import api from './api';

export const workflowsApi = {
  getWorkflows: async () => {
    const response = await api.get('/workflows');
    return response;
  },

  createWorkflow: async (payload) => {
    const response = await api.post('/workflows', payload);
    return response;
  },

  getWorkflowById: async (id) => {
    const response = await api.get(`/workflows/${id}`);
    return response;
  },

  updateWorkflow: async (id, payload) => {
    const response = await api.put(`/workflows/${id}`, payload);
    return response;
  },

  publishWorkflow: async (id) => {
    const response = await api.post(`/workflows/${id}/publish`);
    return response;
  },

  pauseWorkflow: async (id) => {
    const response = await api.post(`/workflows/${id}/pause`);
    return response;
  },

  draftWorkflow: async (id) => {
    const response = await api.post(`/workflows/${id}/draft`);
    return response;
  },

  validateWorkflow: async (id) => {
    const response = await api.post(`/workflows/${id}/validate`);
    return response;
  },

  deleteWorkflow: async (id) => {
    const response = await api.delete(`/workflows/${id}`);
    return response;
  },
};