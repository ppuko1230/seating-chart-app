import React, { useState, useEffect } from "react";
import InputForm from './components/InputForm';
import NameTag from './components/NameTag';
import SeatBox from './components/SeatBox';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import './App.css'; 
import '../styles/style.css'; 

export default function App() {
  // App.jsxの先頭で、色設定のstateを追加
  const [seatColor, setSeatColor] = useState("#f9f9f9"); // デフォルトの背景色
  const [assignedColor, setAssignedColor] = useState("#4CAF50"); // 割り当て済みの席の色
  const [textColor, setTextColor] = useState("#000000"); // テキストの色
  const [assignedTextColor, setAssignedTextColor] = useState("#ffffff");
  const [studentCount, setStudentCount] = useState(0);
  const [isInputVisible, setIsInputVisible] = useState(true); // 名前入力欄の表示/非表示状態
  const [rowCount, setRowCount] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [paddings, setPadding] = useState(5); 
  const [columnPaddings, setColumnPaddings] = useState([]);
  const [names, setNames] = useState([]);
  const [seats, setSeats] = useState([]);
  const [extraSeats, setExtraSeats] = useState([]); // 追加：不足していた state
  const [draggedType, setDraggedType] = useState(null); 
  const [seatSize, setSeatSize] = useState(100); // 座席のサイズを調整可能に
  // コンテナサイズの設定を追加
  const [mainContainerSize, setMainContainerSize] = useState({
    width: 800,
    height: 600
  });
  const [extraContainerSize, setExtraContainerSize] = useState({
    width: "100%",
    height: 400
  });

  const toggleInputVisibility = () => {
    setIsInputVisible((prev) => !prev);
  };

  // 列間のパディングを設定
  useEffect(() => {
    setColumnPaddings((prev) => {
      const newSize = Math.max(0, columnCount - 1);
      if (prev.length !== newSize) {
        return Array(newSize).fill(paddings); 
      }
      return prev;
    });
  }, [columnCount, paddings]);
  
  // 座席を自動的に更新するための useEffect
  useEffect(() => {
    // 基本条件：学生数、行数、列数のいずれかが設定されていること
    if (studentCount > 0 && (rowCount > 0 || columnCount > 0)) {
      calculateAndSetSeats();
    }
  }, [studentCount, rowCount, columnCount, columnPaddings, paddings, seatSize]);

  // 座席の計算と設定を行う関数（handleCountSubmitから分離）
  const calculateAndSetSeats = () => {
    // 行数と列数を計算（既に入力された場合、ユーザー入力を優先）
    const cols = columnCount || Math.ceil(Math.sqrt(studentCount));
    const rows = rowCount || Math.ceil(studentCount / cols);
    
    // 座席の最大数
    const maxGridSeats = rows * cols;

    // 座席の初期位置を計算
    const filledSeats = Array(Math.min(maxGridSeats, studentCount)).fill(null).map((_, idx) => {
      const rowIndex = Math.floor(idx / cols);
      const colIndex = idx % cols;
      
      // 列のパディングを計算（列間のパディングを累積）
      let totalColPadding = 0;
      for (let i = 0; i < colIndex; i++) {
        totalColPadding += (columnPaddings[i] || paddings);
      }
      
      return {
        assignedName: null,
        x: colIndex * seatSize + totalColPadding,
        y: rowIndex * seatSize,
      };
    });

    // 余った席の計算（自由に配置可能）
    const extraSeatsCount = Math.max(0, studentCount - maxGridSeats);
    const newExtraSeats = Array(extraSeatsCount).fill(null).map((_, idx) => ({
      assignedName: null,
      x: 0,
      y: (idx + 1) * 150,
    }));

    setSeats(filledSeats);
    setExtraSeats(newExtraSeats);
  };

  const handlePaddingChange = (e) => {
    setPadding(parseInt(e.target.value, 10));
  };
    
  const updateName = (index, newName) => {
    setNames((prevNames) => {
      const updated = [...prevNames];
      updated[index] = newName;
      return updated;
    });
  };
  
  const handleDragStart = (event) => {
    const { active } = event;
    const id = active.id;
    
    if (id.includes('name-')) {
      setDraggedType('NameTag'); 
    } else if (id.includes('seat-') || id.includes('extraSeat-')) {
      setDraggedType('SeatBox');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    
    if (over) {
      // ドラッグされているのが名前タグの場合
      if (active.id.includes('name-')) {
        const nameIndex = parseInt(active.id.split('-')[1]);
        // 座席に名前をアサイン
        if (over.id.includes('seat-')) {
          const seatIndex = parseInt(over.id.split('-')[1]);
          const newSeats = [...seats];
          newSeats[seatIndex] = {...newSeats[seatIndex], assignedName: names[nameIndex]};
          setSeats(newSeats);
        } else if (over.id.includes('extraSeat-')) {
          const extraSeatIndex = parseInt(over.id.split('-')[1]);
          const newExtraSeats = [...extraSeats];
          newExtraSeats[extraSeatIndex] = {...newExtraSeats[extraSeatIndex], assignedName: names[nameIndex]};
          setExtraSeats(newExtraSeats);
        }
      } 
      // 座席の移動処理
      else if (active.id.includes('seat-') || active.id.includes('extraSeat-')) {
        if (active.id.includes("seat-")) {
          const seatIndex = parseInt(active.id.split('-')[1]);
          const newSeats = [...seats];
          newSeats[seatIndex] = {
            ...newSeats[seatIndex], 
            x: newSeats[seatIndex].x + delta.x,
            y: newSeats[seatIndex].y + delta.y
          };
          setSeats(newSeats);
        } else if (active.id.includes("extraSeat-")) {
          const extraSeatIndex = parseInt(active.id.split('-')[1]);
          const newExtraSeats = [...extraSeats];
          newExtraSeats[extraSeatIndex] = {
            ...newExtraSeats[extraSeatIndex],
            x: newExtraSeats[extraSeatIndex].x + delta.x,
            y: newExtraSeats[extraSeatIndex].y + delta.y
          };
          setExtraSeats(newExtraSeats);
        }
      }
    }
    
    setDraggedType(null);
  };

    // コンテナサイズの変更ハンドラー
    const handleMainContainerSizeChange = (dimension, value) => {
      setMainContainerSize(prev => ({
        ...prev,
        [dimension]: parseInt(value, 10)
      }));
    };
  
    const handleExtraContainerSizeChange = (dimension, value) => {
      setExtraContainerSize(prev => ({
        ...prev,
        [dimension]: parseInt(value, 10)
      }));
    };

  return (
    <div className="container">
      <h1>🪑 クラス座席表メーカー</h1> 

      <InputForm
        isInputVisible={isInputVisible}
        count={studentCount}
        rowCount={rowCount}
        columnCount={columnCount}
        columnPaddings={columnPaddings}
        onColumnPaddingsChange={setColumnPaddings}
        names={names}
        onCountChange={(val) => {
          setStudentCount(val);
          setNames(Array.from({ length: val }, () => ({ kanji: "", hiragana: "" })));
          // 自動生成に任せる（ボタン不要）
        }}
        onRowChange={setRowCount}
        onColumnChange={setColumnCount}
        onPaddingChange={setPadding}
        onNameChange={updateName}
      />
      <button onClick={toggleInputVisibility}>
        {isInputVisible ? '名前入力欄を非表示' : '名前入力欄を表示'}
      </button>
      <div>
        <label>座席サイズ: </label>
        <input 
          type="range" 
          min="50" 
          max="170" 
          value={seatSize} 
          onChange={(e) => setSeatSize(parseInt(e.target.value))} 
        />
        <span>{seatSize}px</span>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
      <h3>座席の色設定</h3>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
    <div>
      <label>空席の背景色: </label>
      <input 
        type="color" 
        value={seatColor} 
        onChange={(e) => setSeatColor(e.target.value)} 
      />
    </div>
    <div>
      <label>空席のテキスト色: </label>
      <input 
        type="color" 
        value={textColor} 
        onChange={(e) => setTextColor(e.target.value)} 
      />
    </div>
    <div>
      <label>割り当て済み席の背景色: </label>
      <input 
        type="color" 
        value={assignedColor} 
        onChange={(e) => setAssignedColor(e.target.value)} 
      />
    </div>
    <div>
      <label>割り当て済み席のテキスト色: </label>
      <input 
        type="color" 
        value={assignedTextColor} 
        onChange={(e) => setAssignedTextColor(e.target.value)} 
      />
    </div>
  </div>
</div>



      {/* コンテナサイズの設定UI */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>座席エリアのサイズ設定</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <label>メイン幅: </label>
            <input 
              type="number" 
              min="400" 
              max="2000" 
              value={mainContainerSize.width} 
              onChange={(e) => handleMainContainerSizeChange('width', e.target.value)} 
            />
            <span>px</span>
          </div>
          <div>
            <label>メイン高さ: </label>
            <input 
              type="number" 
              min="300" 
              max="1500" 
              value={mainContainerSize.height} 
              onChange={(e) => handleMainContainerSizeChange('height', e.target.value)} 
            />
            <span>px</span>
          </div>
          <div>
            <label>エキストラエリア高さ: </label>
            <input 
              type="number" 
              min="100" 
              max="800" 
              value={extraContainerSize.height} 
              onChange={(e) => handleExtraContainerSizeChange('height', e.target.value)} 
            />
            <span>px</span>
          </div>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 名前タグエリア */}
        <div className="tags" style={{ marginBottom: '20px' }}>
          <h3>生徒名</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {names.map((name, idx) => (
              <NameTag key={idx} id={`name-${idx}`} name={name} />
            ))}
          </div>
        </div>

        {/* メイン座席エリア - ユーザー指定サイズを適用 */}
        <div className="seats" style={{
          position: "relative",
          border: "1px solid #ccc",
          marginBottom: "50px",
          width: `${mainContainerSize.width}px`,
          height: `${mainContainerSize.height}px`,
          overflow: "auto" // 大きなコンテンツがある場合にスクロール可能に
        }}>
          <h3 style={{ position: 'absolute', top: '10px', left: '10px', margin: 0, opacity: 0.7 }}></h3>
          {seats.map((seat, idx) => {
            if (!seat) return null;
            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: `${seat.y}px`,
                  left: `${seat.x}px`,
                  width: `${seatSize}px`,
                  height: `${seatSize}px`
                }}
              >
                <SeatBox 
                  id={`seat-${idx}`} 
                  assigned={seat.assignedName} 
                  seatColor={seatColor}
                  textColor={textColor}
                  assignedColor={assignedColor}
                  assignedTextColor={assignedTextColor}
                />
              </div>
            );
          })}
        </div>

        {/* エキストラ座席エリア - ユーザー指定サイズを適用 */}
        <div
          className="extra-seats"
          style={{
            position: "relative",
            width: "100%",
            height: `${extraContainerSize.height}px`,
            border: "1px dashed #aaa",
            marginTop: "30px",
            padding: "0px",
          }}
        >
          <h3 style={{ position: 'absolute', top: '10px', left: '10px', margin: 0, opacity: 0.7 }}>エキストラ座席エリア</h3>
          {extraSeats.map((extraSeat, idx) => {
            return (
              <div
                key={`extraSeat-${idx}`}
                style={{
                  position: "absolute",
                  top: `${extraSeat.y}px`,
                  left: `${extraSeat.x}px`,
                  width: `${seatSize}px`,
                  height: `${seatSize}px`
                }}
              >
                <SeatBox 
                id={`extraSeat-${idx}`} 
                assigned={extraSeat.assignedName} 
                seatColor={seatColor}
                textColor={textColor}
                assignedColor={assignedColor}
                assignedTextColor={assignedTextColor}
                />
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* ドラッグ中のアイテムタイプを表示 */}
      <div>
        {draggedType ? `ドラッグ中のアイテム: ${draggedType}` : '何もドラッグしていません'}
      </div>
    </div>
  );
}
