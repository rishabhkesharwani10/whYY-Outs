import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat.ts';
import Icon from './Icon.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const LiveChatWidget: React.FC = () => {
    const { isOpen, toggleChat, messages, sendMessage, loading, hasUnread } = useChat();
    const { isAuthenticated } = useAuth();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, loading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input.trim());
            setInput('');
        }
    };
    
    if (!isAuthenticated) {
        return null; // Don't show the widget for guest users
    }

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-40 right-4 md:bottom-28 md:right-8 w-16 h-16 bg-brand-dark border-2 border-brand-gold rounded-full shadow-2xl shadow-black/40 flex items-center justify-center text-brand-gold z-40 hover:scale-110 hover:bg-brand-gold hover:text-brand-dark transition-all"
                aria-label="Open live chat"
            >
                <Icon name="chat-bubble" className="w-8 h-8"/>
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 border-2 border-brand-dark"></span>
                )}
            </button>

            {isOpen && (
                 <div
                    className="fixed bottom-0 right-0 md:bottom-8 md:right-8 h-[85vh] md:h-[70vh] w-full md:w-[400px] bg-brand-dark border-t-2 md:border-2 border-brand-gold/30 rounded-t-2xl md:rounded-2xl shadow-2xl shadow-brand-gold/20 flex flex-col z-50 transform-gpu transition-transform duration-300 page-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="live-chat-title"
                >
                    <header className="flex items-center justify-between p-4 border-b border-brand-gold/20 flex-shrink-0">
                        <h2 id="live-chat-title" className="font-serif text-2xl text-brand-light flex items-center gap-3">
                            <Icon name="chat-bubble" className="w-6 h-6 text-brand-gold" />
                            Live Support
                        </h2>
                        <button
                            onClick={toggleChat}
                            className="p-1 text-brand-light/70 hover:text-white transition-colors"
                            aria-label="Close live chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>
                    <div className="flex-grow p-4 overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <p className="text-center text-brand-light/70">Loading chat...</p>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-3 max-w-[85%] ${msg.sender_role === 'user' ? 'self-end' : 'self-start'}`}
                                    >
                                        {msg.sender_role === 'agent' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center"><Icon name="user" className="w-5 h-5 text-brand-gold"/></div>}
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 ${msg.sender_role === 'user' ? 'bg-brand-gold text-brand-dark rounded-br-none' : 'bg-black/30 text-brand-light rounded-bl-none'}`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.message_text}</p>
                                        </div>
                                    </div>
                                ))
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
                                placeholder="Type a message..."
                                className="w-full bg-black/50 border border-brand-gold/30 rounded-full py-2.5 pl-5 pr-12 text-brand-light placeholder-brand-light/50 focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                                aria-label="Chat message input"
                            />
                            <button type="submit" className="bg-brand-gold text-brand-dark p-2.5 rounded-full hover:bg-brand-gold-dark transition-colors" aria-label="Send message">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default LiveChatWidget;
