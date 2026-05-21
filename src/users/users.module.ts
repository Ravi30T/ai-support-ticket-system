import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Users, UsersSchema } from "./schemas/user.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Users.name, schema: UsersSchema },
        ]),
    ],
    controllers: [UsersController],
    providers: [],
    exports: []
})
export class UsersModule { }