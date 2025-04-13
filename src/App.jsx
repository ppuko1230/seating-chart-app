import React, { useState, useEffect } from "react";
import InputForm from './components/InputForm';
import NameTag from './components/NameTag';
import SeatBox from './components/SeatBox';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';import './App.css'; 
import '../styles/style.css'; 
import { read, utils } from 'xlsx';

export default function App() {
  // App.jsxの先頭で、色設定のstateを追加
  const [seatColor, setSeatColor] = useState("#f9f9f9"); // デフォルトの背景色
  const [assignedColor, setAssignedColor] = useState("#4CAF50"); // 割り当て済みの席の色
  const [textColor, setTextColor] = useState("#000000"); // テキストの色
  const [assignedTextColor, setAssignedTextColor] = useState("#ffffff");
  const [studentCount, setStudentCount] = useState(0);
  const [isInputVisible, setIsInputVisible] = useState(true); // 名前入力欄の表示/非表示状態
  const [names, setNames] = useState([]);
  const [seats, setSeats] = useState([]);
  const [extraSeats, setExtraSeats] = useState([]); // 追加：不足していた state
  const [draggedType, setDraggedType] = useState(null); 
  const [seatSize, setSeatSize] = useState(100); // 座席のサイズを調整可能に
  
  // コンテナサイズの設定を追加
  const [mainContainerSize, setMainContainerSize] = useState({
    width: 2000,
    height: 1000
  });
  const [extraContainerSize, setExtraContainerSize] = useState({
    width: "100%",
    height: 400
  });

  // コンテナサイズを containerSizes としても保持（レイアウト用）
  const [containerSizes, setContainerSizes] = useState({
    main: { width: 2000, height: 600 },
    extra: { width: "100%", height: 400 }
  });

  // App.jsx内、export default function Appの中
  const mouseSensor = useSensor(MouseSensor, {
    // マウスの動きを検知する距離（px）
    activationConstraint: { distance: 5 },
  });

  const touchSensor = useSensor(TouchSensor, {
    // タッチの動きを検知する距離（px）
    activationConstraint: { delay: 100, tolerance: 5 },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  // レイアウト設定
  const [layout, setLayout] = useState({
    rowCount: 0,
    columnCount: 0,
    paddings: 10,
    columnPaddings: []
  });

  // レイアウト設定の個別state（互換性のため残す）
  const [rowCount, setRowCount] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [paddings, setPadding] = useState(10);
  const [columnPaddings, setColumnPaddings] = useState([]);

  // mainContainerSize または extraContainerSize が変更されたらcontainerSizesも更新
  useEffect(() => {
    setContainerSizes({
      main: { width: mainContainerSize.width, height: mainContainerSize.height },
      extra: { width: extraContainerSize.width, height: extraContainerSize.height }
    });
  }, [mainContainerSize, extraContainerSize]);

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

    // グリッド全体のサイズを計算
    let totalGridWidth = 0;
    let totalGridHeight = 0;
    
    // 列の合計幅を計算（座席のサイズ + 各列間のパディング）
    totalGridWidth = cols * seatSize;
    for (let i = 0; i < cols - 1; i++) {
      totalGridWidth += (columnPaddings[i] || paddings);
    }
    
    // グリッドの合計高さ
    totalGridHeight = rows * seatSize;
    
    // コンテナの中央を計算
    const containerCenterX = mainContainerSize.width / 2;
    const containerCenterY = mainContainerSize.height / 2;
    
    // グリッドの左上隅の座標（中央配置のため）
    const gridStartX = containerCenterX - (totalGridWidth / 2);
    const gridStartY = containerCenterY - (totalGridHeight / 2);

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
        // グリッド開始位置 + 列ごとの位置
        x: gridStartX + (colIndex * seatSize) + totalColPadding,
        // グリッド開始位置 + 行ごとの位置
        y: gridStartY + (rowIndex * seatSize),
      };
    });

  // 余った席も中央のエキストラエリアから配置
  const extraSeatsCount = Math.max(0, studentCount - maxGridSeats);
  const extraContainerCenterX = parseInt(extraContainerSize.width) / 2;
  const extraContainerCenterY = extraContainerSize.height / 2;
  
  // エキストラ席のグリッド計算（簡易的に一列に配置）
  const newExtraSeats = Array(extraSeatsCount).fill(null).map((_, idx) => ({
    assignedName: null,
    x: extraContainerCenterX - (seatSize / 2),
    y: extraContainerCenterY - (seatSize / 2) + (idx * (seatSize + 20)),
  }));

  setSeats(filledSeats);
  setExtraSeats(newExtraSeats);
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = read(data, { type: 'array' });
        
        // 最初のシートを取得
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // シートからJSONデータに変換
        const jsonData = utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          alert('データが見つかりませんでした。Excelファイルを確認してください。');
          return;
        }
        
        // 名前データを抽出
        // Excelファイルの列名を検出
        const firstRow = jsonData[0];
        const keys = Object.keys(firstRow);
        
        // 名前とフリガナの列を特定
        let nameKey = keys.find(key => 
          /名前|氏名|姓名/.test(key)
        );
        
        let furiganaKey = keys.find(key => 
          /フリガナ|ふりがな|読み|よみ/.test(key)
        );
        
        // 列が見つからない場合はデフォルトで最初と2番目の列を使用
        if (!nameKey) nameKey = keys[0];
        if (!furiganaKey) furiganaKey = keys[1];
        
        const importedNames = jsonData.map(row => {
          return {
            kanji: row[nameKey] || '',
            hiragana: row[furiganaKey] || ''
          };
        });
        
        // 読み込んだ名前の数に合わせて学生数を更新
        setStudentCount(importedNames.length);
        
        // 名前データを更新
        setNames(importedNames);
        
        // レイアウトの再計算
        if (rowCount > 0 || columnCount > 0) {
          calculateAndSetSeats();
        }
        
        alert(`${importedNames.length}件の名前データを読み込みました。`);
      } catch (error) {
        console.error('Excelファイルの読み込みに失敗しました:', error);
        alert('Excelファイルの読み込みに失敗しました。ファイル形式を確認してください。');
      }
    };
    
    reader.readAsArrayBuffer(file);
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
    
    // ドラッグ中のアイテムのID
    const id = active.id;
    
    // マウスの現在位置を取得（オフセットを考慮）
    const currentPosition = {
      x: event.activatorEvent.clientX - event.activatorEvent.target.getBoundingClientRect().left,
      y: event.activatorEvent.clientY - event.activatorEvent.target.getBoundingClientRect().top
    };
    
    // 名前タグをシートにドロップする場合
    if (id.includes('name-')) {
      const nameIndex = parseInt(id.split('-')[1]);
      
      // 座席エリアの位置を取得
      const mainSeatContainer = document.querySelector('.seats-container');
      const extraSeatContainer = document.querySelector('.extra-seats-container');
      
      // 各コンテナの相対位置とサイズを取得
      const mainRect = mainSeatContainer.getBoundingClientRect();
      const extraRect = extraSeatContainer.getBoundingClientRect();
      
      // マウスの絶対位置
      const mouseX = event.activatorEvent.clientX;
      const mouseY = event.activatorEvent.clientY;
      
      // マウスがどのコンテナ内にあるか判定
      if (mouseX >= mainRect.left && mouseX <= mainRect.right && 
          mouseY >= mainRect.top && mouseY <= mainRect.bottom) {
        // メイン座席エリア内の相対位置を計算
        const relativeX = mouseX - mainRect.left;
        const relativeY = mouseY - mainRect.top;
        
        // 新しい座席を作成（座席のサイズの半分をオフセットして中央に配置）
        const newSeat = {
          assignedName: names[nameIndex],
          x: relativeX - (seatSize / 2),
          y: relativeY - (seatSize / 2)
        };
        
        // 座席リストに追加
        setSeats([...seats, newSeat]);
      } 
      else if (mouseX >= extraRect.left && mouseX <= extraRect.right && 
              mouseY >= extraRect.top && mouseY <= extraRect.bottom) {
        // エキストラ座席エリア内の相対位置を計算
        const relativeX = mouseX - extraRect.left;
        const relativeY = mouseY - extraRect.top;
        
        // 新しいエキストラ座席を作成
        const newExtraSeat = {
          assignedName: names[nameIndex],
          x: relativeX - (seatSize / 2),
          y: relativeY - (seatSize / 2)
        };
        
        // エキストラ座席リストに追加
        setExtraSeats([...extraSeats, newExtraSeat]);
      }
    } 
    // 既存の座席の移動
    else if (id.includes('seat-') || id.includes('extraSeat-')) {
      if (id.includes("seat-")) {
        const seatIndex = parseInt(id.split('-')[1]);
        const newSeats = [...seats];
        newSeats[seatIndex] = {
          ...newSeats[seatIndex], 
          x: newSeats[seatIndex].x + delta.x,
          y: newSeats[seatIndex].y + delta.y
        };
        setSeats(newSeats);
      } else if (id.includes("extraSeat-")) {
        const extraSeatIndex = parseInt(id.split('-')[1]);
        const newExtraSeats = [...extraSeats];
        newExtraSeats[extraSeatIndex] = {
          ...newExtraSeats[extraSeatIndex],
          x: newExtraSeats[extraSeatIndex].x + delta.x,
          y: newExtraSeats[extraSeatIndex].y + delta.y
        };
        setExtraSeats(newExtraSeats);
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
    <div className="container wide-layout">
      <h1>🪑 クラス座席表メーカー</h1> 

      <InputForm
        isInputVisible={isInputVisible}
        count={studentCount}
        rowCount={rowCount}
        columnCount={columnCount}
        columnPaddings={columnPaddings}
        onColumnPaddingsChange={setColumnPaddings}
        names={names}
        onExcelImport={handleExcelImport}
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

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}   sensors={sensors}>
        <div className="app-container">
          {/* メインコンテンツエリア - レイアウト改善 */}
          <div className="main-content">
            {/* 名前タグと座席エリアを横並びに */}
            <div className="main-layout">
              {/* 名前タグエリア - 縦方向に配置 */}
              <div className="tags-section">
                <h3>生徒名</h3>
                <div className="name-tags-container">
                  {names.map((name, idx) => (
                    <NameTag key={idx} id={`name-${idx}`} name={name} />
                  ))}
                </div>
              </div>
              
              {/* 座席エリアコンテナ - 拡大 */}
              <div className="seating-area">
                {/* メイン座席エリア */}
                <div className="seats-container" style={{
                  position: "relative",
                  border: "1px solid #ccc",
                  width: `${containerSizes.main.width}px`,
                  height: `${containerSizes.main.height}px`,
                  overflow: "auto"
                }}>
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
                
                {/* エキストラ座席エリア */}
                <div 
                  className="extra-seats-container" 
                  style={{
                    position: "relative",
                    border: "1px dashed #aaa",
                    width: "100%",
                    height: `${containerSizes.extra.height}px`,
                    marginTop: "20px",
                    overflow: "auto"
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
              </div>
            </div>
          </div>
        </div>

        {/* ドラッグ中のアイテムタイプを表示 */}
        <div>
          {draggedType ? `ドラッグ中のアイテム: ${draggedType}` : '何もドラッグしていません'}
        </div>
      </DndContext>
    </div>
  );
}