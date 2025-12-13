import { api } from '../api';
import {
    UpdateTeacherProfileDto,
    CreateTeacherSubjectDto,
    CreateAvailabilityDto
} from '@sidra/shared';

export const teacherApi = {
    getProfile: async () => {
        const response = await api.get('/teacher/me');
        return response.data;
    },
    updateProfile: async (data: UpdateTeacherProfileDto) => {
        const response = await api.patch('/teacher/me', data);
        return response.data;
    },
    addSubject: async (data: CreateTeacherSubjectDto) => {
        const response = await api.post('/teacher/me/subjects', data);
        return response.data;
    },
    removeSubject: async (id: string) => {
        const response = await api.delete(`/teacher/me/subjects/${id}`);
        return response.data;
    },
    addAvailability: async (data: CreateAvailabilityDto) => {
        const response = await api.post('/teacher/me/availability', data);
        return response.data;
    },
    removeAvailability: async (id: string) => {
        const response = await api.delete(`/teacher/me/availability/${id}`);
        return response.data;
    },
};
