import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';

const ShippingPolicyPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Shipping Policy" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">Thank you for visiting and shopping at whYYOuts. The following are the terms and conditions that constitute our Shipping Policy.</p>
            
            <H2>Shipment Processing Time</H2>
            <p className="text-brand-light/90 leading-relaxed">All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p>
            <p className="text-brand-light/90 leading-relaxed mt-2">If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in the shipment of your order, we will contact you via email or telephone.</p>

            <H2>Shipping Rates &amp; Delivery Estimates</H2>
            <p className="text-brand-light/90 leading-relaxed">Shipping charges for your order will be calculated and displayed at checkout. Please note that shipping charges are non-refundable.</p>
            <p className="text-brand-light/90 leading-relaxed mt-2">Our standard delivery estimates are:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li><strong>Metro Cities:</strong> 2-4 business days</li>
                <li><strong>Other Locations in India:</strong> 5-8 business days</li>
                <li><strong>International Shipping:</strong> Currently, we do not ship outside of India.</li>
            </ul>
            <p className="text-brand-light/90 leading-relaxed">Delivery delays can occasionally occur.</p>

            <H2>Shipment Confirmation &amp; Order Tracking</H2>
            <p className="text-brand-light/90 leading-relaxed">You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.</p>

            <H2>Customs, Duties, and Taxes</H2>
            <p className="text-brand-light/90 leading-relaxed">whYYOuts is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).</p>

            <H2>Damages</H2>
            <p className="text-brand-light/90 leading-relaxed">whYYOuts is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.</p>

             <H2>Contact Us</H2>
            <p className="text-brand-light/90 leading-relaxed">If you have any questions about our Shipping Policy, please contact us at support@whyyouts.com.</p>
        </LegalPageLayout>
    );
};

export default ShippingPolicyPage;