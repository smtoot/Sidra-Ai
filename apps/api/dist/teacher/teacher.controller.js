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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const teacher_service_1 = require("./teacher.service");
const shared_1 = require("@sidra/shared");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let TeacherController = class TeacherController {
    teacherService;
    constructor(teacherService) {
        this.teacherService = teacherService;
    }
    getProfile(req) {
        return this.teacherService.getProfile(req.user.userId);
    }
    updateProfile(req, dto) {
        return this.teacherService.updateProfile(req.user.userId, dto);
    }
    addSubject(req, dto) {
        return this.teacherService.addSubject(req.user.userId, dto);
    }
    removeSubject(req, id) {
        return this.teacherService.removeSubject(req.user.userId, id);
    }
    setAvailability(req, dto) {
        return this.teacherService.setAvailability(req.user.userId, dto);
    }
    removeAvailability(req, id) {
        return this.teacherService.removeAvailability(req.user.userId, id);
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shared_1.UpdateTeacherProfileDto]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('me/subjects'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shared_1.CreateTeacherSubjectDto]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "addSubject", null);
__decorate([
    (0, common_1.Delete)('me/subjects/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "removeSubject", null);
__decorate([
    (0, common_1.Post)('me/availability'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, shared_1.CreateAvailabilityDto]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Delete)('me/availability/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherController.prototype, "removeAvailability", null);
exports.TeacherController = TeacherController = __decorate([
    (0, common_1.Controller)('teacher'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.TEACHER),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map