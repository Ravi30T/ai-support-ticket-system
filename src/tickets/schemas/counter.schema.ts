import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

@Schema({
  collection: 'st_counters',
})
export class Counters {
  @Prop({ required: true, type: String })
  _id: string; // E.g., 'SST-2026'

  @Prop({ required: true, type: Number, default: 0 })
  seq: number;
}

export const CountersSchema: MongooseSchema = SchemaFactory.createForClass(Counters);
export type CountersDocument = HydratedDocument<Counters>;
