import React from 'react';

export default function InputForm({
  count,
  rowCount,
  columnCount,
  columnPaddings,
  onColumnPaddingsChange,
  names,
  onCountChange,
  onRowChange,
  onColumnChange,
  onNameChange,
  isInputVisible // 追加: isInputVisibleをpropsとして受け取る
}) {
  return (
    <div className="input-form">
      <label>
        生徒の人数:
        <input
          type="number"
          min="1"
          value={count}
          onChange={(e) => onCountChange(parseInt(e.target.value) || 0)}
        />
      </label>

      <label>
        行数:
        <input
          type="number"
          min="1"
          value={rowCount}
          onChange={(e) => onRowChange(parseInt(e.target.value) || 0)}
        />
      </label>

      <label>
        列数:
        <input
          type="number"
          min="1"
          value={columnCount}
          onChange={(e) => onColumnChange(parseInt(e.target.value) || 0)}
        />
      </label>

      {columnPaddings.map((pad, idx) => (
        <label key={idx}>
          列 {idx + 1} と列 {idx + 2} の余白:
          <input
            type="number"
            value={pad}
            onChange={(e) => {
              const updated = [...columnPaddings];
              updated[idx] = parseInt(e.target.value) || 0;
              onColumnPaddingsChange(updated);
            }}
          />
        </label>
      ))}

      {/* 🔽 生徒の名前入力欄 🔽 */}
      <div>
        {isInputVisible && (  // isInputVisibleがtrueの場合のみ名前入力欄を表示
          <div className="name-inputs">
            {names.map((name, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder={`生徒 ${idx + 1} の名前（漢字）`}
                  value={name.kanji}
                  onChange={(e) =>
                    onNameChange(idx, { ...name, kanji: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder={`生徒 ${idx + 1} の名前（ひらがな）`}
                  value={name.hiragana}
                  onChange={(e) =>
                    onNameChange(idx, { ...name, hiragana: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
