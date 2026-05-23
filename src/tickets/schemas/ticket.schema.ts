import { Document, HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'st_tickets',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Tickets extends Document {
  @Prop({ required: true, type: String, trim: true })
  ticket_number: string;

  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, trim: true })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Categories', default: null })
  category: Types.ObjectId | null;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Users' })
  created_by: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users', default: null })
  assigned_to: Types.ObjectId;
}

export const TicketsSchema = SchemaFactory.createForClass(Tickets);
TicketsSchema.index({ ticket_number: 1 }, { unique: true });
TicketsSchema.index({ status: 1 });
TicketsSchema.index({ title: 'text', description: 'text' });

export type TicketsDocument = HydratedDocument<Tickets>;
