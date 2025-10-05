import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabase.ts';
import { useAuth } from './AuthContext.tsx';
import type { LiveChatSession, LiveChatMessage } from '../types.ts';

interface ChatContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: LiveChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  loading: boolean;
  hasUnread: boolean;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<LiveChatSession | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const chatChannelRef = useRef<any>(null);

  const findOrCreateSession = useCallback(async () => {
    if (!user) return null;
    setLoading(true);

    // Check for an existing open session
    const { data: existingSession } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .single();
    
    if (existingSession) {
        setSession(existingSession as LiveChatSession);
        setLoading(false);
        return existingSession;
    }

    // Create a new session if none exists
    const { data: newSession, error } = await supabase
        .from('live_chat_sessions')
        .insert({ user_id: user.id })
        .select()
        .single();
    
    if (error) {
        console.error("Error creating chat session:", error);
        setLoading(false);
        return null;
    }

    setSession(newSession as LiveChatSession);
    setLoading(false);
    return newSession;

  }, [user]);

  // Fetch messages for the current session
  useEffect(() => {
    const fetchMessages = async () => {
      if (session) {
        setLoading(true);
        const { data } = await supabase
          .from('live_chat_messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });
        
        setMessages(data || []);
        setLoading(false);
      } else {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [session]);
  
  // Real-time message listener
  useEffect(() => {
    if (session) {
      // Unsubscribe from any previous channel
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }

      chatChannelRef.current = supabase
        .channel(`live-chat-${session.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `session_id=eq.${session.id}` },
          (payload) => {
            const newMessage = payload.new as LiveChatMessage;
            setMessages(prev => [...prev, newMessage]);
            if (!isOpen && newMessage.sender_role === 'agent') {
              setHasUnread(true);
            }
          }
        )
        .subscribe();
    }
    
    return () => {
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }
    };
  }, [session, isOpen]);
  
  const toggleChat = async () => {
    if (!isAuthenticated) {
        // Redirect or show login message for guests
        alert("Please log in to use the live chat.");
        return;
    }
    setIsOpen(prev => {
      const newIsOpen = !prev;
      if (newIsOpen) {
        setHasUnread(false);
        if (!session) {
          findOrCreateSession();
        }
      }
      return newIsOpen;
    });
  };
  
  const sendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    let currentSession = session;
    if (!currentSession) {
        currentSession = await findOrCreateSession();
    }

    if (currentSession) {
        const messageData = {
            session_id: currentSession.id,
            sender_id: user.id,
            sender_role: 'user' as const,
            message_text: text,
        };
        const { error } = await supabase.from('live_chat_messages').insert(messageData);

        if (error) {
            console.error("Error sending message:", error);
        } else {
            // Simulate an agent reply
            setTimeout(async () => {
                const agentMessage = {
                    session_id: currentSession!.id,
                    sender_role: 'agent' as const,
                    message_text: "Thank you for your message. An agent will be with you shortly. For now, I'm just an echo bot!",
                };
                await supabase.from('live_chat_messages').insert(agentMessage);
            }, 2000);
        }
    }
  };

  const value = useMemo(() => ({
    isOpen,
    toggleChat,
    messages,
    sendMessage,
    loading,
    hasUnread,
  }), [isOpen, toggleChat, messages, sendMessage, loading, hasUnread]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
