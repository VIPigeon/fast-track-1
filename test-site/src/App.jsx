import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const COLOR_PALETTE = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[randomIndex];
};

export default function App() {
  const [boxes, setBoxes] = useState([]);
  const [activeBoxId, setActiveBoxId] = useState(null);

  const containerRef = useRef(null);
  const trashRef = useRef(null);
  const boxElementsRef = useRef({});
  const dealsPoolRef = useRef([]);

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
    isOverTrash: false,
  });

  useEffect(() => {
    fetch('https://www.cheapshark.com/api/1.0/deals?pageSize=20')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          dealsPoolRef.current = data;

          const initialBoxes = data.slice(0, 6).map((deal, index) => {
            const w = Math.floor(Math.random() * 60) + 140;
            const h = Math.floor(Math.random() * 40) + 90;
            return {
              id: `box-${index}-${Date.now()}`,
              x: Math.floor(Math.random() * 300) + 20,
              y: Math.floor(Math.random() * 300) + 20,
              width: w,
              height: h,
              color: getRandomColor(),
              title: deal.title,
              link: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`,
            };
          });
          setBoxes(initialBoxes);
        }
      })
      .catch((err) => {
        console.error('Ошибка загрузки CheapShark API:', err);
        setBoxes([
          {
            id: 'fallback-1',
            x: 50,
            y: 50,
            width: 150,
            height: 100,
            color: '#4f46e5',
            title: 'CheapShark API Error',
            link: 'https://www.cheapshark.com/',
          },
        ]);
      });
  }, []);

  const handlePointerMove = useCallback((e) => {
    const { id, startX, startY, initialX, initialY, width, height } = dragInfo.current;
    if (!id) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    const maxX = rect.width - width;
    const maxY = rect.height - height;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    dragInfo.current.currentX = newX;
    dragInfo.current.currentY = newY;

    // Двигаем элемент
    const el = boxElementsRef.current[id];
    if (el) {
      el.style.transform = `translate(${newX}px, ${newY}px) scale(1.03)`;

      // Проверяем пересечение с корзиной для подсветки
      if (trashRef.current) {
        const trashRect = trashRef.current.getBoundingClientRect();
        const boxRect = el.getBoundingClientRect();

        const isOver = !(
          boxRect.right < trashRect.left ||
          boxRect.left > trashRect.right ||
          boxRect.bottom < trashRect.top ||
          boxRect.top > trashRect.bottom
        );

        dragInfo.current.isOverTrash = isOver;
        trashRef.current.classList.toggle('trash-active', isOver);
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const { id, currentX, currentY, isOverTrash } = dragInfo.current;
    if (!id) return;

    if (isOverTrash) {
      // Если блок над мусоркой — удаляем его из состояния
      setBoxes((prevBoxes) => prevBoxes.filter((b) => b.id !== id));
    } else {
      // Иначе фиксируем новую позицию
      const el = boxElementsRef.current[id];
      if (el) {
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }

      setBoxes((prevBoxes) =>
        prevBoxes.map((b) => (b.id === id ? { ...b, x: currentX, y: currentY } : b))
      );
    }

    // Сбрасываем подсветку мусорки
    if (trashRef.current) {
      trashRef.current.classList.remove('trash-active');
    }

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
      isOverTrash: false,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const addBox = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const w = Math.floor(Math.random() * 60) + 140;
    const h = Math.floor(Math.random() * 40) + 90;

    const pool = dealsPoolRef.current;
    const randomDeal = pool.length > 0 
      ? pool[Math.floor(Math.random() * pool.length)] 
      : { title: 'Случайная игра', dealID: '' };

    const newBox = {
      id: `box-${Date.now()}`,
      x: Math.floor(Math.random() * Math.max(0, rect.width - w)),
      y: Math.floor(Math.random() * Math.max(0, rect.height - h)),
      width: w,
      height: h,
      color: getRandomColor(),
      title: randomDeal.title,
      link: randomDeal.dealID 
        ? `https://www.cheapshark.com/redirect?dealID=${randomDeal.dealID}` 
        : 'https://www.cheapshark.com/',
    };

    setBoxes((prev) => [...prev, newBox]);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Игры с CheapShark & Drag & Drop</h1>
        <button onClick={addBox} className="button">
          + Добавить игру
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
              <a
                href={box.link}
                target="_blank"
                rel="noopener noreferrer"
                className="game-link"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {box.title}
              </a>
            </div>
          );
        })}

        {/* Корзина в правом нижнем углу */}
        <div ref={trashRef} className="trash-bin">
          🗑️
        </div>
      </div>
    </div>
  );
}