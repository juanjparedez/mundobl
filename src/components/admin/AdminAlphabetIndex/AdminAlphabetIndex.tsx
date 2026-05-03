'use client';

import './AdminAlphabetIndex.css';

interface AdminAlphabetIndexProps {
  letters: string[];
  availableLetters: Set<string>;
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
}

export function AdminAlphabetIndex({
  letters,
  availableLetters,
  selectedLetter,
  onSelectLetter,
}: AdminAlphabetIndexProps) {
  return (
    <div className="admin-alphabet-index">
      {letters.map((letter) => {
        const isAvailable = availableLetters.has(letter);
        const isActive = selectedLetter === letter;

        return (
          <button
            key={letter}
            className={`admin-alphabet-index__btn ${isActive ? 'admin-alphabet-index__btn--active' : ''} ${!isAvailable ? 'admin-alphabet-index__btn--disabled' : ''}`}
            disabled={!isAvailable}
            onClick={() => onSelectLetter(isActive ? null : letter)}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
