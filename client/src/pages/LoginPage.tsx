import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('owner@nexora.io');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary font-bold text-xl shadow-lg shadow-primary-container/20">
            N
          </div>
          <div>
            <h1 className="font-bold text-on-surface text-xl">Nexora</h1>
            <p className="text-xs text-outline font-medium">Project Management Platform</p>
          </div>
        </div>

        <h2 className="text-center text-sm font-semibold text-on-surface mb-6">
          Sign in to your account
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/30 border border-error/30 p-3 text-xs text-error text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nexora.io"
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 py-2.5 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-outline" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 py-2.5 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-outline" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-container py-2.5 text-xs font-semibold text-on-primary hover:bg-primary-container/90 transition-colors shadow-md shadow-primary-container/20"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center text-xs text-outline">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
