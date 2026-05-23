import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Note: In Fastify, response.statusCode might not be immediately updated
          // until the reply is sent, but accessing it here usually gives the set code.
          const delay = Date.now() - now;
          this.logger.log(`${method} ${url} ${response.statusCode} - ${delay}ms`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          const status = error.status ?? error.statusCode ?? 500;
          this.logger.error(
            `${method} ${url} ${status} - ${delay}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
