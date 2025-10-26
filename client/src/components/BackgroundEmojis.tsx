import React from 'react';

const EMOJIS = ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫', '🍖', '🍗', '🥩', '🍠', '🥟', '🍤', '🍚', '🍙', '🍘', '🍥', '🍜', '🍝', '🍣', '🍱', '🍛', '🍲', '🥣', '🫕', '🍦', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍮', '🍭', '🍬', '🍫', '🍿', '🥜', '🍽️'];

const EMOJI_COUNT = 30;

/**
 * Background animated emojis component
 * Renders floating food emojis with random positions and animations
 */
const BackgroundEmojis: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
            {Array.from({ length: EMOJI_COUNT }).map((_, i) => {
                const style = {
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 1.5 + 0.5}rem`,
                    animationDuration: `${Math.random() * 15 + 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.3 + 0.1,
                };
                const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

                return (
                    <span
                        key={i}
                        className="absolute animate-fly" // Apply animation class
                        style={style}
                    >
                        {emoji}
                    </span>
                );
            })}
        </div>
    );
};

export default BackgroundEmojis;