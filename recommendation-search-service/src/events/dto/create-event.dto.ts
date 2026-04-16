import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

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
