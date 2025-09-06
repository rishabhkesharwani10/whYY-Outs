import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { supabase } from '../supabase.ts';
import type { AuthenticatedUser, Customer, Seller, Admin } from '../types.ts';
// FIX: `User` and `AuthError` types are not exported from the top-level `supabase-js` package in some versions/environments.
// Importing them directly from `@supabase/auth-js` resolves the module resolution issue.
import type { User, AuthError } from '@supabase/auth-js';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
  register: (fullName: string, email: string, password: string, role: 'customer' | 'seller', panNumber?: string, gstNumber?: string, address?: string, pincode?: string, businessName?: string, registrationNumber?: string) => Promise<{ error: AuthError | null }>;
  updateUser: (updates: Partial<AuthenticatedUser>) => Promise<{ error: any | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: AuthError | null }>;
  allUsers: (Customer | Seller)[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<(Customer | Seller)[]>([]);

  const fetchUserProfile = useCallback(async (authUser: User | null): Promise<AuthenticatedUser | null> => {
    if (!authUser) return null;

    // Handle special admin case first to bypass all other profile lookups
    if (authUser.email === 'whyyouts@gmail.com') {
        return {
            id: authUser.id,
            email: authUser.email,
            fullName: 'Admin User',
            role: 'admin',
        } as Admin;
    }

    // Attempt to fetch existing profile from 'customers'
    const { data: customerData } = await supabase.from('customers').select('*').eq('id', authUser.id).single();
    if (customerData) {
      return {
        id: customerData.id,
        email: customerData.email,
        fullName: customerData.full_name,
        phone: customerData.phone,
        addressLine1: customerData.address_line_1,
        addressLine2: customerData.address_line_2,
        city: customerData.city,
        state: customerData.state,
        country: customerData.country,
        zip: customerData.zip,
        avatar_url: customerData.avatar_url,
        createdAt: customerData.created_at,
        gender: customerData.gender,
        role: 'customer'
      };
    }

    // Attempt to fetch existing profile from 'sellers'
    const { data: sellerData } = await supabase.from('sellers').select('*').eq('id', authUser.id).single();
    if (sellerData) {
      return {
          id: sellerData.id,
          email: sellerData.email,
          fullName: sellerData.full_name,
          phone: sellerData.phone,
          addressLine1: sellerData.address_line_1,
          addressLine2: sellerData.address_line_2,
          city: sellerData.city,
          state: sellerData.state,
          country: sellerData.country,
          zip: sellerData.zip,
          avatar_url: sellerData.avatar_url,
          createdAt: sellerData.created_at,
          gender: sellerData.gender,
          role: 'seller',
          businessName: sellerData.business_name,
          panNumber: sellerData.pan_number,
          gstNumber: sellerData.gst_number,
          registrationNumber: sellerData.registration_number
      };
    }

    // SELF-HEALING: If no profile exists, try to create one.
    const metadata = authUser.user_metadata || {};
    const { role, full_name, pan_number, gst_number, address_line_1, zip, business_name, registration_number } = metadata;

    // Case 1: Metadata exists (ideal self-healing)
    if (role && full_name) {
      console.warn(`User profile for ${authUser.email} not found. Attempting to create one from auth metadata.`);
      const commonData = {
          id: authUser.id,
          email: authUser.email,
          full_name,
          address_line_1,
          zip,
      };

      if (role === 'customer') {
          const { data: newCustomer, error } = await supabase.from('customers').insert(commonData).select().single();
          if (!error && newCustomer) {
              console.log(`Successfully created customer profile for ${authUser.email}`);
              return {
                id: newCustomer.id, email: newCustomer.email, fullName: newCustomer.full_name, phone: newCustomer.phone,
                addressLine1: newCustomer.address_line_1, addressLine2: newCustomer.address_line_2, city: newCustomer.city,
                state: newCustomer.state, country: newCustomer.country, zip: newCustomer.zip, avatar_url: newCustomer.avatar_url,
                createdAt: newCustomer.created_at, gender: newCustomer.gender, role: 'customer'
              };
          }
          if(error) console.error('Failed to self-heal customer profile with metadata:', error);

      } else if (role === 'seller') {
          const { data: newSeller, error } = await supabase.from('sellers').insert({ ...commonData, pan_number, gst_number, business_name, registration_number }).select().single();
          if (!error && newSeller) {
              console.log(`Successfully created seller profile for ${authUser.email}`);
              return {
                id: newSeller.id, email: newSeller.email, fullName: newSeller.full_name, phone: newSeller.phone,
                addressLine1: newSeller.address_line_1, addressLine2: newSeller.address_line_2, city: newSeller.city,
                state: newSeller.state, country: newSeller.country, zip: newSeller.zip, avatar_url: newSeller.avatar_url,
                createdAt: newSeller.created_at, gender: newSeller.gender, role: 'seller', 
                businessName: newSeller.business_name, panNumber: newSeller.pan_number, gstNumber: newSeller.gst_number, registrationNumber: newSeller.registration_number
              };
          }
          if(error) console.error('Failed to self-heal seller profile with metadata:', error);
      }
    } else {
      // Case 2: Metadata is missing (fallback self-healing for legacy accounts)
      console.warn(`User profile for ${authUser.email} not found and metadata is missing. Creating a default customer profile.`);
      const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.email?.split('@')[0] || 'New User'
          })
          .select()
          .single();
      
      if (!error && newCustomer) {
          console.log(`Successfully created default customer profile for ${authUser.email}`);
          return {
            id: newCustomer.id, email: newCustomer.email, fullName: newCustomer.full_name, phone: newCustomer.phone,
            addressLine1: newCustomer.address_line_1, addressLine2: newCustomer.address_line_2, city: newCustomer.city,
            state: newCustomer.state, country: newCustomer.country, zip: newCustomer.zip, avatar_url: newCustomer.avatar_url,
            createdAt: newCustomer.created_at, gender: newCustomer.gender, role: 'customer'
          };
      }
      if (error) {
        console.error('Failed to self-heal with default customer profile:', error);
      }
    }
    
    // If all attempts fail, return null
    return null;
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user || null;
      const profile = await fetchUserProfile(authUser);
      setUser(profile);
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user || null;
      const profile = await fetchUserProfile(authUser);
      setUser(profile);
      if (_event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);
  
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  useEffect(() => {
    const fetchAllUsers = async () => {
        if (isAdmin) {
            const { data: customers } = await supabase.from('customers').select('*');
            const { data: sellers } = await supabase.from('sellers').select('*');
            const all = [
                ...(customers || []).map(c => ({ ...c, fullName: c.full_name, createdAt: c.created_at, role: 'customer' as const })),
                ...(sellers || []).map(s => ({ ...s, fullName: s.full_name, createdAt: s.created_at, role: 'seller' as const }))
            ];
            setAllUsers(all);
        }
    };
    if (user) {
        fetchAllUsers();
    }
  }, [user, isAdmin]);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error };
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user);
      if (!profile) {
        await supabase.auth.signOut();
        return { 
          error: { 
            name: 'ProfileNotFound', 
            message: 'Login successful, but a user profile could not be found. Please contact support.' 
          } as AuthError 
        };
      }
    }
    
    return { error: null };
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    return { error };
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string, role: 'customer' | 'seller', panNumber?: string, gstNumber?: string, address?: string, pincode?: string, businessName?: string, registrationNumber?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          pan_number: panNumber,
          gst_number: gstNumber,
          address_line_1: address,
          zip: pincode,
          business_name: businessName,
          registration_number: registrationNumber,
        },
      },
    });

    return { error };
  }, []);

  const updateUser = useCallback(async (updates: Partial<AuthenticatedUser>) => {
    if (!user || user.role === 'admin') return { error: { message: 'Cannot update this user type.' } };
    
    const table = user.role === 'customer' ? 'customers' : 'sellers';
    const updateData: { [key: string]: any } = {};

    // Map camelCase to snake_case for Supabase
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.addressLine1 !== undefined) updateData.address_line_1 = updates.addressLine1;
    if (updates.addressLine2 !== undefined) updateData.address_line_2 = updates.addressLine2;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.zip !== undefined) updateData.zip = updates.zip;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;

    // Seller-specific fields
    if (user.role === 'seller') {
      const sellerUpdates = updates as Partial<Seller>;
      if (sellerUpdates.businessName !== undefined) updateData.business_name = sellerUpdates.businessName;
      if (sellerUpdates.panNumber !== undefined) updateData.pan_number = sellerUpdates.panNumber;
      if (sellerUpdates.gstNumber !== undefined) updateData.gst_number = sellerUpdates.gstNumber;
      if (sellerUpdates.registrationNumber !== undefined) updateData.registration_number = sellerUpdates.registrationNumber;
    }

    const { error } = await supabase.from(table).update(updateData).eq('id', user.id);

    if (!error) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const updatedProfile = await fetchUserProfile(authUser);
        setUser(updatedProfile);
    }

    return { error };
  }, [user, fetchUserProfile]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    return { error };
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    login,
    logout,
    register,
    updateUser,
    sendPasswordResetEmail,
    allUsers,
  }), [user, loading, isAdmin, allUsers, login, logout, register, updateUser, sendPasswordResetEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};