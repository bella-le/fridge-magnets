import React, { useState } from 'react';
import { Word } from '../types';

interface WordBoxProps {
  availableWords: Word[];
  onWordSelect: (word: Word) => void;
  onOpenChange: (isOpen: boolean) => void;
}

export const WordBox: React.FC<WordBoxProps> = ({ availableWords, onWordSelect, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen);
    onOpenChange(newIsOpen);
  };

  return (
    <>
      {/* Box Image */}
      <div
        onClick={() => handleOpenChange(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '80px',
          height: '80px',
          cursor: 'pointer',
          zIndex: 2000,
        }}
      >
        <img 
          src="/box.webp" 
          alt="Word Box" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        />
        {availableWords.length > 0 && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#ff4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            {availableWords.length}
          </div>
        )}
      </div>

      {/* Popup */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleOpenChange(false);
            }
          }}
        >
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflow: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => handleOpenChange(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px',
              }}
            >
              ×
            </button>
            <h2 style={{ marginBottom: '20px' }}>Available Words</h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              maxWidth: '600px',
            }}>
              {availableWords.map((word) => (
                <div
                  key={word.id}
                  onClick={() => {
                    onWordSelect(word);
                    handleOpenChange(false);
                  }}
                  style={{
                    padding: '2px 4px',
                    background: 'white',
                    fontFamily: 'serif',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'transform 0.1s',
                    ':hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {word.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
