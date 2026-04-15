import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsNumber()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsString()
  @IsIn(['VIEW', 'PURCHASE'])
  type!: 'VIEW' | 'PURCHASE';

  @IsString()
  @IsOptional()
  categoryName?: string;
}
