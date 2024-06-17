import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
    /* Validando las propiedades */

    @IsNumber()
    @IsPositive()
    totalAmount: number;

    @IsNumber()
    @IsPositive()
    totalItems: number;

    @IsEnum(OrderStatusList, {
        message: `Possible status values are ${OrderStatusList}`
    })
    @IsOptional()
    status: OrderStatus = OrderStatus.PENDING;

    @IsBoolean()
    @IsOptional()
    paid: boolean = false;
}
