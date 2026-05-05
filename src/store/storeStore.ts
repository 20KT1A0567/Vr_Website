import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedStoreState {
  selectedStoreId: number | null;
  selectedStoreName: string | null;
  selectedStorePlace: string | null;
  hasPicked: boolean;
  pickStore: (id: number, name: string, place?: string | null) => void;
  clearStore: () => void;
  acknowledgePrompt: () => void;
}

export const useSelectedStore = create<SelectedStoreState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      selectedStoreName: null,
      selectedStorePlace: null,
      hasPicked: false,
      pickStore: (id, name, place) =>
        set({ selectedStoreId: id, selectedStoreName: name, selectedStorePlace: place ?? null, hasPicked: true }),
      clearStore: () => set({ selectedStoreId: null, selectedStoreName: null, selectedStorePlace: null, hasPicked: true }),
      acknowledgePrompt: () => set({ hasPicked: true })
    }),
    { name: "vrtech-selected-store" }
  )
);
