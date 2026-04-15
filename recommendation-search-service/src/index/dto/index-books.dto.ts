import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IndexBookItemDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryName?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class IndexBooksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IndexBookItemDto)
  books!: IndexBookItemDto[];
}
