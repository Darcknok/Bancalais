import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppUser, UserRole } from '@/data/auth';
import { profileToUser, userToProfile } from '@/data/auth';
import {
  loginAPI,
  registerAPI,
  getMe,
  updateMe,
  getToken,
  setToken,
  removeToken,
} from '@/lib/api';

type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    role: UserRole;
    referralCode?: string;
  }) => Promise<string | null>;
  logout: () => void;
  updateProfile: (data: Partial<AppUser>) => void;
  changeClub: (clubId: number | null, referralCode?: string) => void;
  isCoach: boolean;
  isAdmin: boolean;
  /** Users with IDs 1 or 10 can access dashboards (coach/admin panels) */
  isPrivileged: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  updateProfile: () => {},
  changeClub: () => {},
  isCoach: false,
  isAdmin: false,
  isPrivileged: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await getMe();
      if (data?.user) {
        setUser(profileToUser(data.user));
      } else {
        await removeToken();
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await loginAPI(email, password);
    if (error) return error;
    if (!data) return 'Erreur de connexion';

    await setToken(data.token);
    setUser(profileToUser(data.user));
    return null;
  }, []);

  const register = useCallback(async (form: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    role: UserRole;
    referralCode?: string;
  }): Promise<string | null> => {
    if (form.password.length < 4) return 'Le mot de passe doit faire au moins 4 caractères.';

    const { data, error } = await registerAPI({
      email: form.email,
      password: form.password,
      prenom: form.prenom,
      nom: form.nom,
      role: form.role,
      referral_code: form.referralCode,
    });

    if (error) return error;
    if (!data) return 'Erreur lors de la création du compte';

    await setToken(data.token);
    setUser(profileToUser(data.user));
    return null;
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AppUser>) => {
    const payload = userToProfile(data);
    const { data: result, error } = await updateMe(payload);
    if (result?.user) {
      setUser(profileToUser(result.user));
    } else if (error) {
      console.warn('updateProfile error:', error);
    }
  }, []);

  const changeClub = useCallback(async (clubId: number | null, referralCode?: string) => {
    const { data: result, error } = await updateMe({
      club_id: clubId,
      referral_code_used: referralCode ?? null,
    });
    if (result?.user) {
      setUser(profileToUser(result.user));
    } else if (error) {
      console.warn('changeClub error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changeClub,
        isCoach: user?.role === 'coach',
        isAdmin: user?.role === 'admin',
        isPrivileged: user?.id === 1 || user?.id === 10,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
