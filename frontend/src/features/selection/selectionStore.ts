import { create } from 'zustand';

interface SelectionState {
  active: boolean;
  ids: Set<string>;
  enter: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useSelection = create<SelectionState>((set) => ({
  active: false,
  ids: new Set(),
  enter: (id) => set({ active: true, ids: new Set([id]) }),
  toggle: (id) =>
    set((s) => {
      const ids = new Set(s.ids);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      return { ids, active: ids.size > 0 };
    }),
  clear: () => set({ active: false, ids: new Set() }),
}));
