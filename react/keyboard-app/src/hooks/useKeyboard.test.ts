import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';

describe('useKeyboard', () => {
  describe('リアルタイムモード', () => {
    it('初期状態が正しい', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '' })
      );

      expect(result.current.isOpen).toBe(false);
      expect(result.current.inputValue).toBe('');
      expect(result.current.previewValue).toBe('');
    });

    it('open()でキーボードが開く', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '' })
      );

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('close()でキーボードが閉じる', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '' })
      );

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('handleKeyPress()で文字が入力される', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '', onChange })
      );

      act(() => {
        result.current.handleKeyPress('1');
      });

      expect(result.current.inputValue).toBe('1');
      expect(onChange).toHaveBeenCalledWith('1');
    });

    it('連続入力が正しく動作する', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '', onChange })
      );

      act(() => {
        result.current.handleKeyPress('1');
      });
      act(() => {
        result.current.handleKeyPress('2');
      });
      act(() => {
        result.current.handleKeyPress('3');
      });

      expect(result.current.inputValue).toBe('123');
      expect(onChange).toHaveBeenLastCalledWith('123');
    });

    it('handleBackspace()で文字が削除される', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '123', onChange })
      );

      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.inputValue).toBe('12');
      expect(onChange).toHaveBeenCalledWith('12');
    });
  });

  describe('確定モード', () => {
    it('open()時にプレビューに現在値がコピーされる', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'confirm', initialValue: 'abc' })
      );

      act(() => {
        result.current.open();
      });

      expect(result.current.previewValue).toBe('abc');
    });

    it('handleKeyPress()でプレビュー値に文字が追加される', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'confirm', initialValue: '' })
      );

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.handleKeyPress('あ');
      });

      expect(result.current.previewValue).toBe('あ');
      expect(result.current.inputValue).toBe(''); // まだ確定されていない
    });

    it('handleConfirm()でプレビュー値が確定される', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'confirm', initialValue: '', onChange })
      );

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.handleKeyPress('あ');
      });
      act(() => {
        result.current.handleKeyPress('い');
      });
      act(() => {
        result.current.handleConfirm();
      });

      expect(result.current.inputValue).toBe('あい');
      expect(result.current.isOpen).toBe(false);
      expect(onChange).toHaveBeenCalledWith('あい');
    });

    it('handleBackspace()でプレビュー値の末尾が削除される', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'confirm', initialValue: 'abc' })
      );

      act(() => {
        result.current.open();
      });
      act(() => {
        result.current.handleBackspace();
      });

      expect(result.current.previewValue).toBe('ab');
    });
  });

  describe('setInputValue', () => {
    it('外部から値を設定できる', () => {
      const { result } = renderHook(() =>
        useKeyboard({ mode: 'realtime', initialValue: '' })
      );

      act(() => {
        result.current.setInputValue('外部設定');
      });

      expect(result.current.inputValue).toBe('外部設定');
    });
  });
});
