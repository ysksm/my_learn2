import { KeyboardBase } from './KeyboardBase';
import type { KeyboardMode } from '../../types/keyboard';

// QWERTY配列
const ALPHABET_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ['⌫', '✓'],
];

interface AlphabetKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  mode: KeyboardMode;
  previewValue?: string;
  onConfirm?: () => void;
}

export function AlphabetKeyboard(props: AlphabetKeyboardProps) {
  return <KeyboardBase keys={ALPHABET_KEYS} {...props} />;
}
