# MundoBL - Sistema de Gestión de Catálogo de Series

Sistema de gestión de catálogo de series desarrollado con Next.js y Ant Design.

## 🚀 Tecnologías

- **Next.js 15** - Framework React con App Router
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Ant Design 5** - Biblioteca de componentes UI
- **ESLint + Prettier** - Linting y formateo de código

## 📁 Estructura del Proyecto

```
mundobl/
├── src/
│   ├── app/                    # Páginas de Next.js (App Router)
│   │   ├── catalogo/          # Vista de catálogo
│   │   ├── admin/             # Vista de administración
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes React
│   │   ├── layout/           # Componentes de layout
│   │   │   ├── AppLayout/    # Layout principal de la app
│   │   │   ├── Header/       # Encabezado
│   │   │   └── Sidebar/      # Barra lateral
│   │   ├── common/           # Componentes comunes reutilizables
│   │   ├── catalogo/         # Componentes específicos de catálogo
│   │   └── admin/            # Componentes específicos de admin
│   ├── lib/                  # Utilidades y configuraciones
│   │   ├── providers/        # Providers de React (Theme, etc.)
│   │   └── theme.config.ts   # Configuración de temas
│   ├── styles/               # Estilos globales y variables CSS
│   │   ├── globals.css       # Estilos globales
│   │   └── variables.css     # Variables CSS dinámicas
│   ├── types/                # Tipos de TypeScript
│   └── constants/            # Constantes de la aplicación
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🎨 Sistema de Temas

El proyecto utiliza variables CSS dinámicas para facilitar la personalización de temas:

- Variables CSS en `src/styles/variables.css`
- Tema claro y oscuro configurables
- Configuración de Ant Design en `src/lib/theme.config.ts`
- Provider de tema con persistencia en localStorage

## 🛠️ Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start

# Linting
npm run lint
npm run lint:fix

# Formateo de código
npm run format
```

## 📝 Convenciones de Código

- **Componentes**: Cada componente tiene su propia carpeta con archivo `.tsx` y `.css`
- **Archivos pequeños**: Separación clara de responsabilidades
- **CSS separado**: No usar CSS-in-JS, mantener estilos en archivos `.css`
- **TypeScript**: Tipado estricto, evitar `any`
- **Principios SOLID**: Componentes reutilizables y de responsabilidad única

## 🔮 Próximos Pasos

- [ ] Integración con base de datos SQL
- [ ] Importación de datos desde Excel
- [ ] Formularios de creación/edición de series
- [ ] Sistema de autenticación (futuro)
- [ ] Funcionalidades de búsqueda y filtrado avanzado

## 📄 Licencia

Proyecto privado - MundoBL
