import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export default function App() {
  const [boxes, setBoxes] = useState([]);
  const [activeBoxId, setActiveBoxId] = useState(null);

  const containerRef = useRef(null);
  const boxElementsRef = useRef({});
  
  // Хранилище загруженных из API игр, чтобы при добавлении блока брать их оттуда
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
  });

  // Загружаем игры с CheapShark API при монтировании
  useEffect(() => {
    fetch('https://www.cheapshark.com/api/1.0/deals?pageSize=20')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          dealsPoolRef.current = data;

          // Создаем первые 6 блоков на основе полученных данных
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
        // Запасной вариант, если API недоступно
        setBoxes([
          {
            id: 'fallback-1',
            x: 50,
            y: 50,
            width: 150,
            height: 100,
            color: '#4f46e5',
            title: 'CheapShark API Error / Fallback Game',
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

    const el = boxElementsRef.current[id];
    if (el) {
      el.style.transform = `translate(${newX}px, ${newY}px) scale(1.03)`;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    const { id, currentX, currentY } = dragInfo.current;
    if (!id) return;

    const el = boxElementsRef.current[id];
    if (el) {
      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

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

    const w = Math.floor(Math.random() * 60) + 140;
    const h = Math.floor(Math.random() * 40) + 90;

    // Берем случайную игру из загруженного пула или дефолтную
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
                onPointerDown={(e) => e.stopPropagation()} // Блокируем перетаскивание при клике на текст ссылки
                onClick={(e) => e.stopPropagation()}        // Блокируем клик, чтобы открывалась вкладка
              >
                {box.title}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}