import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check active session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get the user profile data
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();
            
          if (error) throw error;
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: data.username,
            full_name: data.full_name,
            role: data.role,
            ...data
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching auth user:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get the user profile data
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          return;
        }
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: data.username,
          full_name: data.full_name,
          role: data.role,
          ...data
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const unlockAccount = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          locked_at: null,
          failed_login_attempts: 0,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unlocking account:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    unlockAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
