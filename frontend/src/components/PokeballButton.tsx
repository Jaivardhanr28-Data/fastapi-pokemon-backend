// Import the useState hook from React
import React, { useState } from 'react';
import './PokeballButton.css';

// Define the PokeballButtonProps type
type PokeballButtonProps = {
    // isOpen indicates whether the button is open or closed
    isOpen: boolean;
    // onClick is a function to be called when the button is clicked
    onClick: () => void;
};

// Define the PokeballButton component
function PokeballButton({ isOpen, onClick }: PokeballButtonProps) {
    // Use the useState hook to create a state variable called isSpinning and a function to update that state
    const [isSpinning, setIsSpinning] = useState(false);

    // Define the handleClick function
    const handleClick = () => {
        // Trigger spin animation by setting isSpinning to true
        setIsSpinning(true);

        // Call the original onClick function (opens/closes sidebar)
        onClick();

        // Remove spinning class after animation completes
        setTimeout(() => {
            // Set isSpinning back to false after 800 milliseconds (match animation duration)
            setIsSpinning(false);
        }, 800);
    };

    // Render the button element with dynamic class names based on isOpen and isSpinning
    return (
        <button
            // Generate the class name dynamically based on isOpen and isSpinning
            className={`pokeball-button ${isOpen ? 'open' : 'closed'} ${isSpinning ? 'spinning' : ''}`}
            // Call the handleClick function when the button is clicked
            onClick={handleClick}
            // Add an aria-label attribute for accessibility purposes
            aria-label="Toggle sidebar"
        >
            {/* Render the pokeball */}
            <div className="pokeball">
                {/* Render the top part of the pokeball */}
                <div className="pokeball-top"></div>
                {/* Render the middle part of the pokeball */}
                <div className="pokeball-middle">
                    {/* Render the inner part of the pokeball */}
                    <div className="pokeball-button-inner"></div>
                </div>
                {/* Render the bottom part of the pokeball */}
                <div className="pokeball-bottom"></div>
            </div>
        </button>
    );
}

export default PokeballButton;