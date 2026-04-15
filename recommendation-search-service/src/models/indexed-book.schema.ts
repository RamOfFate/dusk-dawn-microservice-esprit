import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IndexedBookDocument = HydratedDocument<IndexedBook>;

@Schema({ timestamps: true })
export class IndexedBook {
  @Prop({ required: true, index: true, unique: true })
  bookId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  author?: string;

  @Prop()
  description?: string;

  @Prop()
  categoryName?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  price?: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const IndexedBookSchema = SchemaFactory.createForClass(IndexedBook);

// Full-text search across the main fields
IndexedBookSchema.index({
  title: 'text',
  author: 'text',
  description: 'text',
  categoryName: 'text',
});
