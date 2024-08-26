import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ChangeOrderStatusDto,
  CreateOrderDto,
  OrderPaginationDTO,
} from './dto';
import { PRODUCTS_SERVICE } from 'src/config';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  // Inyección de dependencias
  constructor(
    @Inject(PRODUCTS_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  // Inicializando Prisma
  async onModuleInit() {
    // Conexión a la B.D
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      // Paso 1
      // Extraer los ids del DTO y validarlos
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_products' }, productIds),
      );

      // Paso 2
      // Calcular el total de la Order
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        // Obteniendo los precios de los productos (no de los que se le pasan en la orden)
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return price * orderItem.quantity;
      }, 0);

      // Paso 3
      // Calcular la cantidad total de productos
      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      // Paso 3
      // Crear la transacción en la B.D
      const order = await this.orders.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDTO) {
    // Desestructurando el DTO
    const { page, limit, status } = orderPaginationDto;

    // Obtener la cantidad total de Orders
    const totalOrders = await this.orders.count({
      // Filtrando por el Status
      where: {
        status,
      },
    });

    // Obtener la última página
    const lastPage = Math.ceil(totalOrders / limit);

    return {
      data: await this.orders.findMany({
        // Filtros de paginación
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status,
        },
      }),
      meta: {
        total: totalOrders,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: string) {
    // Intentar traser el Order por su ID
    const order = await this.orders.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    // Si no se lo pudo obtener...
    if (!order) {
      throw new RpcException({
        message: `Order with id: ${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    // Obtener los IDs de los productos y validarlos
    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);
    const products: any[] = await firstValueFrom(
      this.productsClient.send({ cmd: 'validate_products' }, productIds),
    );

    // Retornar la orden con los detalles de los productos
    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name,
      })),
    };
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
      data: { status: status },
    });
  }
}
