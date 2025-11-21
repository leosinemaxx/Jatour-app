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
exports.PlannerController = void 0;
const common_1 = require("@nestjs/common");
const planner_service_1 = require("./planner.service");
let PlannerController = class PlannerController {
    constructor(plannerService) {
        this.plannerService = plannerService;
    }
    getRecommendations(userId, budget, days, interests, city) {
        return this.plannerService.getRecommendations(userId, {
            budget: budget ? parseFloat(budget) : undefined,
            days: days ? parseInt(days) : undefined,
            interests: interests ? interests.split(',') : undefined,
            city,
        });
    }
    calculateRoute(destinationIds, startLat, startLng) {
        const ids = destinationIds.split(',');
        const startLocation = startLat && startLng
            ? { lat: parseFloat(startLat), lng: parseFloat(startLng) }
            : undefined;
        return this.plannerService.calculateOptimalRoute(ids, startLocation);
    }
};
exports.PlannerController = PlannerController;
__decorate([
    (0, common_1.Get)('recommendations/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('budget')),
    __param(2, (0, common_1.Query)('days')),
    __param(3, (0, common_1.Query)('interests')),
    __param(4, (0, common_1.Query)('city')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PlannerController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('route'),
    __param(0, (0, common_1.Query)('destinations')),
    __param(1, (0, common_1.Query)('startLat')),
    __param(2, (0, common_1.Query)('startLng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PlannerController.prototype, "calculateRoute", null);
exports.PlannerController = PlannerController = __decorate([
    (0, common_1.Controller)('planner'),
    __metadata("design:paramtypes", [planner_service_1.PlannerService])
], PlannerController);
//# sourceMappingURL=planner.controller.js.map