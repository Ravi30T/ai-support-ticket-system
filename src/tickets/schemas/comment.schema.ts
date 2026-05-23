import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'st_comments',
})
export class Comments extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tickets' })
  ticket_id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Users' })
  sender: Types.ObjectId;

  @Prop({ required: true, type: String, enum: ['user', 'admin'] })
  sender_role: string;

  @Prop({ required: true, type: String, trim: true })
  text: string;
}

export const CommentsSchema = SchemaFactory.createForClass(Comments);
CommentsSchema.index({ ticket_id: 1 });
CommentsSchema.index({ sender: 1 });
export type CommentsDocument = HydratedDocument<Comments>;
