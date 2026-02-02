import { useState } from 'react';
import './PokeballButton.css';

type PokeballButtonProps = {
    isOpen: boolean;
    onClick: () => void;
};

function PokeballButton({ isOpen, onClick }: PokeballButtonProps) {
    const [isSpinning, setIsSpinning] = useState(false);

    const handleClick = () => {
        setIsSpinning(true);

        onClick();

        setTimeout(() => {
            setIsSpinning(false);
        }, 800);
    };

    return (
        <button
            className={`pokeball-button ${isOpen ? 'open' : 'closed'} ${isSpinning ? 'spinning' : ''}`}
            onClick={handleClick}
            aria-label="Toggle sidebar"
        >
            <div className="pokeball">
                <div className="pokeball-top"></div>
                <div className="pokeball-middle">
                    <div className="pokeball-button-inner"></div>
                </div>
                <div className="pokeball-bottom"></div>
            </div>
        </button>
    );
}

export default PokeballButton;
