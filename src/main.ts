import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('OrdersMS-Main');
  console.log(envs.natsServers);

  // Creando la instancia de la app e implementar el microservicio
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    // Módulo principal de entrada
    AppModule,
    {
      /* Opciones de configuración */
      transport: Transport.NATS, // Medio de transporte,
      options: {
        servers: envs.natsServers,
      },
    },
  );

  // Configuración global de los Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      // Habilitandod los DTOs
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
  logger.log(`OrdersMicroservice running on port ${envs.port}`);
}
bootstrap();
