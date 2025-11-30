import { useEffect } from 'react';
import { useKeyboard } from '../../hooks/useKeyboard';
import {
  NumericKeyboard,
  HiraganaKeyboard,
  KatakanaKeyboard,
  AlphabetKeyboard,
} from '../keyboards';
import type { KeyboardInputProps } from '../../types/keyboard';
import './KeyboardInput.css';

export function KeyboardInput({
  type,
  mode,
  value,
  onChange,
  placeholder,
  label,
}: KeyboardInputProps) {
  const keyboard = useKeyboard({
    mode,
    initialValue: value,
    onChange,
  });

  // 外部からvalueが変更された場合に同期
  useEffect(() => {
    keyboard.setInputValue(value);
  }, [value]);

  const renderKeyboard = () => {
    const commonProps = {
      onKeyPress: keyboard.handleKeyPress,
      onBackspace: keyboard.handleBackspace,
      onClose: keyboard.close,
      mode,
      previewValue: keyboard.previewValue,
      onConfirm: keyboard.handleConfirm,
    };

    switch (type) {
      case 'numeric':
        return <NumericKeyboard {...commonProps} />;
      case 'hiragana':
        return <HiraganaKeyboard {...commonProps} />;
      case 'katakana':
        return <KatakanaKeyboard {...commonProps} />;
      case 'alphabet':
        return <AlphabetKeyboard {...commonProps} />;
    }
  };

  return (
    <div className="keyboard-input">
      {label && <label className="keyboard-input-label">{label}</label>}
      <input
        type="text"
        className="keyboard-input-field"
        value={keyboard.inputValue}
        readOnly
        placeholder={placeholder}
        onFocus={keyboard.open}
      />
      {keyboard.isOpen && renderKeyboard()}
    </div>
  );
}
