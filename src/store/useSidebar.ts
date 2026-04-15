import { create } from 'zustand'

interface SidebarState {
  isHovered: boolean
  setIsHovered: (value: boolean) => void
}

export const useSidebar = create<SidebarState>((set) => ({
  isHovered: false,
  setIsHovered: (value) => set({ isHovered: value }),
}))
