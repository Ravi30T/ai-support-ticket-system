import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { UserToken, UserTokenSchema } from '../users/schemas/user-token.schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    MongooseModule.forFeature([
      { name: UserToken.name, schema: UserTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService],
})
export class AuthModule {}
