import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IndexedBook, IndexedBookSchema } from '../models/indexed-book.schema';
import { UserEvent, UserEventSchema } from '../models/user-event.schema';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEvent.name, schema: UserEventSchema },
      { name: IndexedBook.name, schema: IndexedBookSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
