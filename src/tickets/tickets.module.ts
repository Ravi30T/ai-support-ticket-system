import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tickets, TicketsSchema } from './schemas/ticket.schema';
import { Categories, CategoriesSchema } from './schemas/category.schema';
import { Comments, CommentsSchema } from './schemas/comment.schema';
import { Counters, CountersSchema } from './schemas/counter.schema';
import { Activities, ActivitiesSchema } from './schemas/activity.schema';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './services/tickets.service';
import { CategoryService } from './services/category.service';
import { AiService } from './services/ai.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tickets.name, schema: TicketsSchema },
      { name: Categories.name, schema: CategoriesSchema },
      { name: Comments.name, schema: CommentsSchema },
      { name: Counters.name, schema: CountersSchema },
      { name: Activities.name, schema: ActivitiesSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, CategoryService, AiService],
  exports: [TicketsService, CategoryService, AiService],
})
export class TicketsModule {}
