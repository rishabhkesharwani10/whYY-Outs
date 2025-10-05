import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';

const ReturnPolicyPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Cancellation, Return & Refund Policy" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">At whYYOuts, we are committed to ensuring your satisfaction with every purchase. This policy outlines the procedures for cancellations, returns, and refunds.</p>
            
            <H2>Order Cancellation</H2>
            <p className="text-brand-light/90 leading-relaxed">You may cancel your order at any time before it has been processed for shipping. To cancel an order:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li>Navigate to your "Order History" page.</li>
                <li>Find the order you wish to cancel.</li>
                <li>If the order status is "Processing", you will see a "Cancel Order" button.</li>
            </ul>
            <p className="text-brand-light/90 leading-relaxed">Once an order has been shipped, it cannot be canceled. In such cases, you may return the item in accordance with our return policy below. If you paid online, the amount will be refunded to your original payment method within 5-7 business days.</p>

            <H2>Returns Eligibility</H2>
            <p className="text-brand-light/90 leading-relaxed">You have 14 calendar days to return an item from the date you received it. To be eligible for a return, your item must be:</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li>Unused and in the same condition that you received it.</li>
                <li>In its original packaging with all tags and labels attached.</li>
                <li>Accompanied by a receipt or proof of purchase.</li>
            </ul>
            <p className="text-brand-light/90 leading-relaxed">Please note that certain items are not eligible for return, including perishable goods, intimate or sanitary goods, hazardous materials, and gift cards.</p>

            <H2>Return Process</H2>
            <p className="text-brand-light/90 leading-relaxed">To initiate a return, please visit your Order Details page and select the "Request Return" option for the eligible item. Our team will review your request. Once your return is approved, you will receive instructions on how to ship the item back to the seller.</p>
            
            <H2>Refunds</H2>
            <p className="text-brand-light/90 leading-relaxed">Once the seller receives your item, they will inspect it and notify you that they have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.</p>
            <p className="text-brand-light/90 leading-relaxed mt-2">If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within 5-7 business days, depending on your bank or card issuer's policies.</p>

            <H2>Shipping Costs</H2>
            <p className="text-brand-light/90 leading-relaxed">You will be responsible for paying for your own shipping costs for returning your item. Original and return shipping costs are non-refundable. If you receive a refund, the cost of return shipping may be deducted from your refund.</p>

            <H2>Contact Us</H2>
            <p className="text-brand-light/90 leading-relaxed">If you have any questions on how to return your item to us, contact us at support@whyyouts.com.</p>
        </LegalPageLayout>
    );
};

export default ReturnPolicyPage;