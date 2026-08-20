'use client';

import { create } from 'zustand';
import type { Claim, Role } from '@/types';

type UIState = {
  role: Role;
  selectedClaim: Claim | null;
  workspaceOpen: boolean;
  setRole: (role: Role) => void;
  openClaim: (claim: Claim) => void;
  closeWorkspace: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  role: 'CLAIMS_SUPERVISOR',
  selectedClaim: null,
  workspaceOpen: false,
  setRole: (role) => set({ role }),
  openClaim: (claim) => set({ selectedClaim: claim, workspaceOpen: true }),
  closeWorkspace: () => set({ workspaceOpen: false, selectedClaim: null }),
}));
