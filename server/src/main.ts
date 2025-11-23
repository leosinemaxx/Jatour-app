import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, HttpException, HttpStatus, ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { AppModule } from './app.module';

@Catch()
class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    
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
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // Allow extra fields but ignore them
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        console.error('Validation errors:', messages);
        return new BadRequestException({
          message: messages.join('; '),
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );

  // Global exception filter for better error handling
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 3001;
  console.log(`Attempting to start NestJS server on port ${port}`);
  await app.listen(port);
  console.log(`🚀 Server is running on: http://localhost:${port}`);
}

bootstrap();

