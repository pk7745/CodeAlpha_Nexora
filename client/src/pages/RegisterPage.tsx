import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
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
          Create a new account
        </h2>

        {error && (
          <div className="mb-4 rounded-xl bg-error-container/30 border border-error/30 p-3 text-xs text-error text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Vance"
                className="w-full rounded-xl bg-surface-container border border-outline-variant/40 py-2.5 pl-9 pr-3 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-outline" />
            </div>
          </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
            <UserPlus className="h-4 w-4" />
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-outline-variant/30 text-center text-xs text-outline">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
