import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const ANON_USER = { id: "00000000-0000-0000-0000-000000000000", email: "local@app" };

const AuthContext = createContext<AuthContextType>({
  user: ANON_USER,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={{ user: ANON_USER, loading: false, signOut: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};
