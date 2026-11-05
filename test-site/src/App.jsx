import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const COLOR_PALETTE = [
  '#4f46e5', // Индиго
  '#06b6d4', // Бирюзовый
  '#10b981', // Зеленый
  '#f59e0b', // Оранжевый
  '#8b5cf6', // Фиолетовый
  '#ec4899', // Розовый
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
  const [boxes, setBoxes] = useState([]);
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
            const w = 170;
            const h = 135;
            const storeName = STORE_NAMES[deal.storeID] || 'PC Store';

            const salePrice = parseFloat(deal.salePrice) || 0;
            const dealRating = parseFloat(deal.steamRatingPercent) || 0;
            
            const releaseTimestamp = deal.releaseDate && deal.releaseDate > 0 
              ? deal.releaseDate * 1000 
              : new Date(2018 + (index % 6), 0, 1).getTime();

            return {
              id: `box-${index}-${Date.now()}`,
              x: Math.floor(Math.random() * 300) + 20,
              y: Math.floor(Math.random() * 300) + 20,
              width: w,
              height: h,
              color: getRandomColor(),
              title: deal.title,
              salePrice: salePrice,
              normalPrice: deal.normalPrice,
              releaseDate: releaseTimestamp,
              releaseYearLabel: new Date(releaseTimestamp).getFullYear(),
              rating: dealRating,
              store: storeName,
              tags: getRandomTags(),
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
            width: 170,
            height: 135,
            color: '#4f46e5',
            title: 'Fallback Game',
            salePrice: 9.99,
            normalPrice: '19.99',
            releaseDate: new Date(2020, 0, 1).getTime(),
            releaseYearLabel: 2020,
            rating: 5.0,
            store: 'Steam',
            tags: ['Экшен'],
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
      setBoxes((prevBoxes) => prevBoxes.filter((b) => b.id !== id));
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
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const addBox = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const w = 170;
    const h = 135;

    const pool = dealsPoolRef.current;
    const randomDeal = pool.length > 0 
      ? pool[Math.floor(Math.random() * pool.length)] 
      : { title: 'Случайная игра', dealID: '', salePrice: '4.99', normalPrice: '14.99', storeID: '1', dealRating: '5.0' };

    const storeName = STORE_NAMES[randomDeal.storeID] || 'PC Store';
    const salePrice = parseFloat(randomDeal.salePrice) || 4.99;
    const dealRating = parseFloat(randomDeal.dealRating) || 5.0;
    
    const releaseTimestamp = randomDeal.releaseDate && randomDeal.releaseDate > 0 
      ? randomDeal.releaseDate * 1000 
      : new Date(2015 + Math.floor(Math.random() * 9), 0, 1).getTime();

    const newBox = {
      id: `box-${Date.now()}`,
      x: Math.floor(Math.random() * Math.max(0, rect.width - w)),
      y: Math.floor(Math.random() * Math.max(0, rect.height - h)),
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
      link: randomDeal.dealID 
        ? `https://www.cheapshark.com/redirect?dealID=${randomDeal.dealID}` 
        : 'https://www.cheapshark.com/',
    };

    setBoxes((prev) => [...prev, newBox]);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => ({
      ...prev,
      [tag]: !prev[tag],
    }));
  };

  // Обработчики включения режимов с взаимным отключением
  const handleSortToggle = (e) => {
    const checked = e.target.checked;
    setIsSortEnabled(checked);
    if (checked) {
      setIsFilterEnabled(false); // Выключаем фильтр по тегам при включении сортировки
    }
  };

  const handleFilterToggle = (e) => {
    const checked = e.target.checked;
    setIsFilterEnabled(checked);
    if (checked) {
      setIsSortEnabled(false); // Выключаем сортировку при включении фильтра по тегам
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

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Игры с CheapShark & Режимы отображения</h1>
        <button onClick={addBox} className="button">
          + Добавить игру
        </button>
      </header>

      <div className="main-layout">
        <div ref={containerRef} className="board">
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

          <div ref={trashRef} className="trash-bin">
            🗑️
          </div>
        </div>

        <aside className="sidebar">
          <h2 className="sidebar-title">Настройки</h2>
          
          {/* Секция: Сортировка по цвету */}
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

          {/* Секция: Фильтр по тэгам */}
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