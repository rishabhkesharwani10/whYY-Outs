
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendPasswordResetEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error: resetError } = await sendPasswordResetEmail(email);

    if (resetError) {
      setError(resetError.message || 'Failed to send reset email.');
    } else {
      setMessage('If an account with this email exists, a password reset link has been sent.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header showSearch={false} />
      <main className="flex-grow flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-brand-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
            <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
              Reset Password
            </h1>
            <p className="text-center text-brand-light/70 mb-8">
              Enter your email to receive a password reset link.
            </p>

            {message ? (
              <div className="text-center text-green-400 bg-green-500/10 p-4 rounded-md">
                <p>{message}</p>
                <Link to="/login" className="font-medium text-brand-gold hover:underline mt-4 inline-block">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-brand-light/70">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-brand-gold hover:underline">
                  Login
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

export default ForgotPasswordPage;