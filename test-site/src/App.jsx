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

const AVAILABLE_TAGS = ['Steam', 'EpicGames', 'GOG', 'Бесплатно', 'Бюджетные', 'AAA'];

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

const getTags = (deal) => {
  const tags = [];
  const salePrice = parseFloat(deal.salePrice) || 0;
  const normalPrice = parseFloat(deal.normalPrice) || salePrice;

  if (salePrice === 0) {
    tags.push('Бесплатно');
  }

  if (salePrice < 5 && salePrice > 0) {
    tags.push('Бюджетные');
  } else if (normalPrice >= 40) {
    tags.push('AAA');
  }

  if (deal.storeID === '1') tags.push('Steam');
  else if (deal.storeID === '25') tags.push('Epic Games');
  else if (deal.storeID === '7') tags.push('GOG');

  return tags;
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
  const [sortParam, setSortParam] = useState('price');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

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
    // Не даем перетаскивать серый загружающийся блок
    if (box.isLoading) return;

    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    setActiveBoxId(box.id);
    
    setBoxes((prevBoxes) => {
      const filtered = prevBoxes.filter((b) => b.id !== box.id);
      return [...filtered, box];
    });

    dragInfo.current = {
      id: box.id,
      startX: clientX,
      startY: clientY,
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

  const addBox = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Адаптивные размеры карточки
    const isMobile = window.innerWidth <= 768;
    const w = isMobile ? 130 : 170;
    const h = isMobile ? 110 : 135;

    // Рассчитываем случайную позицию в центральных 70% доски
    const marginX = rect.width * 0.15;
    const rangeX = rect.width * 0.7 - w;
    const marginY = rect.height * 0.15;
    const rangeY = rect.height * 0.7 - h;

    const randomX = Math.floor(marginX + Math.random() * Math.max(0, rangeX));
    const randomY = Math.floor(marginY + Math.random() * Math.max(0, rangeY));

    // Создаем временный серый блок (Placeholder/Skeleton)
    const tempId = `box-temp-${Date.now()}-${Math.random()}`;
    const tempBox = {
      id: tempId,
      x: randomX,
      y: randomY,
      width: w,
      height: h,
      isLoading: true,
      tags: [],
    };

    // Мгновенно отображаем серый прямоугольник на доске
    setBoxes((prev) => [...prev, tempBox]);

    fetch('https://www.cheapshark.com/api/1.0/deals?pageSize=60')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          let randomDeal = null;
          let attempts = 0;
          const maxAttempts = 8;

          setBoxes((currentBoxes) => {
            while (attempts < maxAttempts) {
              const candidate = data[Math.floor(Math.random() * data.length)];
              const alreadyOnBoard = currentBoxes.some((b) => b.title === candidate.title);

              if (!alreadyOnBoard) {
                randomDeal = candidate;
                break;
              }
              attempts++;
            }

            if (!randomDeal) {
              alert('Новых игр пока нет (все доступные игры уже добавлены на доску)');
              // Удаляем временный серый блок, если новых игр не нашли
              return currentBoxes.filter((b) => b.id !== tempId);
            }

            const storeName = STORE_NAMES[randomDeal.storeID] || 'PC Store';
            const salePrice = parseFloat(randomDeal.salePrice) || 4.99;
            const dealRating = parseFloat(randomDeal.steamRatingPercent) || 5.0;
            
            const releaseTimestamp = randomDeal.releaseDate && randomDeal.releaseDate > 0 
              ? randomDeal.releaseDate * 1000 
              : new Date(2015 + Math.floor(Math.random() * 9), 0, 1).getTime();

            const updatedBox = {
              id: `box-${Date.now()}-${Math.random()}`,
              x: randomX,
              y: randomY,
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
              tags: getTags(randomDeal),
              link: `https://www.cheapshark.com/redirect?dealID=${randomDeal.dealID}`,
              isLoading: false,
            };

            // Заменяем серый блок подгруженными данными
            return currentBoxes.map((b) => (b.id === tempId ? updatedBox : b));
          });
        }
      })
      .catch((err) => {
        console.error('Ошибка фетча CheapShark API:', err);
        // При ошибке фетча удаляем заглушку
        setBoxes((prev) => prev.filter((b) => b.id !== tempId));
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
    const values = boxes
      .filter((b) => !b.isLoading)
      .map((b) => {
        if (param === 'price') return b.salePrice;
        if (param === 'rating') return b.rating;
        return b.releaseDate;
      });

    if (values.length === 0) return { min: 0, max: 1 };

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
        <h1 className="title">ManualShark</h1>
        <button 
          className="menu-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ⚙️ Меню
        </button>
      </header>

      <div className="main-layout">
        <div 
          className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

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
                Нажмите кнопку <strong>«+ Добавить игру»</strong> в меню, чтобы начать.
              </p>
            </div>
          )}

          {boxes.map((box) => {
            const isActive = activeBoxId === box.id;

            let boxBgColor = box.color;

            if (box.isLoading) {
              boxBgColor = '#e5e7eb';
            } else if (isSortEnabled) {
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
                onTouchStart={(e) => handlePointerDown(e, box)}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className={`box ${box.isLoading ? 'loading' : ''}`}
                style={{
                  left: '0px',
                  top: '0px',
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  backgroundColor: boxBgColor,
                  cursor: box.isLoading ? 'wait' : isActive ? 'grabbing' : 'grab',
                  borderColor: isActive ? '#000' : 'rgba(0,0,0,0.15)',
                  zIndex: isActive ? 1000 : 1,
                  transform: `translate(${box.x}px, ${box.y}px)`,
                }}
              >
                {box.isLoading ? (
                  <div className="box-skeleton-content">
                    <span style={{ fontSize: '1.2rem' }}>⏳</span>
                    <span>Загрузка...</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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

        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="sidebar-close-btn"
            >
              ✕
            </button>
          </div>
          
          <button onClick={() => { addBox(); setIsMobileMenuOpen(false); }} className="sidebar-button">
            + Добавить игру
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '5px 0' }} />
          
          <div className="sidebar-section">
            <label className="filter-toggle-label">
              <input
                type="checkbox"
                checked={isSortEnabled}
                onChange={handleSortToggle}
              />
              Сортировка
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
                  Положительные отзывы
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