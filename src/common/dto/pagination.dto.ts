import { IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para la paginación
export class PaginationDto {
    /* Propiedades */

    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;
}