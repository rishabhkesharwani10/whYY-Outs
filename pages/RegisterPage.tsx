
import React, { useState, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.tsx';
import Footer from '../components/Footer.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { supabase } from '../supabase.ts';

const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'seller'>('customer');
  const [businessName, setBusinessName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // The HomePage component will handle role-based redirection after successful login.
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (role === 'seller' && (!businessName || !panNumber || !address)) {
      setError('Business Name, PAN, and Address are required for sellers.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>`~_+\-=\[\];'\\]).{8,}$/;
    if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters and include a letter, a number, and a special character.');
        return;
    }
    
    if (role === 'seller' && panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber)) {
        setError('Please enter a valid 10-digit PAN number in the format ABCDE1234F.');
        return;
      }
    }
    
    setLoading(true);
    const { error: registerError, requiresConfirmation } = await register(fullName, email, password, role, panNumber, gstNumber, address, pincode, businessName, registrationNumber);

    if (registerError) {
      setError(registerError.message || 'Failed to register.');
      setLoading(false);
    } else {
      if (requiresConfirmation) {
        // Standard flow: show the verification message.
        setRegistrationSuccess(true);
        setLoading(false);
      } else {
        // Auto-login flow (email confirmation is disabled in Supabase settings).
        // The user is already being authenticated by the AuthProvider listener.
        // The useEffect in this component will detect the auth change and navigate to the homepage.
        // We keep `loading` true to prevent user interaction until the redirect happens.
      }
    }
  };
  
   const handleGoogleLogin = async () => {
    setError('');
    // Save the selected role to session storage before redirecting to Google
    sessionStorage.setItem('oauthRole', role);

    const redirectUrl = `${window.location.origin}/`;
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (googleError) {
      setError(googleError.message);
      // Clean up if the redirect fails
      sessionStorage.removeItem('oauthRole');
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
            {registrationSuccess ? (
              <div className="text-center">
                <h1 className="font-serif text-3xl text-brand-gold mb-4">Registration Successful!</h1>
                <p className="text-brand-light/90">
                  A confirmation link has been sent to your email address: <strong>{email}</strong>.
                </p>
                <p className="mt-4 text-brand-light/90">
                  Please click the link in the email to activate your account before you can log in.
                </p>
                <Link to="/login" className="mt-8 block w-full text-center font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase">
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-4xl text-center text-brand-light mb-2">
                  Create Account
                </h1>
                <p className="text-center text-brand-light/70 mb-8">
                  Join the whYYOuts family.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={role === 'seller'}
                    className="w-full flex justify-center items-center gap-3 font-sans text-sm tracking-widest px-8 py-3 border border-brand-light/30 text-brand-light/90 hover:bg-brand-light/10 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    Sign up with Google
                  </button>
                  {role === 'seller' && (
                    <p className="text-xs text-center text-brand-light/60">
                      Seller accounts require additional business details. Please register using email and password.
                    </p>
                  )}
                </div>

                <div className="my-6 flex items-center">
                  <div className="flex-grow border-t border-brand-gold/20"></div>
                  <span className="flex-shrink mx-4 text-xs text-brand-light/50 uppercase">Or register with email</span>
                  <div className="flex-grow border-t border-brand-gold/20"></div>
                </div>

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
                    <label htmlFor="fullName" className={formLabelClass}>Full Name</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={formInputClass} placeholder="John Doe"/>
                  </div>

                  <div>
                    <label htmlFor="email" className={formLabelClass}>Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={formInputClass} placeholder="you@example.com"/>
                  </div>

                  <div>
                    <label htmlFor="password" className={formLabelClass}>Password</label>
                    <input 
                      type="password" 
                      id="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className={formInputClass} 
                      placeholder="••••••••"
                      pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?&quot;:{}|&lt;&gt;`~_+\-=\[\];'\\]).{8,}$"
                      title="Password must be at least 8 characters long and contain at least one letter, one number, and one special character."
                    />
                    <p className="text-xs text-brand-light/60 mt-2">
                        8+ characters, with at least one letter, one number, and one special character.
                    </p>
                  </div>

                   <div>
                    <label htmlFor="confirmPassword" className={formLabelClass}>Confirm Password</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={formInputClass} placeholder="••••••••"/>
                  </div>

                  {role === 'seller' && (
                    <>
                      <div>
                        <label htmlFor="businessName" className={formLabelClass}>Business Name</label>
                        <input type="text" id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required className={formInputClass} placeholder="My Awesome Store"/>
                      </div>
                      <div>
                        <label htmlFor="panNumber" className={formLabelClass}>PAN Number</label>
                        <input
                          type="text"
                          id="panNumber"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                          required
                          className={formInputClass}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                          title="PAN must be in the format ABCDE1234F"
                        />
                      </div>
                      <div>
                        <label htmlFor="gstNumber" className={formLabelClass}>GST Number (Optional)</label>
                        <input type="text" id="gstNumber" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={formInputClass} placeholder="22ABCDE1234F1Z5"/>
                      </div>
                       <div>
                        <label htmlFor="registrationNumber" className={formLabelClass}>Business Reg. No. (Optional)</label>
                        <input type="text" id="registrationNumber" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className={formInputClass} placeholder="U74999DL2015PTC286426"/>
                      </div>
                       <div>
                        <label htmlFor="address" className={formLabelClass}>Business Address</label>
                        <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className={formInputClass} placeholder="123 Business Rd"/>
                      </div>
                      <div>
                        <label htmlFor="pincode" className={formLabelClass}>Pincode / ZIP (Optional)</label>
                        <input type="text" id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className={formInputClass} placeholder="12345"/>
                      </div>
                    </>
                  )}
                  
                  <div className="text-center text-xs text-brand-light/60">
                    <p>
                      By creating an account, you agree to our{' '}
                      <Link to="/terms-of-use" className="font-medium text-brand-gold hover:underline">
                        Terms of Use
                      </Link>
                      {' and '}
                      <Link to="/privacy-policy" className="font-medium text-brand-gold hover:underline">
                        Privacy Policy
                      </Link>.
                    </p>
                  </div>

                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                  <div>
                    <button type="submit" disabled={loading} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase flex justify-center items-center disabled:opacity-50">
                      {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>
                            <span>Registering...</span>
                          </>
                        ) : (
                          'Register'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-brand-light/70">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-brand-gold hover:underline">
                      Login
                    </Link>
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

export default memo(RegisterPage);