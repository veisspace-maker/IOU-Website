import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';
import React from 'react';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.defaults = { withCredentials: true, baseURL: '' };
    mockedAxios.get = vi.fn();
    mockedAxios.post = vi.fn();
  });

  it('should provide auth context', () => {
    mockedAxios.get.mockRejectedValue(new Error('Not authenticated'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.verify2FA).toBe('function');
  });

  it('should check authentication on mount', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      twoFactorEnabled: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
  });

  it('should handle login without 2FA', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      twoFactorEnabled: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAxios.get.mockRejectedValue(new Error('Not authenticated'));
    mockedAxios.post.mockResolvedValue({ data: { user: mockUser } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const loginResult = await result.current.login('testuser', 'password', false);

    expect(loginResult.requiresTwoFactor).toBe(false);
    expect(loginResult.error).toBeUndefined();
    expect(result.current.user).toEqual(mockUser);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'testuser',
      password: 'password',
      rememberMe: false,
    });
  });

  it('should handle login with 2FA required', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Not authenticated'));
    mockedAxios.post.mockResolvedValue({ data: { requiresTwoFactor: true } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const loginResult = await result.current.login('testuser', 'password', false);

    expect(loginResult.requiresTwoFactor).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should handle login error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Not authenticated'));
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const loginResult = await result.current.login('testuser', 'wrongpassword', false);

    expect(loginResult.error).toBe('Invalid credentials');
    expect(result.current.user).toBeNull();
  });

  it('should handle 2FA verification', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      twoFactorEnabled: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAxios.get.mockRejectedValue(new Error('Not authenticated'));
    mockedAxios.post.mockResolvedValue({ data: { user: mockUser } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const verifyResult = await result.current.verify2FA('123456');

    expect(verifyResult.success).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/verify-2fa', { token: '123456' });
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      twoFactorEnabled: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });
    mockedAxios.post.mockResolvedValue({ data: { message: 'Logout successful' } });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    await result.current.logout();

    expect(result.current.user).toBeNull();
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/logout');
  });
});
