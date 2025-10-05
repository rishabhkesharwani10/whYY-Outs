import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';

const SecurityPolicyPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Security Policy" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">whYYOuts is committed to ensuring the security of your personal and payment information. We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
            
            <H2>Data Encryption</H2>
            <p className="text-brand-light/90 leading-relaxed">All communication between your device and our servers is encrypted using Secure Socket Layer (SSL) technology. This ensures that your data, including login credentials and payment information, is transmitted securely over the internet.</p>
            
            <H2>Payment Security</H2>
            <p className="text-brand-light/90 leading-relaxed">We do not store your full credit card information on our servers. All payment transactions are processed through a gateway provider (e.g., Razorpay) and are not stored or processed on our servers. We adhere to the standards set by PCI-DSS as managed by the PCI Security Standards Council.</p>

            <H2>Account Protection</H2>
            <p className="text-brand-light/90 leading-relaxed">Your account is protected by a password for your privacy and security. We recommend using a strong, unique password. It is your responsibility to prevent unauthorized access to your account and personal information by selecting and protecting your password appropriately and limiting access to your computer or device.</p>
            
            <H2>Our Commitment</H2>
            <p className="text-brand-light/90 leading-relaxed">We are concerned about safeguarding the confidentiality of your information. We provide physical, electronic, and procedural safeguards to protect the information we process and maintain. For example, we limit access to this information to authorized employees and contractors who need to know that information in order to operate, develop or improve our Application.</p>

            <H2>Reporting Vulnerabilities</H2>
            <p className="text-brand-light/90 leading-relaxed">If you believe you have found a security vulnerability in our service, please contact us immediately at support@whyyouts.com. We will investigate all legitimate reports and do our best to quickly fix the problem.</p>
        </LegalPageLayout>
    );
};

export default SecurityPolicyPage;