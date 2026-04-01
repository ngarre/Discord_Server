import { 
  createParamDecorator, // Función de NestJs para crear decoradores personalizados 
  ExecutionContext } // Da acceso al contexto de la ejecución del endpoint, como la solicitud HTTP, el usuario autenticado, etc.
  from '@nestjs/common';

export const CurrentUser = createParamDecorator( // Defino decorador personalizado llamado CurrentUser
  // Función que se ejecuta cuando Nest resuelve el decorador
  // - data sería argumento que se pasa al decorador, pero no lo necesito en este caso y lo dejo como unknown
  // - ctx es el contexto de ejecución que me da acceso a la solicitud HTTP y al usuario autenticado
  (data: unknown, ctx: ExecutionContext) => { 
    const request = ctx.switchToHttp().getRequest(); // Obtengo la solicitud HTTP del contexto de ejecución para acceder al usuario autenticado
    // Devuelvo el usuario autenticado que fue adjuntado a la solicitud por el guard de autenticación (JwtAuthGuard). Esto permite que en los controladores 
    // pueda usar @CurrentUser() para obtener directamente el usuario autenticado sin tener que acceder a request.user cada vez.
    return request.user; 
  },
);