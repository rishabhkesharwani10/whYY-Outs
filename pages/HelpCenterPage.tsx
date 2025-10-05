import React, { useState } from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';
import Icon from '../components/Icon.tsx';
import { Link } from 'react-router-dom';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-brand-gold/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left py-4"
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-brand-light/90">{title}</span>
                <Icon name={isOpen ? 'minus' : 'plus'} className="w-5 h-5 text-brand-gold flex-shrink-0" />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                     <div className="pb-4 text-brand-light/80 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const HelpCenterPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-2xl text-brand-gold mt-6 mb-3">{children}</h2>
    );

    return (
        <LegalPageLayout title="Help Center" lastUpdated="October 17, 2024">
            <p className="text-brand-light/90 leading-relaxed">Welcome to the whYYOuts Help Center. We're here to provide you with answers to your questions and help you with our services.</p>
            
            <H2>Payments</H2>
            <p className="text-brand-light/90 leading-relaxed">We offer a variety of secure payment methods to ensure a seamless checkout experience. All transactions are encrypted for your security.</p>
            <ul className="list-disc list-inside space-y-2 my-3 pl-4 text-brand-light/90">
                <li>Credit & Debit Cards (Visa, MasterCard, American Express)</li>
                <li>Net Banking with all major banks</li>
                <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
                <li>Popular Wallets</li>
                <li>Cash on Delivery (COD) on eligible orders</li>
            </ul>

            <H2>Shipping</H2>
            <p className="text-brand-light/90 leading-relaxed">We are committed to delivering your products swiftly and safely. For detailed information on processing times, delivery estimates, and tracking, please visit our full <Link to="/shipping-policy" className="text-brand-gold hover:underline">Shipping Policy</Link>.</p>

            <H2>Cancellation & Returns</H2>
            <p className="text-brand-light/90 leading-relaxed">You can cancel an order from your "Order History" page as long as it has not yet been shipped. For returns, we have a 14-day return policy for eligible items. For detailed information, please refer to our full <Link to="/return-policy" className="text-brand-gold hover:underline">Return Policy</Link>.</p>

            <H2>Frequently Asked Questions (FAQ)</H2>
            <div className="space-y-2">
                 <AccordionItem title="How do I track my order?">
                    <p>Once your order is shipped, you'll receive an email with a tracking number and a link to the courier's website. You can also find tracking information in your <Link to="/order-history" className="text-brand-gold hover:underline">Order History</Link> page.</p>
                </AccordionItem>
                <AccordionItem title="What is your return policy?">
                    <p>We offer a 14-day return policy for most items. The item must be in its original condition, unused, with all tags attached. To initiate a return, go to your order details page. For more details, please view our full <Link to="/return-policy" className="text-brand-gold hover:underline">Return Policy</Link>.</p>
                </AccordionItem>
                <AccordionItem title="How can I change my shipping address?">
                    <p>You can change your shipping address for an order before it has been shipped by contacting our customer support. You can update your default shipping address in your <Link to="/edit-profile" className="text-brand-gold hover:underline">Profile</Link> for future orders.</p>
                </AccordionItem>
                 <AccordionItem title="What payment methods do you accept?">
                    <p>We accept a wide range of payment methods including Credit/Debit Cards, Net Banking, UPI, major wallets, and Cash on Delivery (COD) for most locations.</p>
                </AccordionItem>
            </div>

            <H2>Still need help?</H2>
            <p className="text-brand-light/90 leading-relaxed">If you can't find the answer you're looking for, please don't hesitate to <Link to="/contact-us" className="text-brand-gold hover:underline">Contact Us</Link>. Our support team will be happy to assist you.</p>
        </LegalPageLayout>
    );
};

export default HelpCenterPage;