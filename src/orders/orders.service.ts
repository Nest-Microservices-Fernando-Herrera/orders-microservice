import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, CreateOrderDto, OrderPaginationDTO } from './dto';

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
    return {
      service: 'Orders Microservice',
      createOrderDto: createOrderDto
    };

    // Especificar los datos a insertar
    // return this.orders.create({
    //   data: createOrderDto
    // });
  }

  async findAll(orderPaginationDto: OrderPaginationDTO) {
    // Desestructurando el DTO
    const { page, limit, status } = orderPaginationDto;

    // Obtener la cantidad total de Orders
    const totalOrders = await this.orders.count({
      // Filtrando por el Status
      where: {
        status
      }
    });

    // Obtener la última página
    const lastPage = Math.ceil(totalOrders / limit);

    return {
      data: await this.orders.findMany({
        // Filtros de paginación
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status
        }
      }),
      meta: {
        total: totalOrders,
        page: page,
        lastPage: lastPage,
      }
    };
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

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    // Desestructurando el DTO
    const { id, status } = changeOrderStatusDto;

    // Intentar encontrar el Order por su ID
    const order = await this.findOne(id);
    
    // Evitar actualizar el status de la Order si ya lo tiene
    if (order.status === status) {
      return order;
    }

    // Proceder a actualizar y devolver la Order con su state
    return this.orders.update({
      where: { id },
      data: { status: status }
    });
  }
}
