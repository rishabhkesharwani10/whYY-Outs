
import React, { useState, useEffect, useRef } from 'react';
import { useStories } from '../hooks/useStories.ts';
import Icon from './Icon.tsx';

const StoryViewer: React.FC = () => {
    const { stories, activeStoryIndex, closeStoryViewer, goToNextStory, goToPrevStory } = useStories();
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const activeStory = stories[activeStoryIndex];

    useEffect(() => {
        if (!activeStory) return;

        setProgress(0);
        if (timerRef.current) clearTimeout(timerRef.current);

        if (activeStory.media_type === 'image') {
            const duration = (activeStory.duration_seconds || 7) * 1000;
            const startTime = Date.now();
            let frameId: number;

            const animateProgress = () => {
                const elapsedTime = Date.now() - startTime;
                const newProgress = (elapsedTime / duration) * 100;

                if (newProgress >= 100) {
                    goToNextStory();
                } else {
                    setProgress(newProgress);
                    frameId = requestAnimationFrame(animateProgress);
                }
            };

            frameId = requestAnimationFrame(animateProgress);

            return () => cancelAnimationFrame(frameId);
        }
        // Video progress is handled by the video element's events
    }, [activeStory, activeStoryIndex, goToNextStory]);

    const handleVideoTimeUpdate = () => {
        if (videoRef.current) {
            const { currentTime, duration } = videoRef.current;
            if (duration) {
                setProgress((currentTime / duration) * 100);
            }
        }
    };
    
    const handleVideoEnded = () => {
        goToNextStory();
    };

    if (!activeStory) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center page-fade-in" role="dialog" aria-modal="true">
            <div className="relative w-full h-full max-w-md max-h-[95vh] aspect-[9/16] bg-brand-dark rounded-lg overflow-hidden flex flex-col shadow-2xl shadow-brand-gold/20">
                {/* Progress Bars */}
                <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                    {stories.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white"
                                style={{ width: `${index === activeStoryIndex ? progress : (index < activeStoryIndex ? 100 : 0)}%` }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                 <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Icon name="logo" className="w-24 h-8"/>
                    </div>
                    <button onClick={closeStoryViewer} className="p-2 text-white" aria-label="Close stories">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {/* Media */}
                <div className="absolute inset-0">
                    {activeStory.media_type === 'image' ? (
                        <img src={activeStory.media_url} alt={activeStory.title} className="w-full h-full object-cover" />
                    ) : (
                        <video
                            ref={videoRef}
                            src={activeStory.media_url}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                        />
                    )}
                </div>

                {/* Navigation Overlays */}
                <div className="absolute left-0 top-0 h-full w-1/3 z-30" onClick={goToPrevStory} />
                <div className="absolute right-0 top-0 h-full w-2/3 z-30" onClick={goToNextStory} />
                
                {/* Footer/Title */}
                {activeStory.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent z-20">
                        <p className="text-white font-semibold text-lg">{activeStory.title}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryViewer;
