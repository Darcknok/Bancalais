/**
 * Fournisseur de contexte d'authentification — Bancalais Natation.
 *
 * Ce module gère l'état d'authentification global de l'application :
 * - Stocke l'utilisateur connecté (AppUser) et l'état de chargement
 * - Fournit les fonctions : login, register, logout, updateProfile, changeClub
 * - Expose des helpers de rôle : isCoach, isAdmin, isSwimmer, isPrivileged
 *
 * Au montage du provider :
 *   1. Récupère le token JWT depuis le stockage sécurisé
 *   2. Si un token existe, appelle /api/auth/me pour récupérer le profil
 *   3. Convertit le format API (snake_case) en format applicatif (camelCase)
 *   4. En cas d'erreur ou de token invalide, supprime le token
 *
 * Les rôles supportés :
 *   - swimmer : nageur (rôle par défaut)
 *   - coach : entraîneur
 *   - admin : administrateur du club
 *   - isPrivileged : IDs 1 ou 10 (accès aux tableaux de bord coach/admin)
 */

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

// --- Type du contexte d'authentification ---
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
  isSwimmer: boolean;
  /** Users with IDs 1 or 10 can access dashboards (coach/admin panels) */
  isPrivileged: boolean;
};

// Valeurs par défaut du contexte (pas d'utilisateur, en cours de chargement)
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
  isSwimmer: false,
  isPrivileged: false,
});

/**
 * Provider Auth — enveloppe les composants enfants et fournit le contexte.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Initialisation : restauration de la session au montage ---
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Vérifier la validité du token en récupérant le profil utilisateur
      const { data, error } = await getMe();
      if (data?.user) {
        setUser(profileToUser(data.user));
      } else {
        // Token invalide ou expiré → nettoyage
        await removeToken();
      }
      setIsLoading(false);
    })();
  }, []);

  // --- Connexion ---
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await loginAPI(email, password);
    if (error) return error;
    if (!data) return 'Erreur de connexion';

    // Stocker le token et restaurer le profil utilisateur
    await setToken(data.token);
    setUser(profileToUser(data.user));
    return null;
  }, []);

  // --- Inscription ---
  const register = useCallback(async (form: {
    email: string;
    password: string;
    prenom: string;
    nom: string;
    role: UserRole;
    referralCode?: string;
  }): Promise<string | null> => {
    // Validation côté client : mot de passe minimal de 4 caractères
    if (form.password.length < 4) return 'Le mot de passe doit faire au moins 4 caractères.';

    // Conversion camelCase → snake_case pour l'API
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

  // --- Déconnexion ---
  const logout = useCallback(async () => {
    await removeToken();
    setUser(null);
  }, []);

  // --- Mise à jour du profil ---
  const updateProfile = useCallback(async (data: Partial<AppUser>) => {
    // Conversion camelCase → snake_case avant envoi à l'API
    const payload = userToProfile(data);
    const { data: result, error } = await updateMe(payload);
    if (result?.user) {
      // Mettre à jour l'état local avec les données fraîches du serveur
      setUser(profileToUser(result.user));
    } else if (error) {
      console.warn('updateProfile error:', error);
    }
  }, []);

  // --- Changement de club ---
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

  // --- Valeurs dérivées des rôles ---
  // Déterminées dynamiquement à partir du rôle de l'utilisateur connecté

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
        isSwimmer: user?.role === 'swimmer',
        // Accès privilégié : IDs 1 et 10 (hors rôle swimmer) pour les dashboards
        isPrivileged: (user?.id === 1 || user?.id === 10) && user?.role !== 'swimmer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder au contexte d'authentification.
 * Utilisation : const { user, login, logout, isCoach } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}
