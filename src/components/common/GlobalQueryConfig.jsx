import React, { createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const GlobalDataContext = createContext(null);

export function useGlobalUser() {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalUser must be used within GlobalDataProvider');
  }
  return context.user;
}

export function useGlobalProfile() {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalProfile must be used within GlobalDataProvider');
  }
  return context.profile;
}

export function GlobalDataProvider({ children }) {
  // Single user query shared across the entire app
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return null;
      return base44.auth.me();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Single profile query shared across the entire app
  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.UserProfile.filter({ created_by: user.email });
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const profile = profiles?.[0];

  return (
    <GlobalDataContext.Provider value={{ user, profile, isLoading: userLoading || profileLoading }}>
      {children}
    </GlobalDataContext.Provider>
  );
}