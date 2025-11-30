import { useState, useCallback } from 'react';
import type { UseKeyboardReturn, UseKeyboardOptions } from '../types/keyboard';

export function useKeyboard(options: UseKeyboardOptions): UseKeyboardReturn {
  const { mode, initialValue = '', onChange } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [previewValue, setPreviewValue] = useState('');

  const open = useCallback(() => {
    setIsOpen(true);
    if (mode === 'confirm') {
      // 確定モードでは既存値をプレビューに設定
      setPreviewValue(inputValue);
    }
  }, [mode, inputValue]);

  const close = useCallback(() => {
    setIsOpen(false);
    setPreviewValue('');
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    if (mode === 'realtime') {
      const newValue = inputValue + key;
      setInputValue(newValue);
      onChange?.(newValue);
    } else {
      setPreviewValue(prev => prev + key);
    }
  }, [mode, inputValue, onChange]);

  const handleBackspace = useCallback(() => {
    if (mode === 'realtime') {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      onChange?.(newValue);
    } else {
      // 確定モードでもプレビュー値を削除可能
      setPreviewValue(prev => prev.slice(0, -1));
    }
  }, [mode, inputValue, onChange]);

  const handleConfirm = useCallback(() => {
    if (mode === 'confirm') {
      // プレビュー値をそのまま確定値として設定
      setInputValue(previewValue);
      onChange?.(previewValue);
      close();
    }
  }, [mode, previewValue, onChange, close]);

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
