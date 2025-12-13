import { api } from '../api';
import { CreateCurriculumDto, CreateSubjectDto } from '@sidra/shared';

export const marketplaceApi = {
    getCurricula: async () => {
        const response = await api.get('/marketplace/curricula');
        return response.data;
    },
    getSubjects: async () => {
        const response = await api.get('/marketplace/subjects');
        return response.data;
    },
};
