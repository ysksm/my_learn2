import { KeyboardBase } from './KeyboardBase';
import type { KeyboardMode } from '../../types/keyboard';

const NUMERIC_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
];

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  mode: KeyboardMode;
  previewValue?: string;
  onConfirm?: () => void;
}

export function NumericKeyboard(props: NumericKeyboardProps) {
  return <KeyboardBase keys={NUMERIC_KEYS} {...props} />;
}
