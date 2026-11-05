import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import Analytics from './Analytics';

const COLOR_PALETTE = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
];

const AVAILABLE_TAGS = ['Экшен', 'RPG', 'Инди', 'Стратегия', 'Шутер', 'Приключения'];

const STORE_NAMES = {
  '1': 'Steam',
  '2': 'GamersGate',
  '3': 'GreenManGaming',
  '7': 'GOG',
  '8': 'Origin',
  '11': 'Humble Store',
  '25': 'Epic Games',
};

const getRandomColor = () => {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
};

const getRandomTags = () => {
  const count = Math.floor(Math.random() * 2) + 1;
  const shuffled = [...AVAILABLE_TAGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getGradedColor = (value, minVal, maxVal, baseHue, isReversed) => {
  let normalized = 0.5;
  if (maxVal > minVal) {
    normalized = (value - minVal) / (maxVal - minVal);
  }
  if (isReversed) {
    normalized = 1 - normalized;
  }
  const lightness = 82 - normalized * 52;
  const saturation = 45 + normalized * 40;
  return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('main');
  const [boxes, setBoxes] = useState([]);
  const [trashedBoxes, setTrashedBoxes] = useState([]); 
  const [activeBoxId, setActiveBoxId] = useState(null);

  const [isFilterEnabled, setIsFilterEnabled] = useState(false);
  const [selectedTags, setSelectedTags] = useState(
    AVAILABLE_TAGS.reduce((acc, tag) => ({ ...acc, [tag]: false }), {})
  );

  const [isSortEnabled, setIsSortEnabled] = useState(false);
  const [sortParam, setSortParam] = useState('releaseDate');

  const containerRef = useRef(null);
  const trashRef = useRef(null);
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
    isOverTrash: false,
    isProcessed: false,
  });

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

    if (dragInfo.current.isProcessed) return;
    dragInfo.current.isProcessed = true;

    if (isOverTrash) {
      setBoxes((prevBoxes) => {
        const deletedBox = prevBoxes.find((b) => b.id === id);
        if (deletedBox) {
          setTrashedBoxes((prevTrashed) => {
            // Проверка: если игра с таким же названием уже есть в урне, не добавляем её повторно в аналитику
            const alreadyExists = prevTrashed.some((b) => b.title === deletedBox.title);
            if (alreadyExists) return prevTrashed;
            return [...prevTrashed, deletedBox];
          });
        }
        return prevBoxes.filter((b) => b.id !== id);
      });
    } else {
      const el = boxElementsRef.current[id];
      if (el) {
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }

      setBoxes((prevBoxes) =>
        prevBoxes.map((b) => (b.id === id ? { ...b, x: currentX, y: currentY } : b))
      );
    }

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
      isProcessed: false,
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  // Добавление игры с проверкой уникальности
  const addBox = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    fetch('https://www.cheapshark.com/api/1.0/deals?pageSize=60')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          let randomDeal = null;
          let attempts = 0;
          const maxAttempts = 6;

          // Ищем уникальную игру, которой еще нет на доске
          while (attempts < maxAttempts) {
            const candidate = data[Math.floor(Math.random() * data.length)];
            const alreadyOnBoard = boxes.some((b) => b.title === candidate.title);

            if (!alreadyOnBoard) {
              randomDeal = candidate;
              break;
            }
            attempts++;
          }

          // Если после 3 попыток все игры уже на доске
          if (!randomDeal) {
            alert('Новых игр пока нет (все доступные игры уже добавлены на доску)');
            return;
          }

          const w = 170;
          const h = 135;
          const storeName = STORE_NAMES[randomDeal.storeID] || 'PC Store';
          const salePrice = parseFloat(randomDeal.salePrice) || 4.99;
          const dealRating = parseFloat(randomDeal.steamRatingPercent) || 5.0;
          
          const releaseTimestamp = randomDeal.releaseDate && randomDeal.releaseDate > 0 
            ? randomDeal.releaseDate * 1000 
            : new Date(2015 + Math.floor(Math.random() * 9), 0, 1).getTime();

          const newBox = {
            id: `box-${Date.now()}-${Math.random()}`,
            x: Math.floor(Math.random() * Math.max(0, rect.width - w - 50)) + 10,
            y: Math.floor(Math.random() * Math.max(0, rect.height - h - 50)) + 10,
            width: w,
            height: h,
            color: getRandomColor(),
            title: randomDeal.title,
            salePrice: salePrice,
            normalPrice: randomDeal.normalPrice,
            releaseDate: releaseTimestamp,
            releaseYearLabel: new Date(releaseTimestamp).getFullYear(),
            rating: dealRating,
            store: storeName,
            tags: getRandomTags(),
            link: `https://www.cheapshark.com/redirect?dealID=${randomDeal.dealID}`,
          };

          setBoxes((prev) => [...prev, newBox]);
        }
      })
      .catch((err) => {
        console.error('Ошибка фетча CheapShark API:', err);
      });
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tag]: !prev[tag],
    }));
  };

  const handleSortToggle = (e) => {
    const checked = e.target.checked;
    setIsSortEnabled(checked);
    if (checked) {
      setIsFilterEnabled(false);
    }
  };

  const handleFilterToggle = (e) => {
    const checked = e.target.checked;
    setIsFilterEnabled(checked);
    if (checked) {
      setIsSortEnabled(false);
    }
  };

  const getMinMaxForParam = (param) => {
    if (boxes.length === 0) return { min: 0, max: 1 };
    const values = boxes.map((b) => {
      if (param === 'price') return b.salePrice;
      if (param === 'rating') return b.rating;
      return b.releaseDate;
    });
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };

  const { min: minVal, max: maxVal } = getMinMaxForParam(sortParam);

  const getParamHue = (param) => {
    if (param === 'price') return 25;
    if (param === 'rating') return 220;
    return 280;
  };

  if (currentPage === 'analytics') {
    return <Analytics onBack={() => setCurrentPage('main')} trashedBoxes={trashedBoxes} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Ручной поисковик игр с CheapShark</h1>
        <button onClick={addBox} className="button">
          + Добавить игру
        </button>
      </header>

      <div className="main-layout">
        <div ref={containerRef} className="board">
          {boxes.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              textAlign: 'center',
              padding: '20px',
              userSelect: 'none'
            }}>
              <span style={{ fontSize: '3rem', marginBottom: '10px' }}>🎮</span>
              <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Игр нет</h3>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                Нажмите кнопку <strong>«+ Добавить игру»</strong>, чтобы добавить игру.
              </p>
            </div>
          )}

          {boxes.map((box) => {
            const isActive = activeBoxId === box.id;

            let boxBgColor = box.color;

            if (isSortEnabled) {
              let val = box.releaseDate;
              if (sortParam === 'price') val = box.salePrice;
              if (sortParam === 'rating') val = box.rating;

              boxBgColor = getGradedColor(val, minVal, maxVal, getParamHue(sortParam), sortParam === 'price');
            } else if (isFilterEnabled) {
              const hasMatchingTag = box.tags.some((tag) => selectedTags[tag]);
              boxBgColor = hasMatchingTag ? '#10b981' : '#9ca3af';
            }

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
                  backgroundColor: boxBgColor,
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

                <div className="game-info-footer">
                  <div className="game-prices">
                    <span className="sale-price">${box.salePrice.toFixed(2)}</span>
                    {box.normalPrice && parseFloat(box.normalPrice) !== box.salePrice && (
                      <span className="normal-price">${box.normalPrice}</span>
                    )}
                  </div>
                  <span className="game-meta">👍 {box.rating.toFixed(0)}% | 📅 {box.releaseYearLabel}</span>
                  <span className="game-meta">🏪 {box.store}</span>
                </div>
              </div>
            );
          })}

          <div
            ref={trashRef}
            onClick={() => setCurrentPage('analytics')}
            className={`trash-bin ${activeBoxId ? 'trash-pressed' : ''}`}
          >
            <span>🗑️ Аналитика ({trashedBoxes.length})</span>
          </div>
        </div>

        <aside className="sidebar">
          <h2 className="sidebar-title">Настройки</h2>
          
          <div className="sidebar-section">
            <label className="filter-toggle-label">
              <input
                type="checkbox"
                checked={isSortEnabled}
                onChange={handleSortToggle}
              />
              "Сортировка"
            </label>

            {isSortEnabled && (
              <div className="options-container">
                <label className="radio-option-label">
                  <input
                    type="radio"
                    name="sortParam"
                    value="releaseDate"
                    checked={sortParam === 'releaseDate'}
                    onChange={(e) => setSortParam(e.target.value)}
                  />
                  Дата выхода
                </label>

                <label className="radio-option-label">
                  <input
                    type="radio"
                    name="sortParam"
                    value="price"
                    checked={sortParam === 'price'}
                    onChange={(e) => setSortParam(e.target.value)}
                  />
                  Стоимость
                </label>

                <label className="radio-option-label">
                  <input
                    type="radio"
                    name="sortParam"
                    value="rating"
                    checked={sortParam === 'rating'}
                    onChange={(e) => setSortParam(e.target.value)}
                  />
                  Доля положительных отзывов в steam
                </label>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />

          <div className="sidebar-section">
            <label className="filter-toggle-label">
              <input
                type="checkbox"
                checked={isFilterEnabled}
                onChange={handleFilterToggle}
              />
              Фильтр по тэгам
            </label>

            {isFilterEnabled && (
              <div className="options-container">
                {AVAILABLE_TAGS.map((tag) => (
                  <label key={tag} className="tag-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedTags[tag]}
                      onChange={() => handleTagToggle(tag)}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}