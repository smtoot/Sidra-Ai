"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MarketplaceService = class MarketplaceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCurriculum(dto) {
        return this.prisma.curriculum.create({
            data: {
                nameAr: dto.nameAr,
                nameEn: dto.nameEn,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async findAllCurricula(includeInactive = false) {
        return this.prisma.curriculum.findMany({
            where: includeInactive ? {} : { isActive: true },
        });
    }
    async findOneCurriculum(id) {
        const curr = await this.prisma.curriculum.findUnique({ where: { id } });
        if (!curr)
            throw new common_1.NotFoundException(`Curriculum with ID ${id} not found`);
        return curr;
    }
    async updateCurriculum(id, dto) {
        await this.findOneCurriculum(id);
        return this.prisma.curriculum.update({
            where: { id },
            data: dto,
        });
    }
    async softDeleteCurriculum(id) {
        await this.findOneCurriculum(id);
        return this.prisma.curriculum.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async createSubject(dto) {
        return this.prisma.subject.create({
            data: {
                nameAr: dto.nameAr,
                nameEn: dto.nameEn,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async findAllSubjects(includeInactive = false) {
        return this.prisma.subject.findMany({
            where: includeInactive ? {} : { isActive: true },
        });
    }
    async findOneSubject(id) {
        const sub = await this.prisma.subject.findUnique({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException(`Subject with ID ${id} not found`);
        return sub;
    }
    async updateSubject(id, dto) {
        await this.findOneSubject(id);
        return this.prisma.subject.update({
            where: { id },
            data: dto,
        });
    }
    async softDeleteSubject(id) {
        await this.findOneSubject(id);
        return this.prisma.subject.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map