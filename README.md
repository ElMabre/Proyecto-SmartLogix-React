# Frontend - SmartLogix

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-1.4-729B1B?style=for-the-badge&logo=vitest&logoColor=white)

## Descripción General

Este proyecto representa el cliente web y la única cara visible para los usuarios de SmartLogix. Está construido como una Single Page Application (SPA) moderna y rápida. Su función en el sistema es brindar la experiencia de usuario y comercio electrónico, consumiendo de forma centralizada toda la lógica de negocio del backend.

Dado el enfoque Multi-Tenant de la arquitectura, este frontend se encarga de gestionar el contexto de la tienda actual, inyectando los identificadores de la PYME y tokens de seguridad en cada petición hacia el ecosistema.

> El frontend no se comunica directamente con ningún microservicio por motivos de seguridad y diseño arquitectónico. Todas las peticiones pasan por el API Gateway.

## Integración con la Arquitectura

```text
[ SmartLogix Frontend / React ]
              |
              |  Peticiones HTTP (Axios)
              |
              |  Headers Inyectados:
              |   - Authorization: Bearer <TOKEN>
              |   - pyme_id: <ID_PYME>
              v
     +-----------------+
     |   API Gateway   |  (http://localhost:8080)
     +-----------------+
              |
  +-------+---+---+-------+-------+
  |       |       |       |       |
  v       v       v       v       v
[Auth] [Users] [Orders] [Inv.]  [Notif]
```

## Stack Tecnológico

| Tecnología / Librería | Propósito principal |
|---|---|
| React (v19) | Biblioteca core para la construcción de componentes y la UI |
| Vite (v8) | Entorno de desarrollo ultrarrápido y empaquetador para producción |
| Tailwind CSS (v3) | Framework de utilidades CSS para diseño responsivo y ágil |
| Axios | Cliente HTTP principal para orquestar la comunicación con el API Gateway |
| Vitest / React Testing Library | Frameworks utilizados para las pruebas unitarias y de componentes (DOM) |
| ESLint | Linter configurado para mantener estándares de calidad y formato en el código |

## Requisitos Previos

Para levantar este servicio en un entorno de desarrollo local, requieres:

- Node.js (versión 18.x o superior recomendada)
- npm, yarn o pnpm como gestor de paquetes
- El servicio API Gateway de SmartLogix en ejecución

## Variables de Entorno

Debes crear un archivo `.env` en el directorio raíz del frontend basándote en la siguiente configuración:

| Variable | Descripción | Valor local recomendado |
|---|---|---|
| `VITE_API_GATEWAY_URL` | URL de entrada principal hacia la red de microservicios | `http://localhost:8080` |

## Instrucciones de Ejecución

### Modo Desarrollo Local

Instala las dependencias del proyecto:

```bash
npm install
```

Inicia el servidor de desarrollo con Hot-Module Replacement (HMR):

```bash
npm run dev
```

El proyecto estará disponible por defecto en `http://localhost:5173`.

## Pruebas y Cobertura

El proyecto está configurado con Vitest para garantizar la resiliencia del frontend.

Para correr la suite de pruebas unitarias:

```bash
npm run test
```

Para generar un reporte completo de la cobertura de código:

```bash
npm run test:coverage
```
