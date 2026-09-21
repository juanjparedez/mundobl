# T28 — Navegación móvil con paridad de accesos

**Fase:** 1 · **Esfuerzo:** M · **Depende de:** nada · **Prioridad alta: el 75 % del tráfico es móvil.**
**Objetivo:** que en el celular se llegue a todo lo que existe. Hoy la app parece "reducida" en móvil, pero no le faltan funciones: le faltan accesos.

## Qué está mal hoy (2026-09-21)

- `BottomNav` muestra 4 accesos (Catálogo, Viendo, Feedback, Notificaciones) y un cajón "Más" con solo 5 entradas: Ver series, Novedades, Sitios, Contenido, Estadísticas.
- El `Sidebar` de escritorio tiene 19 entradas. En móvil no hay forma de llegar a Actores, Directores, Productoras, Glosario, Plataformas y planes, Acerca ni Administración (para admins y colaboradores). "Ver series", que es una sección principal, queda escondida en "Más".
- Feedback ocupa un slot primario con 27 visitantes al mes; "Ver series" tiene 104.

## Cambios

1. **Barra inferior**: Catálogo · Ver series · Viendo · Perfil (con la campana de notificaciones como badge sobre el avatar) · Más. Feedback pasa al cajón.
2. **Cajón "Más" completo**: misma lista y mismo orden que el `Sidebar`, generada desde una única fuente (`src/components/layout/navItems.ts`, nuevo, que exporta `NAV_ITEMS` con `key, icon, labelKey, path, roles?`). `Sidebar` y `BottomNav` la consumen; queda prohibido duplicar la lista.
3. **Roles**: Administración y Panel de colaborador aparecen en el cajón solo para quien tiene el rol, igual que en el sidebar.
4. **Buscador**: el `TopBar` móvil tiene que mostrar el ícono de búsqueda (Command-K no existe en el celular). Un toque abre el mismo `CommandK` en modo pantalla completa.
5. **Ajustes**: el engranaje de escritorio (`SettingsPanel`: tema, idioma, accesibilidad) tiene que estar en el cajón "Más" como última entrada.
6. Cada elemento táctil ≥ 44 px; el cajón se cierra al navegar; la entrada activa se resalta.

## Verificación manual (a 375 px)

- [ ] Desde la home se llega en ≤ 2 toques a cada una de las 19 secciones del sidebar.
- [ ] "Ver series" está en la barra inferior.
- [ ] Un admin ve "Administración" en el cajón; un visitante no.
- [ ] La búsqueda se abre desde el `TopBar` móvil.
- [ ] Sin scroll horizontal en ninguna pantalla.
- [ ] type-check, lint, build; 10 locales (keys nuevas solo si cambian rótulos).

## Fuera de alcance

Rediseñar el `Sidebar` de escritorio, cambiar rutas.
