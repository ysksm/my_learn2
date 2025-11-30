// キーボードの入力タイプ
export type KeyboardType = 'numeric' | 'hiragana' | 'katakana' | 'alphabet';

// キーボードの入力モード
export type KeyboardMode = 'realtime' | 'confirm';

// KeyboardBase コンポーネントのProps
export interface KeyboardBaseProps {
  keys: string[][];
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  mode: KeyboardMode;
  previewValue?: string;
  onConfirm?: () => void;
}

// KeyboardInput コンポーネントのProps
export interface KeyboardInputProps {
  type: KeyboardType;
  mode: KeyboardMode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

// useKeyboard フックの戻り値
export interface UseKeyboardReturn {
  isOpen: boolean;
  inputValue: string;
  previewValue: string;
  open: () => void;
  close: () => void;
  handleKeyPress: (key: string) => void;
  handleConfirm: () => void;
  handleBackspace: () => void;
  setInputValue: (value: string) => void;
}

// useKeyboard フックのオプション
export interface UseKeyboardOptions {
  mode: KeyboardMode;
  initialValue?: string;
  onChange?: (value: string) => void;
}
