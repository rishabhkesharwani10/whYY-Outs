import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import type { AuthenticatedUser, Customer, Seller } from '../types.ts';
import { supabase } from '../supabase.ts';

const mapSupabaseCustomer = (supabaseUser: any, profile: any): Omit<Customer, 'role'> => ({
    id: supabaseUser.id || profile?.id,
    email: supabaseUser.email || profile?.email || '',
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    pincode: profile?.pincode || '',
    avatar_url: profile?.avatar_url,
    createdAt: profile?.created_at,
});

const mapSupabaseSeller = (supabaseUser: any, profile: any): Omit<Seller, 'role'> => ({
    id: supabaseUser.id || profile?.id,
    email: supabaseUser.email || profile?.email || '',
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    pincode: profile?.pincode || '',
    avatar_url: profile?.avatar_url,
    panNumber: profile?.pan_number,
    gstNumber: profile?.gst_number,
    createdAt: profile?.created_at,
});


interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  isAdmin: boolean;
  allUsers: AuthenticatedUser[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, password: string, role: 'customer' | 'seller', panNumber?: string, gstNumber?: string, address?: string, pincode?: string) => Promise<{ error: any | null }>;
  updateUser: (updatedData: Partial<AuthenticatedUser>) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [allUsers, setAllUsers] = useState<AuthenticatedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useMemo(() => user?.email === 'whyyouts@gmail.com', [user]);

  const fetchAllUsers = useCallback(async () => {
    const { data: customersData, error: customersError } = await supabase.from('customers').select('*');
    if (customersError) console.error('Error fetching customers:', customersError);

    const { data: sellersData, error: sellersError } = await supabase.from('sellers').select('*');
    if (sellersError) console.error('Error fetching sellers:', sellersError);
    
    const combinedUsers: AuthenticatedUser[] = [];
    if (customersData) {
        combinedUsers.push(...customersData.map(p => ({ ...mapSupabaseCustomer({}, p), role: 'customer' })));
    }
    if (sellersData) {
        combinedUsers.push(...sellersData.map(p => ({ ...mapSupabaseSeller({}, p), role: 'seller' })));
    }
    setAllUsers(combinedUsers);
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        let currentUser: AuthenticatedUser | null = null;
        
        // 1. Check customers table
        const { data: customerProfile } = await supabase.from('customers').select('*').eq('id', session.user.id).single();
        
        if (customerProfile) {
          currentUser = { ...mapSupabaseCustomer(session.user, customerProfile), role: 'customer' };
        } else {
          // 2. If not a customer, check sellers table
          const { data: sellerProfile } = await supabase.from('sellers').select('*').eq('id', session.user.id).single();
          if (sellerProfile) {
            currentUser = { ...mapSupabaseSeller(session.user, sellerProfile), role: 'seller' };
          } else {
             // 3. Fallback for registration race condition
            console.warn("Profile not found in 'customers' or 'sellers'. Falling back to session user_metadata.");
            const metadata = session.user.user_metadata;
            if (metadata.role === 'seller') {
              currentUser = { ...mapSupabaseSeller(session.user, { id: session.user.id, ...metadata }), role: 'seller' };
            } else {
              currentUser = { ...mapSupabaseCustomer(session.user, { id: session.user.id, ...metadata }), role: 'customer' };
            }
          }
        }
        
        setUser(currentUser);

        if (currentUser && currentUser.email === 'whyyouts@gmail.com') {
          await fetchAllUsers();
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

  const register = useCallback(async (fullName: string, email: string, password: string, role: 'customer' | 'seller', panNumber?: string, gstNumber?: string, address?: string, pincode?: string) => {
    // To ensure clear separation, we first check if the email exists in the *other* user type's table.
    const oppositeTable = role === 'customer' ? 'sellers' : 'customers';
    const oppositeRole = role === 'customer' ? 'seller' : 'customer';

    const { data: existingProfile, error: checkError } = await supabase
      .from(oppositeTable)
      .select('email')
      .eq('email', email)
      .single();

    // 'PGRST116' is the code for 'No rows found', which is the expected outcome if the email is new.
    // Any other error is an actual problem.
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking for existing user in ${oppositeTable}:`, checkError);
      return { error: { message: 'An internal error occurred. Please try again later.' } as any };
    }
    
    if (existingProfile) {
      return { error: { message: `This email is already registered as a ${oppositeRole}. Please use a different email or log in.` } as any };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          pan_number: panNumber,
          gst_number: gstNumber,
          phone: '',
          address: address || '',
          pincode: pincode || '',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=BFA181&color=101010&size=128`
        }
      }
    });
    
    // Supabase itself prevents duplicate emails in the main auth table. 
    // This provides a more user-friendly message if they try to sign up again with the same role.
    if (error && error.message.includes("User already registered")) {
      return { error: { message: `An account with this email already exists as a ${role}. Please log in.` } as any };
    }

    return { error };
  }, []);
  
  const updateUser = useCallback(async (updatedData: Partial<AuthenticatedUser>) => {
    if (!user) return;

    const tableName = user.role === 'seller' ? 'sellers' : 'customers';

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
      .from(tableName)
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
        console.error(`Error updating profile in ${tableName}:`, error);
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
