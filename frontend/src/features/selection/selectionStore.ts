import { create } from 'zustand';

/** Ce qu'on sélectionne : les actions proposées en dépendent. */
export type SelectionKind = 'track' | 'album';

interface SelectionState {
  active: boolean;
  kind: SelectionKind;
  ids: Set<string>;
  enter: (id: string, kind?: SelectionKind) => void;
  toggle: (id: string, kind?: SelectionKind) => void;
  clear: () => void;
}

export const useSelection = create<SelectionState>((set) => ({
  active: false,
  kind: 'track',
  ids: new Set(),
  enter: (id, kind = 'track') => set({ active: true, kind, ids: new Set([id]) }),
  toggle: (id, kind = 'track') =>
    set((s) => {
      // Changer de nature repart de zéro : on ne mélange pas titres et albums.
      if (s.kind !== kind) return { kind, active: true, ids: new Set([id]) };
      const ids = new Set(s.ids);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ids, active: ids.size > 0 };
    }),
  clear: () => set({ active: false, ids: new Set() }),
}));
