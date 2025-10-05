import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';

const TermsOfUsePage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Terms & Conditions" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">These terms and conditions apply to the whYYOuts app (hereby referred to as "Application") that was created by the whYYOuts team (hereby referred to as "Service Provider") as a premium e-commerce service.</p>
            <p className="text-brand-light/90 leading-relaxed mt-4">Upon downloading or utilizing the Application, you are automatically agreeing to the following terms. It is strongly advised that you thoroughly read and understand these terms prior to using the Application. Unauthorized copying, modification of the Application, any part of the Application, or our trademarks is strictly prohibited. Any attempts to extract the source code of the Application, translate the Application into other languages, or create derivative versions are not permitted. All trademarks, copyrights, database rights, and other intellectual property rights related to the Application remain the property of the Service Provider.</p>
            
            <p className="text-brand-light/90 leading-relaxed mt-4">The Service Provider is dedicated to ensuring that the Application is as beneficial and efficient as possible. As such, they reserve the right to modify the Application or charge for their services at any time and for any reason. The Service Provider assures you that any charges for the Application or its services will be clearly communicated to you.</p>
            
            <p className="text-brand-light/90 leading-relaxed mt-4">The Application stores and processes personal data that you have provided to the Service Provider in order to provide the Service. It is your responsibility to maintain the security of your phone and access to the Application. The Service Provider strongly advise against jailbreaking or rooting your phone. Such actions could expose your phone to malware, viruses, malicious programs, compromise your phone's security features, and may result in the Application not functioning correctly or at all.</p>

            <p className="text-brand-light/90 leading-relaxed mt-4">Please note that the Application utilizes third-party services that have their own Terms and Conditions. Below are the links to the Terms and Conditions of the third-party service providers used by the Application:</p>
             <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li><a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Google Services</a></li>
                <li><a href="https://supabase.com/terms" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">Supabase</a></li>
            </ul>

            <p className="text-brand-light/90 leading-relaxed mt-4">Please be aware that the Service Provider does not assume responsibility for certain aspects. Some functions of the Application require an active internet connection. The Service Provider cannot be held responsible if the Application does not function at full capacity due to lack of access to Wi-Fi or if you have exhausted your data allowance.</p>

            <p className="text-brand-light/90 leading-relaxed mt-4">Similarly, the Service Provider cannot always assume responsibility for your usage of the application. For instance, it is your responsibility to ensure that your device remains charged. If your device runs out of battery and you are unable to access the Service, the Service Provider cannot be held responsible.</p>

            <p className="text-brand-light/90 leading-relaxed mt-4">In terms of the Service Provider's responsibility for your use of the application, it is important to note that while they strive to ensure that it is updated and accurate at all times, they do rely on third parties to provide information to them so that they can make it available to you. The Service Provider accepts no liability for any loss, direct or indirect, that you experience as a result of relying entirely on this functionality of the application.</p>
            
            <p className="text-brand-light/90 leading-relaxed mt-4">The Service Provider may also wish to cease providing the application and may terminate its use at any time without providing termination notice to you. Unless they inform you otherwise, upon any termination, (a) the rights and licenses granted to you in these terms will end; (b) you must cease using the application, and (if necessary) delete it from your device.</p>

            <H2>Pricing Policy</H2>
            <p className="text-brand-light/90 leading-relaxed">All prices for products are listed on their respective product pages. Prices are displayed in Indian Rupees (INR). We strive to ensure all pricing information is accurate, but errors may occasionally occur. If we discover an error in the price of any goods which you have ordered, we will inform you of this as soon as possible and give you the option of reconfirming your order at the correct price or cancelling it.</p>
            <p className="text-brand-light/90 leading-relaxed mt-4">All prices are inclusive of taxes unless specified otherwise. The final price, including all taxes and fees (such as GST, platform fees, and shipping), will be displayed on the checkout page before you complete your purchase.</p>
            <p className="text-brand-light/90 leading-relaxed mt-4">Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.</p>

            <H2>Changes to These Terms and Conditions</H2>
            <p className="text-brand-light/90 leading-relaxed">The Service Provider may periodically update their Terms and Conditions. Therefore, you are advised to review this page regularly for any changes. The Service Provider will notify you of any changes by posting the new Terms and Conditions on this page.</p>

            <H2>Contact Us</H2>
            <p className="text-brand-light/90 leading-relaxed">If you have any questions or suggestions about the Terms and Conditions, please do not hesitate to contact the Service Provider at support@whyyouts.com.</p>
        </LegalPageLayout>
    );
};

export default TermsOfUsePage;