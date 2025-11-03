# Twitter Clone - Proyecto de Arquitecturas Empresariales

Autores: Angie Ramos y Cristian Polo  
Materia: Arquitecturas Empresariales  
Fecha: Noviembre 2025

## Tabla de Contenidos

- [Descripcion del Proyecto](#descripcion-del-proyecto)
- [Arquitectura](#arquitectura)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalacion y Configuracion](#instalacion-y-configuracion)
- [Ejecucion Local](#ejecucion-local)
- [Despliegue en AWS](#despliegue-en-aws)
- [Pruebas](#pruebas)
- [API Documentation](#api-documentation)
- [Video Demostracion](#video-demostracion)
- [Enlaces del Proyecto](#enlaces-del-proyecto)

## Descripcion del Proyecto

Este proyecto es un clon simplificado de Twitter que permite a los usuarios registrarse e iniciar sesion, crear posts de maximo 140 caracteres, visualizar un stream unificado de posts y autenticacion y autorizacion mediante JWT.

El proyecto se desarrollo siguiendo una arquitectura evolutiva: primera fase monolito Spring Boot, segunda fase separacion en microservicios con AWS Lambda.

<img width="1845" height="1033" alt="image" src="https://github.com/user-attachments/assets/d891a4ec-5c5f-4d2b-9663-7c54c0ddee1e" />

<img width="1846" height="1035" alt="image" src="https://github.com/user-attachments/assets/50bda173-e66f-4761-9931-d620b7a55370" />

<img width="1850" height="1034" alt="image" src="https://github.com/user-attachments/assets/4a682b58-22c9-483b-a39b-4ed1e7cc0af7" />


## Arquitectura

### Arquitectura del Monolito

```
Cliente Web (HTML/CSS/JS)
- Interfaz de Usuario
- Gestion de Auth (JWT)
  |
  | HTTP/REST
  v
Spring Boot Monolito
  Controllers (API REST)
  - AuthController
  - PostController
  - StreamController
    |
    v
  Services (Logica de Negocio)
  - UsuarioService
  - PostService
    |
    v
  Security (JWT)
  - JwtTokenProvider
  - JwtAuthenticationFilter
    |
    v
  Repositories (JPA)
  - UsuarioRepository
  - PostRepository
  - StreamRepository
    |
    v
H2 Database (En Memoria)
```

### Arquitectura de Microservicios (AWS Lambda)

```
Cliente Web (S3 Static Website)
- Interfaz de Usuario
- Gestion de Auth (JWT)
  |
  | HTTPS
  v
API Gateway (AWS)
- Enrutamiento de Requests
- CORS Configuration
  |
  +-------------+-------------+
  |             |             |
  v             v             v
Lambda        Lambda        Lambda
Usuarios      Posts         Stream
Service       Service       Service
  |             |             |
  v             v             v
DynamoDB Tables
- twitter-clone-usuarios
- twitter-clone-posts
```

### Modelo de Datos

Entidad Usuario: id (Long/String), username (String, unico), email (String, unico), password (String, encriptado), bio (String, opcional), createdAt (DateTime), activo (Boolean).

Entidad Post: id (Long/String), contenido (String, max 140 caracteres), usuario (Relacion con Usuario), likes (Integer), createdAt (DateTime).

Entidad Stream: id (Long/String), nombre (String), descripcion (String), posts (Lista de Posts), createdAt (DateTime).

## Tecnologias Utilizadas

Backend (Monolito): Java 17, Spring Boot 3.1.5 con Spring Web, Spring Data JPA y Spring Security, H2 Database en memoria, JWT con io.jsonwebtoken, Maven para gestion de dependencias y Lombok para reducir boilerplate.

Frontend: HTML5, CSS3 con diseño responsive y JavaScript vanilla ES6+ usando Fetch API para consumir servicios REST.

Microservicios (AWS Lambda): Node.js 18.x, AWS Lambda para funciones serverless, AWS API Gateway para API REST, AWS DynamoDB para base de datos NoSQL, AWS S3 para hosting estatico, AWS SAM para IaC, bcryptjs para encriptacion de contrasenas y jsonwebtoken para JWT.

Herramientas de Desarrollo: Git para control de versiones, AWS CLI para gestion de recursos AWS, SAM CLI para despliegue serverless y Postman para testing de APIs.

## Instalacion y Configuracion

Prerrequisitos: Para el monolito, Java JDK 17 o superior, Maven 3.8+ y Git. Para microservicios, Node.js 18+, npm, AWS CLI configurado y SAM CLI.

Clonar el repositorio: git clone https://github.com/Cristian5124/Twitter.git y cd twitter-clone-project.

Configuracion inicial: No se requiere configuracion adicional para el monolito, usa H2 en memoria. Para AWS, configurar credenciales con aws configure y tener permisos para crear recursos Lambda, DynamoDB, S3 y API Gateway.

## Ejecucion Local

Opcion 1: Monolito Spring Boot. En Windows: run-monolito.bat. En Linux/Mac: chmod +x run-monolito.sh y ./run-monolito.sh. Manual: cd monolito-spring, mvn clean install y mvn spring-boot:run. La aplicacion estara en http://localhost:8080 para API y http://localhost:8080/h2-console para H2.

Opcion 2: Frontend local. Abrir frontend-web/index.html en navegador o usar servidor local: cd frontend-web, python -m http.server 8000 o npx http-server -p 8000. Acceder a http://localhost:8000. Asegurarse que backend corra en puerto 8080.

## Despliegue en AWS

Paso 1: Desplegar microservicios Lambda. cd microservicios-lambda, deploy.bat en Windows o chmod +x deploy.sh y ./deploy.sh en Linux/Mac. Durante sam deploy --guided, usar stack name twitter-clone-stack y region preferida como us-east-1.

Outputs importantes: ApiUrl para API Gateway y FrontendUrl para bucket S3.

Paso 2: Actualizar frontend con API URL. Editar frontend-web/app.js y cambiar const API_URL = 'https://TU-API-GATEWAY-URL/prod';

Paso 3: Desplegar frontend en S3. cd frontend-web, deploy-s3.bat en Windows o deploy-s3.sh en Linux/Mac. Proporcionar nombre del bucket.

Verificar despliegue accediendo a la URL del bucket S3.

<img width="1847" height="1033" alt="image" src="https://github.com/user-attachments/assets/efbc828c-90c2-465e-8065-28cc69285566" />

<img width="1844" height="1042" alt="image" src="https://github.com/user-attachments/assets/84b26e45-717a-4d2d-9f99-054876b41c46" />

<img width="1845" height="601" alt="image" src="https://github.com/user-attachments/assets/4e82b1aa-c63c-4c80-8217-d0b8128e3886" />

<img width="1847" height="1032" alt="image" src="https://github.com/user-attachments/assets/e086b223-3dae-4cc9-9aeb-ea5579f80c5b" />

## Pruebas

### Pruebas Manuales del Monolito

#### 1. Registro de Usuario

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "angie_ramos",
    "email": "angie@example.com",
    "password": "password123",
    "bio": "Estudiante de Ingeniería"
  }'
```

**Resultado Esperado:** 
```json
{
  "message": "Usuario registrado exitosamente con id: 1"
}
```

#### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "angie_ramos",
    "password": "password123"
  }'
```

**Resultado Esperado:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "angie_ramos",
  "email": "angie@example.com"
}
```

Guarda el token para las siguientes peticiones.

#### 3. Crear Post (Requiere autenticación)

```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "contenido": "Hola"
  }'
```

**Resultado Esperado:**
```json
{
  "id": 1,
  "contenido": "Hola",
  "usuario": {
    "id": 1,
    "username": "angie_ramos",
    "email": "angie@example.com"
  },
  "likes": 0,
  "createdAt": "2025-11-02T10:30:00"
}
```

#### 4. Obtener Stream de Posts

```bash
curl -X GET http://localhost:8080/api/stream/posts
```

**Resultado Esperado:**
```json
[
  {
    "id": 1,
    "contenido": "Hola",
    "usuario": {
      "id": 1,
      "username": "angie_ramos",
      "email": "angie@example.com"
    },
    "likes": 0,
    "createdAt": "2025-11-02T10:30:00"
  }
]
```

#### 5. Validación de 140 Caracteres

```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "contenido": "Este es un post muy largo que excede los 140 caracteres permitidos para probar la validación del sistema Este es un post muy largo que excede los 140 caracteres"
  }'
```

**Resultado Esperado:**
```json
{
  "message": "El post no puede exceder 140 caracteres"
}
```

### Pruebas de la Interfaz Web

#### Test Case 1: Registro Exitoso
1. Abrir `http://localhost:8000` (o la URL de S3)
2. Hacer clic en "Registrarse"
3. Completar el formulario:
   - Username: `cristian_polo`
   - Email: `cristian@example.com`
   - Password: `test1234`
   - Bio: `Desarrollador Full Stack`
4. Click en "Registrarse"
5. **Resultado esperado:** Mensaje de éxito y redirección al login

#### Test Case 2: Login Exitoso
1. En la pantalla de login, ingresar:
   - Username: `cristian_polo`
   - Password: `test1234`
2. Click en "Iniciar Sesión"
3. **Resultado esperado:** 
   - Se muestra el nombre de usuario en el header
   - Aparece la sección para crear posts
   - Se visualiza el stream de posts

#### Test Case 3: Crear Post
1. Con sesión iniciada, en el textarea escribir: `Probando Twitter Clone`
2. Verificar que el contador muestre: `25/140`
3. Click en "Publicar"
4. **Resultado esperado:**
   - El post aparece inmediatamente en el stream
   - El textarea se limpia
   - El contador vuelve a `0/140`

#### Test Case 4: Validación de 140 Caracteres
1. Intentar escribir más de 140 caracteres
2. **Resultado esperado:** 
   - El textarea no permite más de 140 caracteres
   - El contador se pone en rojo al pasar de 120 caracteres

#### Test Case 5: Refrescar Stream
1. Click en el botón "Actualizar"
2. **Resultado esperado:** Los posts se recargan correctamente

#### Test Case 6: Logout
1. Click en "Cerrar Sesión"
2. Resultado esperado:
   - Se vuelve a la pantalla de login
   - El token se elimina del localStorage

### Reporte de Pruebas

| ID | Prueba | Resultado | Evidencia |
|----|--------|-----------|-----------|
| T001 | Registro de usuario válido | PASS | Usuario creado correctamente |
| T002 | Registro con username duplicado | PASS | Error: "El username ya existe" |
| T003 | Login con credenciales válidas | PASS | Token JWT generado |
| T004 | Login con credenciales inválidas | PASS | Error: "Credenciales inválidas" |
| T005 | Crear post autenticado | PASS | Post creado y visible en stream |
| T006 | Crear post sin autenticación | PASS | Error 401 Unauthorized |
| T007 | Post con más de 140 caracteres | PASS | Error de validación |
| T008 | Post con contenido vacío | PASS | Error: "El contenido es obligatorio" |
| T009 | Visualizar stream público | PASS | Lista de posts ordenada por fecha |
| T010 | Persistencia de datos (H2) | PASS | Datos disponibles durante sesión |
| T011 | CORS habilitado | PASS | Frontend puede consumir API |
| T012 | JWT expira después de 24h | PASS | Token con expiración configurada |

### Pruebas de Microservicios Lambda

Las pruebas de los microservicios Lambda son similares, solo cambia la URL base:

```bash
# Ejemplo con API Gateway
curl -X POST https://tu-api-gateway.execute-api.us-east-1.amazonaws.com/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "test123"
  }'
```

Nota: En la versión serverless se implementaron los endpoints de comentarios y estadísticas por post (likes y conteo de comentarios). El botón Like hace toggle por usuario (like/unlike).


## API Documentation

Endpoints publicos: POST /api/auth/register para registrar usuario, POST /api/auth/login para autenticar, GET /api/stream/posts para obtener posts.

Endpoints protegidos (requieren JWT en header Authorization: Bearer {token}): POST /api/posts para crear post, GET /api/posts para obtener posts, GET /api/posts/usuario/{usuarioId} para posts de usuario, PUT /api/posts/{postId}/like para incrementar likes.

## Video Demostracion

Video del proyecto funcionando: https://youtu.be/MU5HMnjxeJ0

Contenido del video: demostracion del monolito Spring Boot funcionando localmente, registro e inicio de sesion de usuarios, creacion de posts y visualizacion del stream, validacion de 140 caracteres, navegacion por la interfaz web, despliegue de microservicios en AWS Lambda, despliegue del frontend en S3, pruebas de la aplicacion desplegada en la nube, revision de recursos en la consola de AWS.

## Enlaces del Proyecto

Repositorio GitHub: https://github.com/Cristian5124/Twitter.git

Aplicacion desplegada: Frontend (S3): https://twitter-clone-frontend-pdb7ok8c6i-20251103.s3.us-east-1.amazonaws.com/index.html

API Gateway: https://x39uk5rfo0.execute-api.us-east-1.amazonaws.com/prod

Recursos AWS: DynamoDB tables twitter-clone-usuarios, twitter-clone-posts; Lambda functions twitter-clone-usuarios-service, twitter-clone-posts-service, twitter-clone-stream-service; S3 bucket twitter-clone-frontend-pdb7ok8c6i-20251103.

## Comparacion: Monolito vs Microservicios

Aspecto | Monolito Spring Boot | Microservicios Lambda
---------|---------------------|---------------------
Arquitectura | Aplicacion unica | 3 funciones independientes
Base de Datos | H2 en memoria | DynamoDB (persistente)
Escalabilidad | Vertical (mas recursos) | Horizontal (automatica)
Despliegue | Servidor unico | Serverless (sin gestion)
Costo | Fijo (servidor 24/7) | Pay-per-use
Mantenimiento | Mas simple inicialmente | Mas complejo (multiples servicios)
Desarrollo | Mas rapido al inicio | Requiere mas configuracion

## Licencia

Este proyecto es de uso academico para la materia de Arquitecturas Empresariales.

---

Fecha de entrega: Noviembre 2025
