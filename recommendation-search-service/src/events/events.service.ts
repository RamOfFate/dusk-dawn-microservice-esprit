import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IndexedBook } from '../models/indexed-book.schema';
import { UserEvent } from '../models/user-event.schema';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly eventModel: Model<UserEvent>,
    @InjectModel(IndexedBook.name)
    private readonly bookModel: Model<IndexedBook>,
  ) {}

  async createEvent(input: CreateEventDto) {
    let categoryName = input.categoryName;
    if (!categoryName) {
      const book = await this.bookModel
        .findOne({ bookId: input.bookId })
        .lean();
      categoryName = book?.categoryName;
    }

    const doc = await this.eventModel.create({
      userId: input.userId,
      bookId: input.bookId,
      type: input.type,
      categoryName,
    });

    return {
      id: String(doc._id),
      userId: doc.userId,
      bookId: doc.bookId,
      type: doc.type,
      categoryName: doc.categoryName,
      createdAt: doc.createdAt,
    };
  }
}
