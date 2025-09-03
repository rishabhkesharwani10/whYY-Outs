
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

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
    
    const { error: loginError } = await login(email, password);
    
    if (loginError) {
      setError(loginError.message || 'Invalid email or password.');
    } else {
      // The useEffect hook will handle navigation now
    }
  };

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header showSearch={false} />

      <main className="flex-grow flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-brand-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
            <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
              Login
            </h1>
            <p className="text-center text-brand-light/70 mb-8">
              Welcome back to whYYOuts.
            </p>

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
                  <ReactRouterDOM.Link to="/forgot-password" className="text-xs text-brand-gold hover:underline">
                    Forgot Password?
                  </ReactRouterDOM.Link>
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
                  className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase"
                >
                  Login
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-light/70">
                Don't have an account?{' '}
                <ReactRouterDOM.Link to="/register" className="font-medium text-brand-gold hover:underline">
                  Register
                </ReactRouterDOM.Link>
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
