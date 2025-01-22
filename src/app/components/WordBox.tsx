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
        onTouchEnd={(e) => {
          e.preventDefault();
          handleOpenChange(true);
        }}
        style={{
          position: 'fixed',
          bottom: 'max(20px, env(safe-area-inset-bottom))',
          right: 'max(20px, env(safe-area-inset-right))',
          width: '80px',
          height: '80px',
          cursor: 'pointer',
          zIndex: 2000,
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
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
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
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
              onTouchEnd={(e) => {
                e.preventDefault();
                handleOpenChange(false);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#666',
                padding: '8px 12px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 3001,
              }}
            >
              ×
            </button>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '20px',
            }}>
              {availableWords.map((word) => {
                const rotation = Math.random() * 4 - 2; // Random rotation between -2 and 2 degrees
                return (
                  <div
                    key={word.id}
                    className="word-box-item"
                    onClick={() => {
                      onWordSelect(word);
                      handleOpenChange(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      onWordSelect(word);
                      handleOpenChange(false);
                    }}
                    style={{
                      '--random-rotation': `${rotation}deg`,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    } as React.CSSProperties}
                  >
                    {word.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
