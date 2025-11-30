import { useState, useCallback, useRef, useEffect } from 'react';
import type { UseKeyboardReturn, UseKeyboardOptions } from '../types/keyboard';

export function useKeyboard(options: UseKeyboardOptions): UseKeyboardReturn {
  const { mode, initialValue = '', onChange } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [previewValue, setPreviewValue] = useState('');

  // onChangeをrefで保持して最新の参照を維持
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (mode === 'confirm') {
      // 確定モードでは既存値をプレビューに設定
      setInputValue(current => {
        setPreviewValue(current);
        return current;
      });
    }
  }, [mode]);

  const close = useCallback(() => {
    setIsOpen(false);
    setPreviewValue('');
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (mode === 'realtime') {
      setInputValue(current => {
        const newValue = current + key;
        onChangeRef.current?.(newValue);
        return newValue;
      });
    } else {
      setPreviewValue(prev => prev + key);
    }
  }, [mode]);

  const handleBackspace = useCallback(() => {
    if (mode === 'realtime') {
      setInputValue(current => {
        const newValue = current.slice(0, -1);
        onChangeRef.current?.(newValue);
        return newValue;
      });
    } else {
      setPreviewValue(prev => prev.slice(0, -1));
    }
  }, [mode]);

  const handleConfirm = useCallback(() => {
    if (mode === 'confirm') {
      setPreviewValue(currentPreview => {
        setInputValue(currentPreview);
        onChangeRef.current?.(currentPreview);
        return currentPreview;
      });
      close();
    }
  }, [mode, close]);

  const updateInputValue = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return {
    isOpen,
    inputValue,
    previewValue,
    open,
    close,
    handleKeyPress,
    handleConfirm,
    handleBackspace,
    setInputValue: updateInputValue,
  };
}
