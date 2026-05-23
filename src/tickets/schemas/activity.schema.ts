import { Document, HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'st_ticket_activities',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Activities extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tickets' })
  ticket_id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Users' })
  performed_by: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: ['created', 'status_changed', 'assigned', 'comment_added'],
  })
  action: string;

  @Prop({ type: String, trim: true, default: null })
  details: string | null;
}

export const ActivitiesSchema = SchemaFactory.createForClass(Activities);
ActivitiesSchema.index({ ticket_id: 1 });
ActivitiesSchema.index({ performed_by: 1 });

export type ActivitiesDocument = HydratedDocument<Activities>;
