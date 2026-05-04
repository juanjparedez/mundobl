# Retomar — MundoBL

Fecha última sesión: 4 Mayo 2026  
Branch main: `e2cbb14`  
Branch WIP activo: `wip/markdown-editor`

---

## Estado del proyecto

La app está en **main**, limpia, con type-check y lint sin errores, build de producción exitoso.

### Lo que se hizo esta sesión (en orden)

1. **Feedback tracking completo** — usuarios pueden editar, replicar, comentar, eliminar y cambiar estado de sus propios casos desde `/perfil`
2. **APIs de feedback** — `POST /api/feedback`, `PATCH/DELETE /api/feedback/[id]`, `POST /api/feedback/[id]/comments`, `PATCH /api/feedback/update-status`
3. **PWA fix** — Se eliminó `head.tsx` que linkeaba `/manifest.json` (404). Next.js App Router con `manifest.ts` ya inyecta automáticamente el link correcto a `/manifest.webmanifest`
4. **Fix Next.js 16 params** — Route handlers con params dinámicos ahora usan `Promise<{ id: string }>` y `await params`
5. **Noticias Fase 1** — Todo en main: schema, admin panel, AI generate, página pública

---

## Lo que queda por hacer (prioridades)

### 🔴 PRÓXIMO: Editor Markdown para Noticias

Branch `wip/markdown-editor` tiene la base. Tiene errores que hay que resolver:

**Archivo a revisar:** `src/components/admin/MarkdownEditor/MarkdownEditor.tsx`

**Problemas pendientes:**
1. `Form.Item` de Ant Design no acepta render prop `({ value, onChange }) => ...` — hay que usar `<Form.Item>` + `<Controller>` de `rc-field-form` o pasar `value`/`onChange` directamente como props al componente hijo usando el patrón de Ant Design: el hijo debe aceptar `value` y `onChange` y Form.Item los pasa automáticamente
2. `Tabs` de Ant Design 6 no usa `value` sino `activeKey`, y `Tabs.TabPane` está deprecado — usar el array `items` en su lugar
3. `markdown-it` necesita `@types/markdown-it` instalado: `npm install --save-dev @types/markdown-it`

**Cómo continuar:**
```bash
git checkout wip/markdown-editor
npm install --save-dev @types/markdown-it
# Arreglar MarkdownEditor.tsx con los 3 puntos de arriba
# Luego hacer merge a main
git checkout main
git merge wip/markdown-editor
```

**Patrón correcto para Form.Item con componente custom:**
```tsx
// Ant Design pasa value y onChange automáticamente al hijo directo de Form.Item
<Form.Item label="Resumen" name="summary" rules={[...]}>
  <MarkdownEditor rows={8} placeholder="..." />
  {/* MarkdownEditor debe aceptar value?: string y onChange?: (v: string) => void */}
</Form.Item>
```

**Patrón correcto para Tabs en Ant Design 6:**
```tsx
<Tabs
  activeKey={activeTab}
  onChange={(key) => setActiveTab(key as 'edit' | 'preview')}
  items={[
    { key: 'edit', label: 'Editar', children: <textarea ... /> },
    { key: 'preview', label: 'Vista Previa', children: <div ... /> },
  ]}
  tabBarExtraContent={<Space>...</Space>}
/>
```

---

### 🟠 Después del Markdown Editor

1. **Upload de imagen de portada para noticias**
   - Usar el endpoint `/api/upload` que ya existe
   - Agregar campo de upload en el form de noticia (admin)
   - Guardar URL en `imageUrl` del modelo `News`

2. **Página de detalle de noticia** `/noticias/[id]`
   - Server component con metadata dinámica (OG tags, twitter card)
   - Renderizar markdown con `markdown-it`
   - Link a fuente original, tags, serie relacionada

3. **Comentarios en noticias**
   - Tabla `NewsComment` en schema: `(id, newsId, userId, body, createdAt)`
   - APIs: `GET/POST /api/news/[id]/comments`
   - Sección en `/noticias/[id]`

4. **Notificaciones cuando hay noticia nueva**
   - Usar `src/lib/notifications.ts` que ya existe
   - Trigger en `PATCH /api/admin/news` cuando status cambia a `PUBLISHED`

---

### 🟡 Pendiente menor

- **Admin Feedback** (`FeedbackClient.tsx`) tiene varios imports no usados (warnings de lint, no errores):
  `Button, Pagination, Tooltip, Empty, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FeedbackType`
  Se pueden limpiar en cualquier momento.

- **BottomNav** tiene `signOut` importado pero no usado — limpiar import.

---

## Comandos útiles para retomar

```bash
cd /home/juanparedez/mundobl

# Verificar estado
git status && git log --oneline -5

# Ver branch WIP
git branch -a

# Levantar dev
npm run dev

# Verificar antes de commitear
npm run type-check && npm run lint 2>&1 | grep "error" | wc -l
```

---

## Archivos clave del proyecto

| Archivo | Para qué |
|---------|----------|
| `ideas.md` | Roadmap completo y prioridades |
| `context.md` | Contexto técnico del proyecto |
| `prisma/schema.prisma` | Modelos de datos |
| `src/lib/database.ts` | Helpers de Prisma |
| `src/lib/auth-helpers.ts` | `requireAuth()`, `requireRole()` |
| `src/lib/notifications.ts` | Crear notificaciones in-app |
| `src/lib/gemini.ts` | Cliente Gemini AI |
| `src/i18n/messages.ts` | Traducciones ES/EN |
| `src/styles/variables.css` | Variables CSS globales |

---

## URLs en producción

- App: https://mundobl.win
- Admin: https://mundobl.win/admin
- Noticias admin: https://mundobl.win/admin/noticias
- Feedback admin: https://mundobl.win/admin/feedback

---

## Usuarios admin

- Flor (admin): florstratovarius@gmail.com
- Juan (admin): juanjparedez@gmail.com
