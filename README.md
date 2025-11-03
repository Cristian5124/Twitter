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

## Pruebas

Pruebas manuales del monolito incluyen registro de usuario, login, creacion de posts y obtencion del stream. Para el frontend, probar registro, login, creacion de posts y validacion de 140 caracteres. Las pruebas de microservicios son similares pero con la URL de API Gateway.

Ejemplo de registro: curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"username": "angie_ramos", "email": "angie@example.com", "password": "password123"}'

Para microservicios: curl -X POST https://tu-api-gateway.execute-api.us-east-1.amazonaws.com/prod/auth/register -H "Content-Type: application/json" -d '{"username": "test_user", "email": "test@example.com", "password": "test123"}'

Nota: En serverless se implementaron endpoints de comentarios y estadisticas por post, con toggle de likes por usuario.

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

Nota: Este proyecto fue desarrollado con fines educativos. No esta disenado para produccion y requeriria mejoras adicionales de seguridad, escalabilidad y monitoreo para un entorno real.

Fecha de entrega: Noviembre 2025
