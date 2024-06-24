import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  // Inicializando Prisma
  async onModuleInit() {
    // Conexión a la B.D
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    // Especificar los datos a insertar
    return this.orders.create({
      data: createOrderDto
    });
  }

  findAll() {
    return `This action returns all orders`;
  }

  async findOne(id: string) {
    // Intentar traser el Order por su ID
    const order = await this.orders.findFirst({
      where: { id }
    });

    // Si no se lo pudo obtener...
    if (!order) {
      throw new RpcException({
        message: `Order with id: ${id} not found`,
        status: HttpStatus.NOT_FOUND
      });
    }

    return order;
  }
}
