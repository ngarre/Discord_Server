import { SetMetadata } from '@nestjs/common'; //
import { MemberRole } from '@prisma/client';

// Este decorador se utiliza para asignar roles a los endpoints, y luego el guard de roles se encargará de
//  verificar si el usuario tiene los roles necesarios para acceder a ese endpoint.
export const ROLES_KEY = 'roles'; 
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles); // El decorador Roles recibe un número variable de argumentos (roles) y los asigna a la metadata del endpoint utilizando SetMetadata. 
// Luego, el guard de roles puede acceder a esta metadata para verificar si el usuario tiene los roles necesarios para acceder al endpoint.