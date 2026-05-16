import { create } from 'zustand';

/**
 * UIの一時状態 (ドロワー開閉など) を保持する軽量ストア。
 * ゲーム本体 state とは独立 (永続化しない)。
 */
type UiStore = {
  taskPanelOpen: boolean;
  openTaskPanel: () => void;
  closeTaskPanel: () => void;
  toggleTaskPanel: () => void;
};

export const useUiStore = create<UiStore>()((set) => ({
  taskPanelOpen: false,
  openTaskPanel: () => set({ taskPanelOpen: true }),
  closeTaskPanel: () => set({ taskPanelOpen: false }),
  toggleTaskPanel: () => set((s) => ({ taskPanelOpen: !s.taskPanelOpen })),
}));
