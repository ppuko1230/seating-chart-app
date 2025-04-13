import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const NameTag = ({ id, name }) => {
  // ドラッグ可能な要素として設定
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  // ドラッグ中のスタイルを設定
  const style = transform ? {
    transform: CSS.Transform.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '100px',
        height: '60px',
        border: '1px solid #5d99c6',
        borderRadius: '5px',
        background: '#90caf9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'grab',
        userSelect: 'none',
        margin: '5px',
        padding: '5px',
        boxSizing: 'border-box',
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      {name.kanji && <div style={{ fontWeight: 'bold' }}>{name.kanji}</div>}
      {name.hiragana && <div style={{ fontSize: '12px' }}>{name.hiragana}</div>}
    </div>
  );
};

export default NameTag;