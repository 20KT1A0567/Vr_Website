import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signOut } from "firebase/auth";
import type { AuthUser } from "types";
import { auth as firebaseAuth } from "lib/firebase";

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        signOut(firebaseAuth).catch(() => {
          // ignore — already signed out or no Firebase session
        });
      }
    }),
    { name: "vrtech-auth" }
  )
);
