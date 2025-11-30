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
  const getKeyLabel = (key: string): string => {
    if (key === '⌫') return 'バックスペース';
    if (key === '✓') return mode === 'confirm' ? '確定' : '閉じる';
    if (key === '　') return '空白';
    return key;
  };

  return (
    <div
      className="keyboard-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="キーボード"
    >
      <div
        className="keyboard-container"
        onClick={(e) => e.stopPropagation()}
        role="group"
        aria-label="入力キー"
      >
        {mode === 'confirm' && (
          <div className="keyboard-preview" aria-live="polite" aria-label="入力プレビュー">
            <span className="preview-value">{previewValue || '\u00A0'}</span>
          </div>
        )}
        <div className="keyboard-keys" role="group">
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row" role="group">
              {row.map((key, keyIndex) => (
                <button
                  key={keyIndex}
                  type="button"
                  className={`keyboard-key ${key === '⌫' ? 'key-backspace' : ''} ${key === '✓' ? 'key-confirm' : ''}`}
                  aria-label={getKeyLabel(key)}
                  disabled={key === '　'}
                  onClick={() => {
                    if (key === '⌫') {
                      onBackspace();
                    } else if (key === '✓') {
                      if (mode === 'confirm') {
                        onConfirm?.();
                      } else {
                        onClose();
                      }
                    } else if (key !== '　') {
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
          <button
            type="button"
            className="keyboard-close"
            onClick={onClose}
            aria-label="キーボードを閉じる"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
