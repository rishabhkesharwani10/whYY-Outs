import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { supabase } from '../supabase.ts';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>`~_+\-=\[\];'\\]).{8,}$/;
    if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters and include a letter, a number, and a special character.');
        return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (updateError) {
      setError(updateError.message || 'Failed to update password.');
    } else {
      setMessage('Your password has been updated successfully! You will be redirected to login.');
      setTimeout(async () => {
        // Sign out to force re-login with the new password.
        await supabase.auth.signOut(); 
        navigate('/login');
      }, 3000);
    }
  };

  const formInputClass = "mt-2 block w-full bg-black/20 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
  const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

  return (
    <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
      <Header showSearch={false} />
      <main className="flex-grow flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-brand-dark p-8 rounded-lg border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
            <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
              Update Your Password
            </h1>
            <p className="text-center text-brand-light/70 mb-8">
              Enter and confirm your new password below.
            </p>

            {message ? (
              <div className="text-center text-green-400 bg-green-500/10 p-4 rounded-md">
                <p>{message}</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                  <label htmlFor="password" className={formLabelClass}>New Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={formInputClass}
                    placeholder="••••••••"
                  />
                   <p className="text-xs text-brand-light/60 mt-2">
                        8+ characters, with at least one letter, one number, and one special character.
                    </p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={formLabelClass}>Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={formInputClass}
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
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UpdatePasswordPage;