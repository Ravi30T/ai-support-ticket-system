import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import cors from '@fastify/cors';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Register global cors
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure Swagger API Documentation
  const port = process.env.PORT ?? 3000;
  const configBuilder = new DocumentBuilder()
    .setTitle('Smart Support Ticketing System API')
    .setDescription(
      'API documentation for the AI-powered Smart Support Ticket System backend',
    )
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Local server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    );

  const deployedUrl = process.env.DEPLOYED_URL ?? process.env.BASE_URL;
  if (deployedUrl) {
    configBuilder.addServer(deployedUrl, 'Deployed server');
  }

  const config = configBuilder.build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);

  console.log(`Server started on port : ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api`,
  );
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});
