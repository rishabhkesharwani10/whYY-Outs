
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabase.ts';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // The HomePage component will handle role-based redirection.
      // Customer -> shows dashboard at '/'
      // Seller -> redirects from '/' to '/seller-dashboard'
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }
    
    setLoading(true);
    const { error: loginError } = await login(email, password);
    
    if (loginError) {
      setError(loginError.message || 'Invalid email or password.');
    }
    setLoading(false);
  };
  
  const handleGoogleLogin = async () => {
    setError('');
    // Use the origin as the redirect URL. A trailing slash can sometimes be important for matching.
    const redirectUrl = `${window.location.origin}/`;
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (googleError) {
      setError(googleError.message);
    }
  };

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header showSearch={false} />

      <main className="flex-grow flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-brand-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
            <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
              Login
            </h1>
            <p className="text-center text-brand-light/70 mb-8">
              Welcome back to whYYOuts.
            </p>

             <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-3 font-sans text-sm tracking-widest px-8 py-3 border border-brand-light/30 text-brand-light/90 hover:bg-brand-light/10 transition-colors duration-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                Sign in with Google
              </button>
            </div>

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-brand-gold/20"></div>
              <span className="flex-shrink mx-4 text-xs text-brand-light/50 uppercase">Or continue with</span>
              <div className="flex-grow border-t border-brand-gold/20"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-brand-gold tracking-wider uppercase"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-brand-gold tracking-wider uppercase"
                  >
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-brand-gold hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase flex justify-center items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-light/70">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-brand-gold hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
