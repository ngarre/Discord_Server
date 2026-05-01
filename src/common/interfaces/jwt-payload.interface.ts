export interface JwtPayload { // Esta interfaz define la estructura del payload que se incluye en el token JWT.
  sub: string; // El campo "sub" (subject) es un estándar en JWT que se utiliza para identificar al usuario al que pertenece el token. En este caso, se espera que sea el ID del usuario.
  email: string; // El campo "email" se incluye para tener acceso al correo electrónico del usuario directamente desde el token, lo que puede ser útil en algunos casos sin necesidad de consultar la base de datos.
  username: string; // El campo "username" se incluye para tener acceso al nombre de usuario del usuario directamente desde el token, lo que también puede ser útil en algunos casos sin necesidad de consultar la base de datos.
}