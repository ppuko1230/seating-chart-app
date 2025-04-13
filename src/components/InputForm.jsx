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
  isInputVisible,
  onExcelImport
}) {
  return (
    <div className="input-form">
      {/* Excel インポート機能を追加 */}
      <div className="form-group" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h3>Excelから名簿をインポート</h3>
        <p>※ Excelファイルの1列目に「名前」、2列目に「ふりがな」が入力されていることを確認してください。</p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onExcelImport}
          style={{ padding: '5px' }}
        />
      </div>
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
