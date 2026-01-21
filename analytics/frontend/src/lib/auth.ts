import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "./api";

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          set({ token: data.access_token });

          // Fetch user info
          const user = await authApi.me(data.access_token);
          set({ user, isLoading: false });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Login failed";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register({ email, password, name });
          // Auto-login after registration
          await get().login(email, password);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Registration failed";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null, error: null });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await authApi.me(token);
          set({ user, isLoading: false });
        } catch {
          // Token expired or invalid
          set({ token: null, user: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tsis-auth", // Same key as journal for shared auth
      partialize: (state) => ({ token: state.token }),
    }
  )
);
