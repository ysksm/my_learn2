import { KeyboardBase } from './KeyboardBase';
import type { KeyboardMode } from '../../types/keyboard';

// 五十音配列（カタカナ）
const KATAKANA_KEYS = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', '　', 'ユ', '　', 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', 'ヲ', 'ン', '⌫', '✓'],
];

interface KatakanaKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  mode: KeyboardMode;
  previewValue?: string;
  onConfirm?: () => void;
}

export function KatakanaKeyboard(props: KatakanaKeyboardProps) {
  return <KeyboardBase keys={KATAKANA_KEYS} {...props} />;
}
