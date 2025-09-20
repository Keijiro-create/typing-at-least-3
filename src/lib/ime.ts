/* IME確定テキストだけを安全に取り出す軽量フック */
export type IMEHandlers = {
  onBeforeInput: (e: InputEvent) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
};

type Options = {
  onConfirm: (text: string) => void;            // 確定時に呼ばれる（複数文字可）
  onBackspace?: () => void;                     // deleteContentBackward のとき
};

export function createIMEHandlers(opts: Options): IMEHandlers {
  let composing = false;

  const onCompositionStart = () => {
    composing = true;
  };

  const onCompositionEnd = () => {
    // IME確定の直前/直後に beforeinput(insertText) が来るので、
    // ここでは composing フラグだけ折る。
    composing = false;
  };

  const onBeforeInput = (e: InputEvent) => {
    // テキスト削除
    if (e.inputType === "deleteContentBackward") {
      e.preventDefault();
      opts.onBackspace?.();
      return;
    }

    // IME中の未確定テキストはカウントしない
    if (e.inputType === "insertCompositionText") {
      // 未確定 → 無視
      return;
    }

    // 確定文字列（insertText）のみ
    if (e.inputType === "insertText") {
      // IME環境では e.data が「まとめて確定」文字列になることがある
      const data = e.data ?? "";
      if (data.length > 0) {
        e.preventDefault(); // 入力欄に溜まらないよう阻止
        opts.onConfirm(data); // 文字列全体を渡す
      }
      return;
    }

    // それ以外はデフォルト無視
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // 物理キーのBackspaceを保険で捕捉（IME外のケース）
    if (e.key === "Backspace" && !composing) {
      e.preventDefault();
      opts.onBackspace?.();
    }
  };

  return { onBeforeInput, onCompositionStart, onCompositionEnd, onKeyDown };
}
