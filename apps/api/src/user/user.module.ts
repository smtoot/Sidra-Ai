import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserAdminController } from './user.admin.controller';
import { UserController } from './user.controller';

@Module({
  controllers: [UserAdminController, UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
