
import React from 'react';
import { useStories } from '../hooks/useStories.ts';

const StoryReel: React.FC = () => {
    const { stories, loading, openStoryViewer } = useStories();

    if (loading || stories.length === 0) {
        return null; // Don't show the reel if loading or empty
    }

    return (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 page-fade-in">
            <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                {stories.map((story, index) => (
                    <button
                        key={story.id}
                        onClick={() => openStoryViewer(index)}
                        className="flex-shrink-0 flex flex-col items-center justify-start space-y-2 w-20 text-center group"
                    >
                        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-brand-gold to-brand-gold-dark group-hover:scale-105 transition-transform">
                            <div className="bg-brand-dark p-0.5 rounded-full h-full w-full">
                                <img
                                    src={story.media_type === 'image' ? story.media_url : 'https://picsum.photos/seed/video-icon/200'}
                                    alt={story.title}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                        </div>
                        <span className="text-xs text-brand-light/80 group-hover:text-white transition-colors truncate w-full">{story.title || 'Story'}</span>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default StoryReel;
