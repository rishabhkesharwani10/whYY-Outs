
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Story } from '../types.ts';
import { supabase } from '../supabase.ts';

interface StoryContextType {
  stories: Story[];
  loading: boolean;
  isViewerOpen: boolean;
  activeStoryIndex: number;
  openStoryViewer: (index: number) => void;
  closeStoryViewer: () => void;
  goToNextStory: () => void;
  goToPrevStory: () => void;
}

export const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    const fetchStories = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15); // Fetch latest 15 stories

        if (error) {
            console.error("Error fetching stories:", error);
        } else if (data) {
            setStories(data as Story[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStories();

        const channel = supabase
            .channel('stories-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'stories' },
                () => {
                    fetchStories();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchStories]);

    const openStoryViewer = useCallback((index: number) => {
        setActiveStoryIndex(index);
        setIsViewerOpen(true);
    }, []);

    const closeStoryViewer = useCallback(() => {
        setIsViewerOpen(false);
    }, []);

    const goToNextStory = useCallback(() => {
        setActiveStoryIndex(prev => {
            if (prev < stories.length - 1) {
                return prev + 1;
            }
            closeStoryViewer();
            return prev;
        });
    }, [stories.length, closeStoryViewer]);

    const goToPrevStory = useCallback(() => {
        setActiveStoryIndex(prev => Math.max(0, prev - 1));
    }, []);
    
    const value = useMemo(() => ({
        stories,
        loading,
        isViewerOpen,
        activeStoryIndex,
        openStoryViewer,
        closeStoryViewer,
        goToNextStory,
        goToPrevStory,
    }), [stories, loading, isViewerOpen, activeStoryIndex, openStoryViewer, closeStoryViewer, goToNextStory, goToPrevStory]);

    return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};
