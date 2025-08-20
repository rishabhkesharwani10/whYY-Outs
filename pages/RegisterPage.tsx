

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import BackButton from '../components/BackButton.tsx';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/shop', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const { error: registerError } = await register(fullName, email, password, role);

    if (registerError) {
      setError(registerError.message || 'Failed to register.');
    } else {
      setRegistrationSuccess(true);
    }
  };

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="bg-brand-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
            {registrationSuccess ? (
              <div className="text-center">
                <h1 className="font-serif text-3xl text-brand-gold mb-4">Registration Successful!</h1>
                <p className="text-brand-light/90">
                  A confirmation link has been sent to your email address: <strong>{email}</strong>.
                </p>
                <p className="mt-4 text-brand-light/90">
                  Please click the link in the email to activate your account before you can log in.
                </p>
                <ReactRouterDOM.Link to="/login" className="mt-8 block w-full text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                  Back to Login
                </ReactRouterDOM.Link>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
                  Create Account
                </h1>
                <p className="text-center text-brand-light/70 mb-8">
                  Join the whYYOuts family.
                </p>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="flex justify-around pb-4 border-b border-brand-gold/20">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="role" value="customer" checked={role === 'customer'} onChange={() => setRole('customer')} className="form-radio bg-black/20 border-brand-gold/50 text-brand-gold focus:ring-brand-gold"/>
                        <span className="text-brand-light uppercase text-sm tracking-widest">I'm a Customer</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className="form-radio bg-black/20 border-brand-gold/50 text-brand-gold focus:ring-brand-gold"/>
                        <span className="text-brand-light uppercase text-sm tracking-widest">I'm a Seller</span>
                    </label>
                  </div>

                  <div>
                    <label 
                      htmlFor="fullName" 
                      className="block text-sm font-medium text-brand-gold tracking-wider uppercase"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all"
                      placeholder="John Doe"
                    />
                  </div>

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
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-medium text-brand-gold tracking-wider uppercase"
                    >
                      Password
                    </label>
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

                   <div>
                    <label 
                      htmlFor="confirmPassword" 
                      className="block text-sm font-medium text-brand-gold tracking-wider uppercase"
                    >
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Register
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-brand-light/70">
                    Already have an account?{' '}
                    <ReactRouterDOM.Link to="/login" className="font-medium text-brand-gold hover:underline">
                      Login
                    </ReactRouterDOM.Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;