import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'lider' | 'voluntario' | 'membro' | 'visitante' | 'financeiro';

export interface MyMinistry {
  ministerio_id: string;
  nome: string;
  slug: string | null;
  descricao: string | null;
  papel: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone?: string;
  foto_url?: string;
  status: string;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  myMinistries: MyMinistry[];
  myMinistriesLoading: boolean;
  refreshMyMinistries: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  canMinistry: (action: 'read' | 'write', ministerioId: string) => boolean;
  isAdmin: boolean;
  isFinanceiro: boolean;
  isLider: boolean;
  isVoluntario: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMinistries, setMyMinistries] = useState<MyMinistry[]>([]);
  const [myMinistriesLoading, setMyMinistriesLoading] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);

  const refreshMyMinistries = useCallback(async () => {
    setMyMinistriesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_ministries');
      if (error) throw error;
      setMyMinistries((data ?? []) as MyMinistry[]);
    } catch (error) {
      console.error('Error fetching my ministries:', error);
      setMyMinistries([]);
    } finally {
      setMyMinistriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip silent token rotation and same-user re-auth (tab focus) to prevent
        // resetting loading state and wiping in-progress form data.
        if (event === 'TOKEN_REFRESHED') return;
        if (loadedUserIdRef.current === session.user.id) return;
        setLoading(true);
        fetchUserData(session.user.id);
      } else {
        loadedUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
        setMyMinistries([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Profile fetch is non-fatal — a schema cache miss must never block role loading
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, nome, email, telefone, foto_url, status')
          .eq('user_id', userId)
          .maybeSingle();
        if (!profileError) setProfile(profileData as Profile);
        else console.error('Profile fetch error (non-fatal):', profileError);
      } catch (profileErr) {
        console.error('Profile fetch threw (non-fatal):', profileErr);
      }

      // Role fetch is critical — always runs regardless of profile result
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;
      const userRoles = (rolesData || []).map((r: { role: UserRole }) => r.role);
      setRoles(userRoles);

      refreshMyMinistries();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      loadedUserIdRef.current = userId;
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    loadedUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setMyMinistries([]);
  };

  const hasRole = (role: UserRole) => roles.includes(role);
  
  const canMinistry = useCallback((action: 'read' | 'write', ministerioId: string): boolean => {
    if (roles.includes('admin')) return true;
    const ministry = myMinistries.find(m => m.ministerio_id === ministerioId);
    if (!ministry) return false;
    if (action === 'read') return true;
    return ministry.papel === 'lider';
  }, [roles, myMinistries]);
  
  const isAdmin = roles.includes('admin');
  const isFinanceiro = roles.includes('financeiro') && !roles.includes('admin');
  const isLider = roles.includes('lider') || roles.includes('admin');
  const isVoluntario = roles.includes('voluntario') || roles.includes('lider') || roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      loading,
      myMinistries,
      myMinistriesLoading,
      refreshMyMinistries,
      signIn,
      signUp,
      signOut,
      hasRole,
      canMinistry,
      isAdmin,
      isFinanceiro,
      isLider,
      isVoluntario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
