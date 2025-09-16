import React, { createContext, useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, Product, Order } from '../types.ts';
import { useProducts } from '../hooks/useProducts.ts';
import { useOrders } from '../hooks/useOrders.ts';
import { useAuth } from './AuthContext.tsx';

interface AICopilotContextType {
  isOpen: boolean;
  toggleCopilot: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isLoading: boolean;
}

export const AICopilotContext = createContext<AICopilotContextType | undefined>(undefined);

// Per security best practices, the API key is sourced from the environment variable `process.env.API_KEY`.
// This prevents exposing sensitive credentials in the source code. The application assumes this is pre-configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        action: {
            type: Type.STRING,
            enum: ['find_products', 'get_order_status', 'general_answer'],
            description: "The intended action based on the user's query."
        },
        productIds: {
            type: Type.ARRAY,
            description: "List of product IDs relevant to the query.",
            items: { type: Type.STRING }
        },
        orderId: {
            type: Type.STRING,
            description: "The ID of a specific order the user is asking about."
        },
        answer: {
            type: Type.STRING,
            description: "A friendly, conversational response to the user."
        }
    },
    required: ['action', 'answer']
};


export const AICopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'system', text: "Welcome! I'm the whYYOuts AI. How can I help you find the perfect item or check on an order today?" }
  ]);

  const { products } = useProducts();
  const { orders } = useOrders();
  const { isAuthenticated } = useAuth();

  const toggleCopilot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    addMessage({ role: 'user', text });
    setIsLoading(true);

    // Create a summarized version of products for the prompt context
    const productContext = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.categoryId,
        price: p.price,
        description: p.description.slice(0, 100) // Keep it brief
    }));
    
    // Create order context if the user is authenticated
    const orderContext = isAuthenticated ? orders.map(o => ({
        id: o.id,
        status: o.status,
        date: o.orderDate,
        total: o.totalPrice,
        items: o.items.map(i => i.name).join(', ')
    })) : [];

    const systemInstruction = `You are the whYYOuts AI, the official assistant for whYYOuts, a premium e-commerce store. Your goal is to help users find products and answer questions about their orders. Be friendly, helpful, and concise.
    - If asked about your creator, owner, or who made you, you must state that you were created by the team at whYYOuts for its customers.
    - Use the 'find_products' action when the user wants to search for or get recommendations for products. Populate 'productIds' with the IDs of matching products from the provided context.
    - Use the 'get_order_status' action ONLY if the user asks for the status of a specific order. Populate 'orderId' with the relevant order ID from the context.
    - For all other questions or conversational chat, use the 'general_answer' action.
    - Always provide a conversational 'answer' in your response.
    - Here is the available product catalog: ${JSON.stringify(productContext)}
    - Here is the user's order history: ${JSON.stringify(orderContext)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: text,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const responseJson = JSON.parse(response.text);
        const { action, productIds, orderId, answer } = responseJson;
        
        const aiResponse: Omit<ChatMessage, 'id'> = { role: 'ai', text: answer };
        
        if (action === 'find_products' && productIds && productIds.length > 0) {
            const foundProducts = products.filter(p => productIds.includes(p.id));
            if (foundProducts.length > 0) {
                aiResponse.products = foundProducts;
            }
        } else if (action === 'get_order_status' && orderId) {
            const foundOrder = orders.find(o => o.id === orderId);
            if (foundOrder) {
                aiResponse.order = foundOrder;
            }
        }

        addMessage(aiResponse);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        addMessage({ role: 'ai', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." });
    } finally {
        setIsLoading(false);
    }
  }, [addMessage, products, orders, isAuthenticated]);

  const value = useMemo(() => ({
    isOpen,
    toggleCopilot,
    messages,
    sendMessage,
    isLoading
  }), [isOpen, toggleCopilot, messages, sendMessage, isLoading]);

  return <AICopilotContext.Provider value={value}>{children}</AICopilotContext.Provider>;
};