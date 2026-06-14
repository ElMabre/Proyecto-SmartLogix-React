# SmartLogix - Frontend

SmartLogix Frontend es la interfaz de usuario para la plataforma de gestión logística. Esta aplicación web de una sola página (SPA) está construida para interactuar con los microservicios del backend, ofreciendo paneles de control para la gestión de inventario, pedidos y autenticación de usuarios.

---

## Tecnologías principales

- **React** — Biblioteca principal para la construcción de interfaces de usuario.
- **Vite** — Entorno de desarrollo y empaquetador optimizado.
- **Tailwind CSS** — Framework de utilidades CSS para diseño ágil y responsivo.
- **PostCSS** — Procesador de estilos para transformar y compilar Tailwind.
- **Mock API / Storage** — Sistema interno (`useMockApi`, `mockDatabase`) para desarrollo y pruebas sin depender del backend en etapas tempranas.

---

## Estructura del proyecto

    src/
    ├── core/               # Lógica central de la aplicación
    │   ├── hooks/          # Hooks personalizados (ej. useMockApi)
    │   ├── services/       # Integración con APIs (ej. authService)
    │   └── storage/        # Configuración de persistencia local o mocks
    ├── modules/            # Módulos de negocio (vistas y lógica específica)
    │   ├── auth/           # Autenticación y login (LoginForm)
    │   ├── inventory/      # Gestión de inventario (InventoryView)
    │   └── orders/         # Gestión de pedidos (OrderView)
    ├── shared/             # Recursos compartidos en toda la aplicación
    │   ├── components/     # Componentes UI reutilizables (Button, Card, etc.)
    │   └── layouts/        # Estructuras de página (DashboardLayout)
    ├── App.jsx             # Componente raíz y enrutamiento principal
    └── main.jsx            # Punto de entrada de la aplicación

---

## Requisitos previos

- Node.js 16 o superior
- NPM o Yarn como gestor de paquetes

---

## Despliegue local

### 1. Clonar el repositorio

    git clone <url-del-repositorio>
    cd Proyecto-SmartLogix-React

### 2. Instalar dependencias

    npm install

### 3. Configurar variables de entorno

Copia el archivo `.env.example` o edita directamente el `.env` para configurar la URL del API Gateway:

    VITE_API_URL=http://localhost:8080

### 4. Levantar el servidor de desarrollo

    npm run dev

La aplicación estará disponible en http://localhost:5173.

### 5. Construcción para producción

    npm run build

Esto generará una carpeta `dist/` con los archivos estáticos optimizados.

---

## Patrones de diseño

- **Modularidad por dominio** — Agrupación de vistas y componentes por contexto de negocio (Auth, Orders, Inventory) en lugar de por tipo de archivo, facilitando la escalabilidad del proyecto.
- **Componentes presentacionales vs contenedores** — Separación entre componentes UI (`shared/components`) y vistas conectadas a la lógica de negocio (`modules/`).