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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const marketplace_service_1 = require("./marketplace.service");
const shared_1 = require("@sidra/shared");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let MarketplaceController = class MarketplaceController {
    marketplaceService;
    constructor(marketplaceService) {
        this.marketplaceService = marketplaceService;
    }
    searchTeachers(query) {
        return this.marketplaceService.searchTeachers(query);
    }
    createCurriculum(dto) {
        return this.marketplaceService.createCurriculum(dto);
    }
    findAllCurricula(all) {
        const includeInactive = all === 'true';
        return this.marketplaceService.findAllCurricula(includeInactive);
    }
    findOneCurriculum(id) {
        return this.marketplaceService.findOneCurriculum(id);
    }
    updateCurriculum(id, dto) {
        return this.marketplaceService.updateCurriculum(id, dto);
    }
    removeCurriculum(id) {
        return this.marketplaceService.softDeleteCurriculum(id);
    }
    createSubject(dto) {
        return this.marketplaceService.createSubject(dto);
    }
    findAllSubjects(all) {
        const includeInactive = all === 'true';
        return this.marketplaceService.findAllSubjects(includeInactive);
    }
    findOneSubject(id) {
        return this.marketplaceService.findOneSubject(id);
    }
    updateSubject(id, dto) {
        return this.marketplaceService.updateSubject(id, dto);
    }
    removeSubject(id) {
        return this.marketplaceService.softDeleteSubject(id);
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, common_1.Get)('teachers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.SearchTeachersDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "searchTeachers", null);
__decorate([
    (0, common_1.Post)('curricula'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.CreateCurriculumDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "createCurriculum", null);
__decorate([
    (0, common_1.Get)('curricula'),
    __param(0, (0, common_1.Query)('all')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "findAllCurricula", null);
__decorate([
    (0, common_1.Get)('curricula/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "findOneCurriculum", null);
__decorate([
    (0, common_1.Patch)('curricula/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shared_1.UpdateCurriculumDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "updateCurriculum", null);
__decorate([
    (0, common_1.Delete)('curricula/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "removeCurriculum", null);
__decorate([
    (0, common_1.Post)('subjects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.CreateSubjectDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __param(0, (0, common_1.Query)('all')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "findAllSubjects", null);
__decorate([
    (0, common_1.Get)('subjects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "findOneSubject", null);
__decorate([
    (0, common_1.Patch)('subjects/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shared_1.UpdateSubjectDto]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "updateSubject", null);
__decorate([
    (0, common_1.Delete)('subjects/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketplaceController.prototype, "removeSubject", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, common_1.Controller)('marketplace'),
    __metadata("design:paramtypes", [marketplace_service_1.MarketplaceService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map