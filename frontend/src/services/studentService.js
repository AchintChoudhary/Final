import api from './api';

export const studentService = {
  getStudents: async () => {
    const res = await api.get('/students');
    return res.data;
  },

  addStudent: async (data) => {
    const res = await api.post('/students', data);
    return res.data;
  },

  updateStudentStatus: async (id, status) => {
    const res = await api.patch(`/students/${id}/status`, { status });
    return res.data;
  },

  importCsv: async (students) => {
    const res = await api.post('/students/import', { students });
    return res.data;
  },
};
