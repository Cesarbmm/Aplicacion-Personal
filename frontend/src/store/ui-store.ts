import { create } from 'zustand'

type UiState = {
  commandOpen: boolean
  statusMessage: string
  setCommandOpen: (open: boolean) => void
  setStatusMessage: (message: string) => void
  clearStatusMessage: () => void
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  statusMessage: '',
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  clearStatusMessage: () => set({ statusMessage: '' }),
}))
