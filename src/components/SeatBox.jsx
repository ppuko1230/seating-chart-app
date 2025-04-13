import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const SeatBox = ({ id, assigned, seatColor = "#f9f9f9", textColor = "#000000", assignedColor = "#4CAF50", assignedTextColor = "#ffffff" }) => {
  // ドロップ可能な領域として設定
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: id,
  });

  // ドラッグ可能な要素として設定
  const { attributes, listeners, setNodeRef: setDraggableRef, transform } = useDraggable({
    id: id,
  });

  // ドラッグ中のスタイルを設定
  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  // 割り当てられた名前がある場合の表示スタイル
  const assignedStyle = assigned ? {
    backgroundColor: assignedColor,
    color: assignedTextColor,
  } : {
    backgroundColor: seatColor,
    color: textColor,
  };

  // ドロップ対象としてホバー中のスタイル
  const hoverStyle = isOver ? {
    boxShadow: '0 0 10px 3px rgba(0, 120, 255, 0.5)',
    border: '2px dashed #0078ff',
  } : {};

  return (
     <div
      className="seat-box"
      ref={(node) => {
        setDroppableRef(node);
        setDraggableRef(node);
      }}
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid #ccc',
        borderRadius: '5px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'move',
        userSelect: 'none',
        padding: '8px',
        boxSizing: 'border-box',
        ...assignedStyle,
        ...hoverStyle,
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      {assigned ? (
        <div className="assigned-name" style={{ textAlign: 'center' }}>
          {assigned.kanji && <div style={{ fontWeight: 'bold' }}>{assigned.kanji}</div>}
          {assigned.hiragana && <div style={{ fontSize: '12px' }}>{assigned.hiragana}</div>}
        </div>
      ) : (
        <div className="empty-seat" style={{ fontSize: '12px' }}>
          空席
        </div>
      )}
    </div>
  );
};

export default SeatBox;