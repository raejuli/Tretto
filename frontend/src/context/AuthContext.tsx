import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import { UserProfile } from '../types';
import * as authApi from '../api/auth';
import { setAccessToken } from '../api/client';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: UserProfile; accessToken: string }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; loading: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, accessToken: action.accessToken, loading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, accessToken: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, accessToken: null, loading: true });

  useEffect(() => {
    authApi.refreshToken()
      .then((data) => {
        dispatch({ type: 'SET_USER', user: { id: data.userId, email: data.email, displayName: data.displayName }, accessToken: data.accessToken });
      })
      .catch(() => {
        dispatch({ type: 'CLEAR_USER' });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    dispatch({ type: 'SET_USER', user: { id: data.userId, email: data.email, displayName: data.displayName }, accessToken: data.accessToken });
  }, []);

  const register = useCallback(async (email: string, displayName: string, password: string) => {
    const data = await authApi.register(email, displayName, password);
    dispatch({ type: 'SET_USER', user: { id: data.userId, email: data.email, displayName: data.displayName }, accessToken: data.accessToken });
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setAccessToken(null);
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
