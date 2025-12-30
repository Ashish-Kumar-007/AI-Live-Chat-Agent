import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userId: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      isAuthenticated: false,
      setAuth: (token: string, userId: string) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token);
        }
        set({ token, userId, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
        }
        set({ token: null, userId: null, isAuthenticated: false });
      },
      initialize: () => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("auth_token");
          if (token) {
            // Try to decode JWT to get userId
            try {
              const parts = token.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                set({ 
                  token, 
                  userId: payload.id || payload.userId, 
                  isAuthenticated: true 
                });
              } else {
                // Fallback to persisted state
                const persisted = localStorage.getItem("auth-storage");
                if (persisted) {
                  const parsed = JSON.parse(persisted);
                  if (parsed.state?.token && parsed.state?.userId) {
                    set({
                      token: parsed.state.token,
                      userId: parsed.state.userId,
                      isAuthenticated: true,
                    });
                  }
                }
              }
            } catch {
              // If decoding fails, check persisted state
              const persisted = localStorage.getItem("auth-storage");
              if (persisted) {
                try {
                  const parsed = JSON.parse(persisted);
                  if (parsed.state?.token && parsed.state?.userId) {
                    set({
                      token: parsed.state.token,
                      userId: parsed.state.userId,
                      isAuthenticated: true,
                    });
                  }
                } catch {}
              }
            }
          }
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

