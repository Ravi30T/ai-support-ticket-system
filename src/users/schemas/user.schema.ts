import { Document, HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export class PasswordHistory {
    @Prop({ required: true, type: String })
    password: string;

    @Prop({ required: true, type: Date })
    changed_at: Date;

    @Prop({ required: true, type: Boolean })
    is_active: boolean;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'st_users' })
export class Users extends Document {
    @Prop({ required: true, type: String, trim: true })
    name: string;

    @Prop({ required: true, type: String, unique: true, trim: true })
    email: string;

    /**
     * Empty array when admin is invited — password is set later via setup-admin flow.
     * Populated immediately for self-registered users.
     */
    @Prop({ required: false, type: [PasswordHistory], _id: false, default: [] })
    password_obj: PasswordHistory[];

    @Prop({ required: true, type: Types.ObjectId, ref: 'Roles' })
    role: Types.ObjectId;

    @Prop({ type: Boolean, default: false })
    is_active: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Users' })
    created_by: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Users' })
    updated_by: Types.ObjectId;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
UsersSchema.index({ email: 1 });
UsersSchema.index({ role: 1 });
export type UsersDocument = HydratedDocument<Users>;
