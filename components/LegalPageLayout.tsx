import React from 'react';
import Header from './Header.tsx';
import Footer from './Footer.tsx';
import BackButton from './BackButton.tsx';

interface LegalPageLayoutProps {
    title: string;
    lastUpdated?: string;
    children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
    return (
        <div className="bg-brand-dark text-brand-light min-h-screen flex flex-col font-sans relative page-fade-in">
            <Header showSearch={false} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="mb-8">
                    <BackButton fallback="/" />
                </div>
                <div className="max-w-4xl mx-auto bg-black/20 border border-brand-gold/20 rounded-lg shadow-lg p-8">
                    <h1 className="font-serif text-4xl text-brand-light mb-2">{title}</h1>
                    {lastUpdated && (
                        <p className="text-sm text-brand-light/70 mb-6">Last Updated: {lastUpdated}</p>
                    )}
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LegalPageLayout;
