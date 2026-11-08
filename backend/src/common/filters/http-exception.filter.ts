//backend/src/common/filters/http-exception.filter.ts
// v1.1 — les messages d'erreur sont traduits selon la langue de la requête
// (en-tête X-Lang) : voir common/error-messages.ts.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { INTERNAL_ERROR, TOO_MANY_REQUESTS, translateMessage } from '../error-messages';
import { localeFromRequest } from '../i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const locale = localeFromRequest(request);

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = isHttp
      ? (exception as HttpException).getResponse()
      : { message: INTERNAL_ERROR.fr };

    if (!isHttp) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const payload = (typeof body === 'string' ? { message: body } : { ...(body as object) }) as {
      message?: string | string[];
    };

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      payload.message = TOO_MANY_REQUESTS[locale];
    } else if (Array.isArray(payload.message)) {
      // Erreurs de validation : une phrase par champ fautif
      payload.message = payload.message.map((m) => translateMessage(m, locale));
    } else if (typeof payload.message === 'string') {
      payload.message = translateMessage(payload.message, locale);
    }

    response.status(status).json({
      statusCode: status,
      ...payload,
    });
  }
}
