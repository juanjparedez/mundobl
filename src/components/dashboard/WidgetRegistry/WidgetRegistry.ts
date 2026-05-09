/**
 * Registro central de widgets disponibles para los dashboards.
 *
 * Los widgets se registran en runtime (cada pagina dashboard registra los
 * suyos antes de renderizar el grid). Asi cada feature decide que widgets
 * expone y con que props, sin importar todos al kernel.
 *
 * El registro es global por aplicacion (singleton). Si una pagina necesita
 * widgets locales que no quiere exponer al picker, puede usar `hidden: true`.
 */
import type { WidgetDefinition } from '../types';

class WidgetRegistryImpl {
  private widgets = new Map<string, WidgetDefinition>();

  register<TProps extends Record<string, unknown>>(
    def: WidgetDefinition<TProps>
  ): void {
    this.widgets.set(def.id, def as WidgetDefinition);
  }

  registerMany(defs: WidgetDefinition[]): void {
    for (const def of defs) this.register(def);
  }

  unregister(id: string): void {
    this.widgets.delete(id);
  }

  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  has(id: string): boolean {
    return this.widgets.has(id);
  }

  /** Lista todos los widgets — opcional filtrado por roles/modo/categoria. */
  list(filter?: {
    roles?: WidgetDefinition['roles'];
    mode?: WidgetDefinition['modes'] extends (infer T)[] ? T : never;
    category?: WidgetDefinition['category'];
    includeHidden?: boolean;
  }): WidgetDefinition[] {
    const all = Array.from(this.widgets.values());
    return all.filter((w) => {
      if (!filter?.includeHidden && w.hidden) return false;
      if (filter?.category && w.category !== filter.category) return false;
      if (filter?.roles && w.roles) {
        const intersects = w.roles.some((r) =>
          (filter.roles as string[]).includes(r)
        );
        if (!intersects) return false;
      }
      if (filter?.mode && w.modes && !w.modes.includes(filter.mode)) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.widgets.clear();
  }
}

export const WidgetRegistry = new WidgetRegistryImpl();
