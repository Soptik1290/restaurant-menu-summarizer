import React from 'react';

// Define the emojis we want to use
const EMOJIS = ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🫔', '🥫', '🍖', '🍗', '🥩', '🍠', '🥟', '🍤', '🍚', '🍙', '🍘', '🍥', '🍜', '🍝', '🍣', '🍱', '🍛', '🍲', '🥣', '🫕', '🍦', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍮', '🍭', '🍬', '🍫', '🍿', '🥜', '🍽️'];

// Number of emojis to render
const EMOJI_COUNT = 30;

const BackgroundEmojis: React.FC = () => {
    return (
        // Container for the emojis, fixed to cover the screen, behind everything else
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Generate multiple emoji elements */}
            {Array.from({ length: EMOJI_COUNT }).map((_, i) => {
                // Generate random properties for each emoji
                const style = {
                    // Random position (top/left) across the screen
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    // Random initial size
                    fontSize: `${Math.random() * 1.5 + 0.5}rem`, // Size between 0.5rem and 2rem
                    // Random animation duration
                    animationDuration: `${Math.random() * 15 + 10}s`, // Duration between 15s and 35s
                    // Random animation delay to stagger start times
                    animationDelay: `${Math.random() * 5}s`,
                    // Random opacity
                    opacity: Math.random() * 0.3 + 0.1, // Opacity between 0.1 and 0.4
                };
                // Select a random emoji from the list
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