import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserEventDocument = HydratedDocument<UserEvent>;

export type UserEventType = 'VIEW' | 'PURCHASE';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class UserEvent {
  @Prop({ required: true, index: true })
  userId!: number;

  @Prop({ required: true, index: true })
  bookId!: string;

  @Prop({ required: true })
  type!: UserEventType;

  @Prop({ index: true })
  categoryName?: string;

  createdAt!: Date;
}

export const UserEventSchema = SchemaFactory.createForClass(UserEvent);
