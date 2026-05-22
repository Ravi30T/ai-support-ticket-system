import { Document, HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'st_categories',
})
export class Categories extends Document {
  @Prop({ required: true, type: String, trim: true })
  name: string;

  @Prop({ required: false, type: String, trim: true })
  description?: string;
}

export const CategoriesSchema = SchemaFactory.createForClass(Categories);
CategoriesSchema.index({ name: 1 }, { unique: true });
export type CategoriesDocument = HydratedDocument<Categories>;
