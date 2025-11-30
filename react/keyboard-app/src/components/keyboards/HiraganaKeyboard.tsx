import { KeyboardBase } from './KeyboardBase';
import type { KeyboardMode } from '../../types/keyboard';

// 五十音配列
const HIRAGANA_KEYS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '　', 'ゆ', '　', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を', 'ん', '⌫', '✓'],
];

interface HiraganaKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  mode: KeyboardMode;
  previewValue?: string;
  onConfirm?: () => void;
}

export function HiraganaKeyboard(props: HiraganaKeyboardProps) {
  return <KeyboardBase keys={HIRAGANA_KEYS} {...props} />;
}
