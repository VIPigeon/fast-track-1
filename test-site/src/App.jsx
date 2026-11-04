import React, { useState, useRef, useCallback } from 'react';
import './App.css';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const createInitialBoxes = (count = 6) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `box-${index}-${Date.now()}`,
    x: Math.floor(Math.random() * 250) + 20,
    y: Math.floor(Math.random() * 250) + 20,
    width: Math.floor(Math.random() * 60) + 100,
    height: Math.floor(Math.random() * 40) + 80,
    color: getRandomColor(),
    title: `Блок #${index + 1}`
  }));
};

export default function App() {
  const [boxes, setBoxes] = useState(createInitialBoxes(6));
  const [activeBoxId, setActiveBoxId] = useState(null);

  const containerRef = useRef(null);
  const boxElementsRef = useRef({});
  
  const dragInfo = useRef({
    id: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    currentX: 0,
    currentY: 0,
    width: 0,
    height: 0,
  });

  const handlePointerMove = useCallback((e) => {
    const { id, startX, startY, initialX, initialY, width, height } = dragInfo.current;
    if (!id) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // Смещение курсора от точки нажатия
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    // Ограничение границами контейнера
    const maxX = rect.width - width;
    const maxY = rect.height - height;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    dragInfo.current.currentX = newX;
    dragInfo.current.currentY = newY;

    // Двигаем через transform с небольшим увеличением при захвате
    const el = boxElementsRef.current[id];
    if (el) {
      el.style.transform = `translate(${newX}px, ${newY}px) scale(1.03)`;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const { id, currentX, currentY } = dragInfo.current;
    if (!id) return;

    // Возвращаем масштаб к 1 и фиксируем финальные координаты в трансформе ДО обновления стейта,
    // чтобы не было никаких визуальных прыжков.
    const el = boxElementsRef.current[id];
    if (el) {
      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    // Сохраняем новые координаты в React-состояние
    setBoxes((prevBoxes) =>
      prevBoxes.map((b) => (b.id === id ? { ...b, x: currentX, y: currentY } : b))
    );

    dragInfo.current.id = null;
    setActiveBoxId(null);

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = (e, box) => {
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    setActiveBoxId(box.id);
    
    // Перемещаем блок в конец массива, чтобы он отрисовывался поверх остальных
    setBoxes((prevBoxes) => {
      const filtered = prevBoxes.filter((b) => b.id !== box.id);
      return [...filtered, box];
    });

    dragInfo.current = {
      id: box.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: box.x,
      initialY: box.y,
      currentX: box.x,
      currentY: box.y,
      width: box.width,
      height: box.height,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const addBox = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const w = Math.floor(Math.random() * 60) + 100;
    const h = Math.floor(Math.random() * 40) + 80;

    const newBox = {
      id: `box-${Date.now()}`,
      x: Math.floor(Math.random() * Math.max(0, rect.width - w)),
      y: Math.floor(Math.random() * Math.max(0, rect.height - h)),
      width: w,
      height: h,
      color: getRandomColor(),
      title: `Блок #${boxes.length + 1}`
    };

    setBoxes((prev) => [...prev, newBox]);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Drag & Drop Прямоугольники</h1>
        <button onClick={addBox} className="button">
          + Добавить прямоугольник
        </button>
      </header>

      <div ref={containerRef} className="board">
        {boxes.map((box) => {
          const isActive = activeBoxId === box.id;
          return (
            <div
              key={box.id}
              ref={(el) => (boxElementsRef.current[box.id] = el)}
              onPointerDown={(e) => handlePointerDown(e, box)}
              className="box"
              style={{
                left: '0px',
                top: '0px',
                width: `${box.width}px`,
                height: `${box.height}px`,
                backgroundColor: box.color,
                cursor: isActive ? 'grabbing' : 'grab',
                borderColor: isActive ? '#000' : 'rgba(0,0,0,0.15)',
                zIndex: isActive ? 1000 : 1,
                transform: `translate(${box.x}px, ${box.y}px)`,
              }}
            >
              <span>{box.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}