import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';

const PrivacyPolicyPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Privacy Policy" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">This privacy policy applies to the whYYOuts app (hereby referred to as "Application") that was created by the whYYOuts team (hereby referred to as "Service Provider") as a premium e-commerce service. This service is intended for use "AS IS".</p>
            
            <H2>Information Collection and Use</H2>
            <p className="text-brand-light/90 leading-relaxed">The Application collects information when you register and use it. This information may include personally identifiable information such as your name, email address, and shipping details, as well as automatically collected information like:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li>Your device's Internet Protocol address (e.g. IP address)</li>
                <li>The pages of the Application that you visit, the time and date of your visit, and the time spent on those pages</li>
                <li>The operating system you use on your device</li>
            </ul>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.</p>
            <p className="text-brand-light/90 leading-relaxed">For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information, including but not limited to your name, email, and phone number. The information that the Service Provider requests will be retained by them and used as described in this privacy policy.</p>

            <H2>Third Party Access</H2>
            <p className="text-brand-light/90 leading-relaxed">Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.</p>
            <p className="text-brand-light/90 leading-relaxed">Please note that the Application utilizes third-party services that have their own Privacy Policy about handling data. Below are the links to the Privacy Policy of the third-party service providers used by the Application:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li><a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Google Services</a></li>
                <li><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Supabase</a></li>
            </ul>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider may disclose User Provided and Automatically Collected Information:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
                <li>when they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</li>
                <li>with their trusted services providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.</li>
            </ul>

            <H2>Opt-Out Rights</H2>
            <p className="text-brand-light/90 leading-relaxed">You can stop all collection of information by the Application easily by deleting your account from your profile page. You can also request data deletion by contacting us.</p>

            <H2>Data Retention Policy</H2>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like us to delete User Provided Data that you have provided via the Application, please contact them at support@whyyouts.com and we will respond in a reasonable time.</p>
            
            <H2>Children's Privacy</H2>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13. The Application does not address anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact the Service Provider (support@whyyouts.com) so that we will be able to take the necessary actions.</p>

            <H2>Security</H2>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider is concerned about safeguarding the confidentiality of your information. We provide physical, electronic, and procedural safeguards to protect information we process and maintain.</p>
            
            <H2>Changes</H2>
            <p className="text-brand-light/90 leading-relaxed">This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page and, if the changes are significant, through a banner on our website. You are advised to consult this Privacy Policy regularly for any changes.</p>
            
            <H2>Your Consent</H2>
            <p className="text-brand-light/90 leading-relaxed">By using the Application, you are consenting to our processing of your information as set forth in this Privacy Policy now and as amended by us.</p>
            
            <H2>Contact Us</H2>
            <p className="text-brand-light/90 leading-relaxed">If you have any questions regarding privacy while using the Application, or have questions about our practices, please contact the Service Provider via email at support@whyyouts.com.</p>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;