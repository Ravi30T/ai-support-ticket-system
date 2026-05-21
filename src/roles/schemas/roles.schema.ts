import { Document, HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true, collection: 'st_roles' })
export class Roles extends Document {

    @Prop({ required: true, type: String, unique: true, trim: true })
    name: string;

    @Prop({ required: false, type: String, trim: true })
    description?: string;

    @Prop({ required: false, type: Boolean, default: true })
    is_active: boolean;
}

export const RolesSchema = SchemaFactory.createForClass(Roles);
RolesSchema.index({ name: 1 }, { unique: true });
export type RolesDocument = HydratedDocument<Roles>;