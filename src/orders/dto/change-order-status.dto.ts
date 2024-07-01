import { IsEnum, IsUUID } from "class-validator";
import { OrderStatus } from "@prisma/client";
import { OrderStatusList } from "../enum/order.enum";

export class ChangeOrderStatusDto {
    /* Propiedades */

    @IsUUID()
    id: string;

    @IsEnum(OrderStatusList, {
        message: `Valid status are ${OrderStatusList}`
    })
    status: OrderStatus;
}