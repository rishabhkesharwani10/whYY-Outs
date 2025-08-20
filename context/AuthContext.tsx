import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { User } from '../types.ts';
import { supabase } from '../supabase.ts';

const mapSupabaseProfile = (supabaseUser: any, profile: any): User => {
  return {
    id: supabaseUser.id || profile?.id,
    email: supabaseUser.email || profile?.email || '',
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    pincode: profile?.pincode || '',
    avatar_url: profile?.avatar_url,
    role: profile?.role || 'customer',
    createdAt: profile?.created_at,
  };
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  allUsers: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, password: string, role: 'customer' | 'seller') => Promise<{ error: any | null }>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => user?.email === 'whyyouts@gmail.com', [user]);

  const fetchAllUsers = useCallback(async () => {
    const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
    if (usersError) {
      console.error('Error fetching all users:', usersError);
    } else if (usersData) {
      setAllUsers(usersData.map(p => mapSupabaseProfile({}, p)));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) {
            console.warn('Profile not found for authenticated user. Creating a default one.');
            const newProfileData = {
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.email!.split('@')[0],
                role: 'customer' as const,
                phone: '',
                address: '',
                pincode: '',
                avatar_url: '',
            };
            const { data: createdProfile, error: insertError } = await supabase
                .from('profiles')
                .insert(newProfileData)
                .select()
                .single();

            if (insertError) {
                console.error("Fatal error: Could not create missing user profile.", insertError);
                setUser(null);
            } else {
                profile = createdProfile;
            }
        }
        
        if (profile) {
          const currentUser = mapSupabaseProfile(session.user, profile);
          setUser(currentUser);
          if (currentUser.email === 'whyyouts@gmail.com') {
            await fetchAllUsers();
          }
        } else {
            setUser(null);
        }
      } else {
        setUser(null);
        setAllUsers([]);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAllUsers]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string, role: 'customer' | 'seller') => {
    // This is the standard Supabase pattern.
    // We pass metadata during sign-up, and a database trigger
    // creates the profile, avoiding a race condition where the client
    // tries to insert a profile that's already being created.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: '',
          address: '',
          pincode: '',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=BFA181&color=101010&size=128`
        }
      }
    });

    // We no longer need to manually insert a profile from the client.
    // If there's an error (e.g., user already exists), we return it.
    // If successful, Supabase sends a confirmation email.
    return { error };
  }, []);
  
  const updateUser = useCallback(async (updatedData: Partial<User>) => {
    if (!user) return;

    const profileData: { [key: string]: any } = {
      full_name: updatedData.fullName,
      phone: updatedData.phone,
      address: updatedData.address,
      pincode: updatedData.pincode,
      avatar_url: updatedData.avatar_url
    };

    // Remove undefined keys so they don't overwrite existing data in Supabase
    Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
        console.error('Error updating profile:', error);
    } else if (data) {
        // Update local state with the new data
        setUser(prevUser => ({...prevUser!, ...updatedData}));
    }
  }, [user]);
  
  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/login`,
    });
    return { error };
  }, []);

  const value = useMemo(() => ({
    isAuthenticated: !!user,
    user,
    isAdmin,
    allUsers,
    loading,
    login,
    logout,
    register,
    updateUser,
    sendPasswordResetEmail,
  }), [user, isAdmin, allUsers, loading, login, logout, register, updateUser, sendPasswordResetEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};