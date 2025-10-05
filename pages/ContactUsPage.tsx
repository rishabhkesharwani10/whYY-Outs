

import React, { useState, useEffect } from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';
import Icon from '../components/Icon.tsx';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase.ts';
import { useAuth } from '../context/AuthContext.tsx';

const ContactUsPage: React.FC = () => {
    const { user } = useAuth();
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.fullName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const H2: React.FC<{ title: string, className?: string }> = ({ title, className }) => (
        <h2 className={`font-serif text-2xl text-brand-gold mt-6 mb-3 ${className}`}>{title}</h2>
    );

    const ContactInfo: React.FC<{ icon: any, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
        <div className="flex items-start gap-4">
            <Icon name={icon} className="w-6 h-6 text-brand-gold flex-shrink-0 mt-1" />
            <div>
                <h3 className="font-semibold text-brand-light">{title}</h3>
                <div className="text-brand-light/80">{children}</div>
            </div>
        </div>
    );
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormMessage(null);
        setIsSubmitting(true);

        const submissionData: { name: string; email: string; subject: string; message: string; user_id?: string; } = {
            name, email, subject, message
        };

        if (user) {
            submissionData.user_id = user.id;
        }

        const { error } = await supabase.from('contact_messages').insert(submissionData);
        
        setIsSubmitting(false);

        if (error) {
            setFormMessage({ type: 'error', text: 'Failed to send message. Please try again.' });
            console.error('Contact form submission error:', error);
        } else {
            setFormMessage({ type: 'success', text: 'Thank you! Your message has been sent.' });
            if (!user) { // Only clear form for guests
              setName('');
              setEmail('');
            }
            setSubject('');
            setMessage('');
        }
    };

    const formInputClass = "mt-2 block w-full bg-black/40 border border-brand-gold/30 rounded-md py-2 px-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all";
    const formLabelClass = "block text-sm font-medium text-brand-gold tracking-wider uppercase";

    return (
        <LegalPageLayout title="Contact Us">
            <p className="text-brand-light/90 leading-relaxed text-center">We're here to help and answer any question you might have. We look forward to hearing from you.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mt-12">
                <div className="md:col-span-2 space-y-8">
                    <H2 title="Get in Touch" className="mt-0" />
                    <ContactInfo icon="user" title="Customer Support">
                        <a href="mailto:support@whyyouts.com" className="hover:underline">support@whyyouts.com</a>
                        <p className="text-sm">For all order and product related questions.</p>
                    </ContactInfo>
                    <ContactInfo icon="wallet" title="Business & Admin">
                        <a href="mailto:admin@whyyouts.com" className="hover:underline">admin@whyyouts.com</a>
                        <p className="text-sm">For partnerships and administrative inquiries.</p>
                    </ContactInfo>
                     <ContactInfo icon="map-pin" title="Mailing Address">
                        <p>whYYOuts HQ<br/>123 Innovation Drive<br/>Tech City, TC 54321, India</p>
                    </ContactInfo>
                    <ContactInfo icon="book-open" title="Business Hours">
                        <p>Monday - Friday: 9am - 6pm IST<br/>Saturday: 10am - 4pm IST</p>
                    </ContactInfo>
                </div>

                <div className="md:col-span-3">
                    <H2 title="Send us a Message" className="mt-0" />
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className={formLabelClass}>Full Name</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={formInputClass} />
                            </div>
                            <div>
                                <label htmlFor="email" className={formLabelClass}>Email Address</label>
                                <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={formInputClass} />
                            </div>
                        </div>
                        <div>
                           <label htmlFor="subject" className={formLabelClass}>Subject</label>
                           <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className={formInputClass} />
                        </div>
                        <div>
                            <label htmlFor="message" className={formLabelClass}>Message</label>
                            <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={5} className={formInputClass}></textarea>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-dark transition-colors duration-300 uppercase flex justify-center items-center disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>
                                    <span>Sending...</span>
                                </>
                            ) : (
                                'Submit Message'
                            )}
                        </button>
                        {formMessage && (
                            <p className={`text-center text-sm mt-4 ${formMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {formMessage.text}
                            </p>
                        )}
                    </form>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-brand-gold/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <H2 title="Our Location" />
                        <p className="text-brand-light/80 mb-4">Visit our headquarters or send us mail. We're located in the heart of Tech City.</p>
                        <div className="flex space-x-6 mt-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Instagram</a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Facebook</a>
                            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="text-brand-light/60 hover:text-white transition-colors duration-300">Pinterest</a>
                        </div>
                    </div>
                    <div className="aspect-video bg-black/40 rounded-lg overflow-hidden border border-brand-gold/20">
                         <img src="https://picsum.photos/seed/map/600/400" alt="Map showing office location" className="w-full h-full object-cover opacity-70"/>
                    </div>
                </div>
            </div>

        </LegalPageLayout>
    );
};

export default ContactUsPage;
