import { Global, Module } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';

@Global()
@Module({
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
