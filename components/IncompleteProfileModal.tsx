import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.tsx';

interface IncompleteProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    missingFields: string[];
}

const IncompleteProfileModal: React.FC<IncompleteProfileModalProps> = ({ isOpen, onClose, missingFields }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleNavigate = () => {
        onClose();
        navigate('/edit-profile');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] flex items-center justify-center p-4 print:hidden" onClick={onClose}>
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg shadow-2xl w-full max-w-md p-8 page-fade-in relative" onClick={e => e.stopPropagation()}>
                <Icon name="user" className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="font-serif text-2xl text-brand-light text-center mb-2">Complete Your Profile</h2>
                <p className="text-center text-brand-light/70 mb-6">You must complete your business and bank details before you can add products. The following fields are missing:</p>
                
                <ul className="list-disc list-inside space-y-1 my-4 pl-4 text-brand-light/90 bg-black/20 p-4 rounded-md">
                    {missingFields.map(field => <li key={field}>{field}</li>)}
                </ul>
                
                <div className="flex flex-col gap-4 mt-8">
                    <button onClick={handleNavigate} className="w-full font-sans text-sm tracking-widest px-8 py-3 border border-brand-gold bg-brand-gold text-brand-dark hover:bg-brand-gold-dark transition-colors duration-300 uppercase">
                        Go to Edit Profile
                    </button>
                    <button onClick={onClose} className="text-sm text-brand-light/60 hover:text-white">Cancel</button>
                </div>
            </div>
        </div>
    );
};
export default IncompleteProfileModal;
