import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await login(username, password);
      addToast(`Welcome back, ${user.memberProfile?.fullName || 'Member'}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || (err.response
        ? 'Unable to sign in with those credentials.'
        : 'Cannot reach the portal server. Check that the backend and database are running.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-100 px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-center">
      <div className="mb-7 w-full max-w-md rounded-lg border border-white/40 bg-white/90 p-5 text-center shadow-sm backdrop-blur-sm">
        <div className="mb-5 flex items-center justify-center gap-4">
          <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-semibold text-white sm:h-24 sm:w-24">CM</div>
          <div className="text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Campus Management</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Member Portal</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-stone-200 pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">Secure campus access</p>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/50 bg-white/95 px-6 py-8 shadow-sm backdrop-blur-sm sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-md text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <Input
              label="Username *"
              type="text"
              required
              icon={User}
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="Password *"
              type="password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
