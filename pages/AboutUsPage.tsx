import React from 'react';
import LegalPageLayout from '../components/LegalPageLayout.tsx';
import Icon from '../components/Icon.tsx';

const AboutUsPage: React.FC = () => {
    const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h2 className="font-serif text-3xl text-brand-gold mt-10 mb-4">{children}</h2>
    );

    const FeatureCard: React.FC<{ icon: any; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
        <div className="bg-black/30 p-6 rounded-lg border border-brand-gold/20 h-full">
            <div className="flex items-center gap-4 mb-3">
                <Icon name={icon} className="w-8 h-8 text-brand-gold-light" />
                <h3 className="font-serif text-2xl text-brand-light">{title}</h3>
            </div>
            <p className="text-brand-light/80 leading-relaxed">{children}</p>
        </div>
    );

    return (
        <LegalPageLayout title="About whYYOuts">
            <div className="text-center">
                <p className="text-lg text-brand-light/70 mt-4 max-w-2xl mx-auto">
                    We are not just an e-commerce platform; we are the future of retail, meticulously crafted for the discerning shopper.
                </p>
            </div>

            <div className="mt-12 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <img src="https://picsum.photos/seed/future/600/700" alt="Futuristic retail concept" className="rounded-lg object-cover w-full h-full shadow-lg shadow-brand-gold/10"/>
                    <div>
                        <H2>Our Story</H2>
                        <p className="text-brand-light/90 leading-relaxed">
                            whYYOuts was born from a simple yet profound question: "Why go out?" In a world of boundless digital possibilities, we envisioned a shopping experience that transcends the traditional, bringing a hyper-personalized, premium, and effortlessly convenient retail world directly to you.
                        </p>
                        <p className="text-brand-light/90 leading-relaxed mt-4">
                            We saw a gap between the potential of technology and the reality of online shopping. We set out to bridge that gap, building an AI-first platform that doesn't just sell products, but understands you, anticipates your needs, and inspires your lifestyle.
                        </p>
                    </div>
                </div>

                <H2>Our Mission</H2>
                <p className="text-brand-light/90 leading-relaxed">
                    Our mission is to revolutionize the e-commerce landscape by integrating cutting-edge artificial intelligence with a curated selection of premium goods. We aim to provide a seamless, intuitive, and deeply personal shopping journey that feels less like a transaction and more like a conversation with a trusted style advisor.
                </p>

                <H2>What Makes Us Different</H2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <FeatureCard icon="sparkles" title="AI Co-Pilot">
                        Your personal shopping assistant. From finding the perfect outfit to tracking your orders and discovering new trends, our AI is here to help you 24/7.
                    </FeatureCard>
                    <FeatureCard icon="gem" title="Curated Excellence">
                         We don't sell everything; we sell the best of everything. Our catalog is a meticulously curated collection of high-quality products from trusted brands and artisans.
                    </FeatureCard>
                     <FeatureCard icon="offer" title="DealBrain™ Offers">
                        Experience the thrill of a great deal without the hunt. Our proprietary AI, DealBrain™, analyzes market trends to proactively offer you the best possible price on items you love.
                    </FeatureCard>
                    <FeatureCard icon="secure-payment" title="Uncompromising Quality">
                        From our platform's security to the products we offer and the customer service we provide, quality is the cornerstone of the whYYOuts experience.
                    </FeatureCard>
                </div>

            </div>
        </LegalPageLayout>
    );
};

export default AboutUsPage;