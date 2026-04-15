import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { IndexedBook, IndexedBookSchema } from '../models/indexed-book.schema';
import { UserEvent, UserEventSchema } from '../models/user-event.schema';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IndexedBook.name, schema: IndexedBookSchema },
      { name: UserEvent.name, schema: UserEventSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
