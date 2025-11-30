import type { KeyboardBaseProps } from '../../types/keyboard';
import './KeyboardBase.css';

export function KeyboardBase({
  keys,
  onKeyPress,
  onClose,
  onBackspace,
  mode,
  previewValue,
  onConfirm,
}: KeyboardBaseProps) {
  return (
    <div className="keyboard-overlay" onClick={onClose}>
      <div className="keyboard-container" onClick={(e) => e.stopPropagation()}>
        {mode === 'confirm' && (
          <div className="keyboard-preview">
            <span className="preview-value">{previewValue || '\u00A0'}</span>
          </div>
        )}
        <div className="keyboard-keys">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key, keyIndex) => (
                <button
                  key={keyIndex}
                  className={`keyboard-key ${key === '⌫' ? 'key-backspace' : ''} ${key === '✓' ? 'key-confirm' : ''}`}
                  onClick={() => {
                    if (key === '⌫') {
                      onBackspace();
                    } else if (key === '✓') {
                      if (mode === 'confirm') {
                        onConfirm?.();
                      } else {
                        onClose();
                      }
                    } else {
                      onKeyPress(key);
                    }
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="keyboard-actions">
          <button className="keyboard-close" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
