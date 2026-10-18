import { create } from 'zustand';

export const useHarborlineStore = create((set) => ({
  activeScene: 0,
  isSceneMenuOpen: false,
  setActiveScene: (activeScene) => set({ activeScene }),
  toggleSceneMenu: () => set((state) => ({ isSceneMenuOpen: !state.isSceneMenuOpen })),
}));
