import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

export class SocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(client: Socket, ticketId: string) {
    this.logger.log(`Client ${client.id} joined ticket room: ${ticketId}`);
    client.join(ticketId);
    return { event: 'joined', data: ticketId };
  }

  @SubscribeMessage('leave_ticket')
  handleLeaveTicket(client: Socket, ticketId: string) {
    this.logger.log(`Client ${client.id} left ticket room: ${ticketId}`);
    client.leave(ticketId);
    return { event: 'left', data: ticketId };
  }

  emitTicketUpdate(ticketId: string, data: any) {
    try {
      this.server.to(ticketId).emit('ticket_updated', data);
      this.logger.log(`Emitted ticket_updated for ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(`Error emitting ticket_updated for ticket ${ticketId}`, error);
    }
  }

  emitTicketAssigned(ticketId: string, data: any) {
    try {
      this.server.to(ticketId).emit('ticket_assigned', data);
      this.logger.log(`Emitted ticket_assigned for ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(`Error emitting ticket_assigned for ticket ${ticketId}`, error);
    }
  }

  emitNewComment(ticketId: string, data: any) {
    try {
      this.server.to(ticketId).emit('new_comment', data);
      this.logger.log(`Emitted new_comment for ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(`Error emitting new_comment for ticket ${ticketId}`, error);
    }
  }
}
