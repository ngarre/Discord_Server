import { 
  Injectable, // Permite que Nest gestione esta clase 
  NestMiddleware, // Interfaz para definir middleware en NestJS
  Logger // Clase para registrar mensajes de log
} from '@nestjs/common';

import { 
  Request, // Tipo para la solicitud HTTP
  Response, // Tipo para la respuesta HTTP
  NextFunction } // Función para pasar al siguiente middleware o controlador
  from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware { 
  private logger = new Logger('HTTP'); // Etiqueta que aparecerá en los logs para identificar el origen (HTTP)

  // El método use(...) es un método obligatorio para cualquier clase que implemente NestMiddleware. Se ejecuta para cada solicitud entrante.
  use(req: Request, res: Response, next: NextFunction) { 
    const start = Date.now(); // Marca el tiempo de inicio para calcular la duración de la solicitud

    res.on('finish', () => { // Escucha el evento 'finish' de la respuesta, que se emite cuando la respuesta ha sido enviada al cliente
      const duration = Date.now() - start; // Calcula la duración de la solicitud restando el tiempo de inicio del tiempo actual
      this.logger.log( //
        `${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`, // Mensaje que sale por consola
      );
    });

    next(); // Llama a la función next() para pasar el control al siguiente middleware o controlador en la cadena de manejo de solicitudes
  }
}