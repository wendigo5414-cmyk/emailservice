import { create } from 'zustand';

interface UserState {
  emails: any[];
  users: any[];
  setEmails: (data: any[]) => void;
  setUsers: (data: any[]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  emails: [],
  users: [],
  setEmails: (data) => set({ emails: data }),
  setUsers: (data) => set({ users: data }),
}));
