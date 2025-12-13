"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
require("reflect-metadata");
// Auth
__exportStar(require("./src/auth/login.dto"), exports);
__exportStar(require("./src/auth/register.dto"), exports);
// Marketplace
__exportStar(require("./src/marketplace/create-curriculum.dto"), exports);
__exportStar(require("./src/marketplace/update-curriculum.dto"), exports);
__exportStar(require("./src/marketplace/create-subject.dto"), exports);
__exportStar(require("./src/marketplace/update-subject.dto"), exports);
__exportStar(require("./src/marketplace/search.dto"), exports);
// Wallet
__exportStar(require("./src/wallet/wallet.dto"), exports);
// Booking
__exportStar(require("./src/booking/booking.dto"), exports);
// Teacher
__exportStar(require("./src/teacher/update-profile.dto"), exports);
__exportStar(require("./src/teacher/teacher-subject.dto"), exports);
__exportStar(require("./src/teacher/availability.dto"), exports);
// Global enums
var UserRole;
(function (UserRole) {
    UserRole["PARENT"] = "PARENT";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPPORT"] = "SUPPORT";
})(UserRole || (exports.UserRole = UserRole = {}));
