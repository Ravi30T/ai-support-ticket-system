import { Document, HydratedDocument, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export enum UserTokenType {
    ADMIN_SETUP_PASSWORD = 'admin_setup_password',
    ADMIN_PASSWORD_RESET = 'admin_password_reset',
    USER_EMAIL_VERIFY = 'user_email_verify',
    USER_PASSWORD_RESET = 'user_password_reset',
}

/**
 * Reusable token schema for multiple flows:
 *  - 'admin_setup_password'      → sent to a new admin to complete account setup (set password)
 *  - 'admin_password_reset'      → sent to any admin who requests a password reset
 *  - 'user_email_verify'         → sent to any user to verify their email
 *  - 'user_password_reset'       → sent to any user to reset their password
 * 
 */
@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'st_user_tokens' })
export class UserToken extends Document {

    @Prop({ required: true, type: Types.ObjectId, ref: 'Users' })
    user_id: Types.ObjectId;

    /** Stored as a hashed value. Raw token is only returned once at creation time. */
    @Prop({ required: true, type: String })
    token: string;

    @Prop({ required: true, type: String, enum: Object.values(UserTokenType) })
    type: UserTokenType;

    /** Token expiry — 24h for admin_setup_password, 1h for admin_password_reset, 24h for user_email_verify, 1h for user_password_reset */
    @Prop({ required: true, type: Date })
    expires_at: Date;

    /** Set when the token is successfully consumed. Null means unused. */
    @Prop({ required: false, type: Date, default: null })
    used_at: Date | null;
}

export const UserTokenSchema = SchemaFactory.createForClass(UserToken);

// Fast lookups by token value and type
UserTokenSchema.index({ token: 1 });
UserTokenSchema.index({ user_id: 1, type: 1 });

export type UserTokenDocument = HydratedDocument<UserToken>;
