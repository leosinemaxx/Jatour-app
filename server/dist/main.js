"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception?.message || 'Internal server error';
        console.error('Global exception caught:', {
            status,
            message,
            path: request.url,
            method: request.method,
            error: exception?.stack || exception,
        });
        response.status(status).json({
            statusCode: status,
            message: message,
            error: exception?.error || 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
};
GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: {
            enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
            const messages = errors.map(error => Object.values(error.constraints || {}).join(', '));
            console.error('Validation errors:', messages);
            return new common_1.BadRequestException({
                message: messages.join('; '),
                error: 'Bad Request',
                statusCode: 400,
            });
        },
    }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Server is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map