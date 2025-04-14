import React, { useState, useEffect } from "react";
import InputForm from './components/InputForm';
import NameTag from './components/NameTag';
import SeatBox from './components/SeatBox';
import { 
  DndContext, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import './App.css'; 
import '../styles/style.css'; 
import { read, utils } from 'xlsx';

export default function App() {

  const [seatColor, setSeatColor] = useState("#f9f9f9"); 
  const [assignedColor, setAssignedColor] = useState("#4CAF50"); 
  const [textColor, setTextColor] = useState("#000000"); 
  const [assignedTextColor, setAssignedTextColor] = useState("#ffffff");
  const [studentCount, setStudentCount] = useState(0);
  const [isInputVisible, setIsInputVisible] = useState(true);
  const [names, setNames] = useState([]);
  const [seats, setSeats] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [seatSize, setSeatSize] = useState(100); 
  
  const isInside = (x, y, seat) => {
    return (
      x >= seat.x &&
      x <= seat.x + seatSize &&
      y >= seat.y &&
      y <= seat.y + seatSize
    );
  };

  const [mainContainerSize, setMainContainerSize] = useState({
    width: 2000,
    height: 1000
  });

  const [containerSizes, setContainerSizes] = useState({
    main: { width: 2000, height: 600 },
    extra: { width: "100%", height: 400 }
  });


  const mouseSensor = useSensor(MouseSensor, {

    activationConstraint: { 
      distance: 0,   
      tolerance: 8, 
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    // タッチ操作のための設定
    activationConstraint: { 
      delay: 0,     // 遅延なし
      tolerance: 5, // 許容誤差
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const [layout, setLayout] = useState({
    rowCount: 0,
    columnCount: 0,
    paddings: 10,
    columnPaddings: []
  });


  const [rowCount, setRowCount] = useState(0);
  const [columnCount, setColumnCount] = useState(0);
  const [paddings, setPadding] = useState(10);
  const [columnPaddings, setColumnPaddings] = useState([]);


  useEffect(() => {
    setContainerSizes({
      main: { width: mainContainerSize.width, height: mainContainerSize.height },
    });
  }, [mainContainerSize]);

  const toggleInputVisibility = () => {
    setIsInputVisible((prev) => !prev);
  };


  useEffect(() => {
    setColumnPaddings((prev) => {
      const newSize = Math.max(0, columnCount - 1);
      if (prev.length !== newSize) {
        return Array(newSize).fill(paddings); 
      }
      return prev;
    });
  }, [columnCount, paddings]);
  

  useEffect(() => {

    if (studentCount > 0 && (rowCount > 0 || columnCount > 0)) {
      calculateAndSetSeats();
    }
  }, [studentCount, rowCount, columnCount, columnPaddings, paddings, seatSize]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', draggedItem !== null);
    
    // クリーンアップ関数
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [draggedItem]);


  const calculateAndSetSeats = () => {
    const cols = columnCount || Math.ceil(Math.sqrt(studentCount));
    const rows = rowCount || Math.ceil(studentCount / cols);
    
    const totalGridWidth = cols * seatSize + 
      (cols - 1) * (columnPaddings[0] || paddings);
    
    const totalGridHeight = rows * seatSize + 
      (rows - 1) * paddings;
    
    const containerCenterX = mainContainerSize.width / 2;
    const containerCenterY = mainContainerSize.height / 2;
    
    const gridStartX = containerCenterX - (totalGridWidth / 2);
    const gridStartY = containerCenterY - (totalGridHeight / 2);
    
    // すべての座席を一度に計算
    const allSeats = Array(studentCount).fill(null).map((_, idx) => {
      const rowIndex = Math.floor(idx / cols);
      const colIndex = idx % cols;
      
      let totalColPadding = 0;
      for (let i = 0; i < colIndex; i++) {
        totalColPadding += (columnPaddings[i] || paddings);
      }
      
      return {
        assignedName: null,
        x: gridStartX + (colIndex * seatSize) + totalColPadding,
        y: gridStartY + (rowIndex * seatSize) + (rowIndex * paddings),
      };
    });
    
    setSeats(allSeats);
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
    
    // ドラッグアイテムの情報を保存
    if (id.includes('name-')) {
      const nameIndex = parseInt(id.split('-')[1]);
      setDraggedItem(names[nameIndex]);
      setDraggedItemType('name');
    } else if (id.includes('seat-')) {
      const seatIndex = parseInt(id.split('-')[1]);
      setDraggedItem(seats[seatIndex]);
      setDraggedItemType('seat');
    } 
  };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;
    
    // ドラッグ中のアイテムのID
    const id = active.id;

    // マウスの絶対位置
    const mouseX = event.activatorEvent.clientX;
    const mouseY = event.activatorEvent.clientY;
    
    // 座席エリアの位置を取得
    const mainSeatContainer = document.querySelector('.seats-container');
    
    // 各コンテナの相対位置とサイズを取得
    const mainRect = mainSeatContainer.getBoundingClientRect();
    
    // 名前タグをシートにドロップする場合
    if (id.includes('name-')) {
      const nameIndex = parseInt(id.split('-')[1]);
      const dropid = over?.id;
      if (!dropid) {
        // ドロップ先がない場合でも確実にスクロールを復帰させる
        document.body.classList.remove('no-scroll');
        return;
      }
      if (dropid.includes('seat-')) {
        const seatIndex = parseInt(dropid.split('-')[1]);
        const updatedSeats = [...seats];
        if (!updatedSeats[seatIndex].assignedName) {
          updatedSeats[seatIndex].assignedName = names[nameIndex];
          setSeats(updatedSeats);
        } else {
          console.log("⚠️ この席は既に割り当て済みです");
        }
        // ここでも明示的にスクロールを復帰させる
        document.body.classList.remove('no-scroll');
        return;
      }
    } 
    // 既存の座席の移動
    else if (id.includes('seat-')) {
      // mainSeatContainer内にある場合は位置を更新
      if (mouseX >= mainRect.left && mouseX <= mainRect.right && 
          mouseY >= mainRect.top && mouseY <= mainRect.bottom) {
            if (id.includes('seat-')) {
              const seatIndex = parseInt(id.split('-')[1]);
              const newSeats = [...seats];
              newSeats[seatIndex] = {
                ...newSeats[seatIndex], 
                x: newSeats[seatIndex].x + delta.x,
                y: newSeats[seatIndex].y + delta.y
              };
              setSeats(newSeats);
            }
      } 
    } 
    // ドラッグ終了時にドラッグアイテム情報をクリア
    setDraggedItem(null);
    setDraggedItemType(null);
      // scrollを強制的に有効に戻す
    document.body.classList.remove('no-scroll');
  };

  // ドロップアニメーションのカスタマイズ
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // コンテナサイズの変更ハンドラー
  const handleMainContainerSizeChange = (dimension, value) => {
    setMainContainerSize(prev => ({
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
        </div>
      </div>

      <DndContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd} 
        sensors={sensors}
      >
        <div className="app-container">
          {/* メインコンテンツエリア - レイアウト改善 */}
          <div className="main-content">
            {/* 名前タグと座席エリアを横並びに */}
            <div className="main-layout">
              {/* 名前タグエリア - 縦方向に配置 */}
              <div className="tags-section">
                <h3>生徒名</h3>
                <div className="name-tags-container" style={{ maxHeight: '500px', overflow: 'auto' }}>
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
                          height: `${seatSize}px`,
                          zIndex: 10,
                        }}
                      >
                        <SeatBox 
                          id={`seat-${idx}`} 
                          assigned={seat.assignedName} 
                          seatColor={seatColor}
                          textColor={textColor}
                          assignedColor={assignedColor}
                          assignedTextColor={assignedTextColor}
                          isDragging={draggedItemType === 'seat' && draggedItem === seat}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation} style={{ pointerEvents: 'none' }}>
          {draggedItem && draggedItemType === 'name' && (
            <div 
              className="dragging-overlay"
              style={{
                pointerEvents: 'none',
                zIndex: 9999,
              }}
            >
              <NameTag id="dragging-name" name={draggedItem} />
            </div>
          )}
          {draggedItem && draggedItemType === 'seat' && (
            <div className="dragging-overlay">
              <SeatBox 
                id="dragging-seat" 
                assigned={draggedItem.assignedName} 
                seatColor={seatColor}
                textColor={textColor}
                assignedColor={assignedColor}
                assignedTextColor={assignedTextColor}
              />
            </div>
          )}
            </DragOverlay>
          </DndContext>
        </div>
      );
    }