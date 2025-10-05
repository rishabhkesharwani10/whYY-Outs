import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAICopilot } from '../hooks/useAICopilot.ts';
import Icon from './Icon.tsx';
import StarRating from './StarRating.tsx';
import type { Product } from '../types.ts';

const ProductMessageCard: React.FC<{ product: Product }> = ({ product }) => (
  <Link
    to={`/product/${product.id}`}
    className="block group bg-brand-dark/50 border border-brand-gold/30 rounded-lg shadow-md overflow-hidden hover:border-brand-gold/60 transition-all duration-300 w-full max-w-xs"
  >
    <div className="relative">
      <img src={product.image} alt={product.name} className="w-full h-24 object-cover" />
    </div>
    <div className="p-3">
      <h3 className="text-sm font-semibold text-brand-light truncate group-hover:text-brand-gold-light">{product.name}</h3>
      <div className="flex items-baseline mt-1">
        <p className="text-md font-bold text-brand-light">₹{product.price.toFixed(2)}</p>
        {product.originalPrice && (
          <p className="text-xs text-brand-light/60 line-through ml-2">₹{product.originalPrice.toFixed(2)}</p>
        )}
      </div>
      <div className="flex items-center mt-1">
        <StarRating rating={product.rating} className="w-3 h-3" />
        <span className="text-xs text-brand-light/70 ml-1.5">({product.reviewCount})</span>
      </div>
    </div>
  </Link>
);


const AICopilotModal: React.FC = () => {
  const { isOpen, toggleCopilot, messages, sendMessage, isLoading, clearChat } = useAICopilot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };
  
  const suggestedPrompts = [
    "Show me red dresses under ₹5000",
    "What's the status of my last order?",
    "Recommend a gift for my friend"
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={toggleCopilot}
        aria-hidden="true"
      ></div>
      <div
        className="fixed bottom-0 right-0 md:bottom-8 md:right-28 h-[85vh] md:h-[70vh] w-full md:w-[400px] bg-brand-dark border-t-2 md:border-2 border-brand-gold/30 rounded-t-2xl md:rounded-2xl shadow-2xl shadow-brand-gold/20 flex flex-col z-50 transform-gpu transition-transform duration-300 page-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-copilot-title"
      >
        <header className="flex items-center justify-between p-4 border-b border-brand-gold/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Icon name="sparkles" className="w-6 h-6 text-brand-gold" />
            <h2 id="ai-copilot-title" className="font-serif text-2xl text-brand-light">whYYOuts AI</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
                onClick={clearChat}
                className="p-1 text-brand-light/70 hover:text-white transition-colors"
                aria-label="Clear chat history"
              >
                <Icon name="refresh" className="w-5 h-5"/>
              </button>
            <button
              onClick={toggleCopilot}
              className="p-1 text-brand-light/70 hover:text-white transition-colors"
              aria-label="Close whYYOuts AI"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        <div className="flex-grow p-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
              >
                {msg.role === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center"><Icon name="sparkles" className="w-5 h-5 text-brand-gold"/></div>}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-brand-gold text-brand-dark rounded-br-none' : 'bg-black/30 text-brand-light rounded-bl-none'}`}
                >
                  {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                  {msg.products && (
                    <div className="flex flex-col gap-2 mt-2">
                      {msg.products.map(p => <ProductMessageCard key={p.id} product={p} />)}
                    </div>
                  )}
                  {msg.order && (
                     <div className="mt-2 text-sm">
                        <p>Order #{msg.order.id.substring(0,8)} is currently <strong>{msg.order.status}</strong>.</p>
                        <Link to={`/order/${msg.order.id}`} className="text-brand-gold hover:underline font-semibold mt-1 inline-block">View Details</Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="self-start flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center"><Icon name="sparkles" className="w-5 h-5 text-brand-gold"/></div>
                <div className="rounded-2xl px-4 py-3 bg-black/30 rounded-bl-none">
                   <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                       <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                       <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse"></div>
                   </div>
                </div>
              </div>
            )}
             {messages.length === 1 && (
                <div className="self-start">
                    <div className="flex flex-col gap-2 mt-4 items-start">
                        {suggestedPrompts.map(prompt => (
                            <button key={prompt} onClick={() => sendMessage(prompt)} className="text-left text-sm text-brand-gold border border-brand-gold/40 px-3 py-1.5 rounded-full hover:bg-brand-gold/10 transition-colors">
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-brand-gold/20 flex-shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="w-full bg-black/50 border border-brand-gold/30 rounded-full py-2.5 pl-5 pr-12 text-brand-light placeholder-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all disabled:opacity-50"
              aria-label="Chat message input"
            />
            <button type="submit" disabled={isLoading} className="bg-brand-gold text-brand-dark p-2.5 rounded-full hover:bg-brand-gold-dark transition-colors disabled:opacity-50" aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AICopilotModal;