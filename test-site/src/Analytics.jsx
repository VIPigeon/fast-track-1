import React from 'react';

export default function Analytics({ onBack, trashedBoxes = [] }) {
  if (!trashedBoxes || trashedBoxes.length === 0) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>
            ← Назад на доску
          </button>
          <h1 style={styles.title}>📊 Зависимость скидки от полной цены</h1>
        </header>
        <div style={styles.emptyState}>
          <div style={styles.emptyCard}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🗑️</span>
            <h2>Нет данных для анализа</h2>
            <p style={{ color: '#6b7280', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Чтобы проанализировать связь между полной стоимостью игры и размером скидки, вернитесь на доску и 
              <strong> сбросьте несколько игр в урну</strong>.
            </p>
            <button onClick={onBack} style={{ ...styles.backButton, marginTop: '15px' }}>
              Перейти к доске
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Общие финансовые метрики
  const totalSalePrice = trashedBoxes.reduce((acc, b) => acc + (parseFloat(b.salePrice) || 0), 0);

  // Расчет размера скидки в % для каждой игры
  const gamesWithDiscount = trashedBoxes.map((box) => {
    const normalPrice = parseFloat(box.normalPrice) || box.salePrice;
    const discountPercent =
      normalPrice > 0 ? Math.round(((normalPrice - box.salePrice) / normalPrice) * 100) : 0;
    return {
      ...box,
      normalPrice,
      discountPercent,
    };
  });

  // Группировка по ценовым диапазонам полной стоимости
  const priceRanges = [
    { label: 'Бюджетные (< $10)', min: 0, max: 9.99 },
    { label: 'Средние ($10 - $25)', min: 10, max: 24.99 },
    { label: 'Крупные ($25 - $50)', min: 25, max: 49.99 },
    { label: 'AAA / Премиум ($50+)', min: 50, max: Infinity },
  ];

  const categoryAnalytics = priceRanges.map((range) => {
    const gamesInRange = gamesWithDiscount.filter(
      (g) => g.normalPrice >= range.min && g.normalPrice <= range.max
    );

    const avgDiscount =
      gamesInRange.length > 0
        ? Math.round(
            gamesInRange.reduce((acc, g) => acc + g.discountPercent, 0) / gamesInRange.length
          )
        : 0;

    return {
      ...range,
      count: gamesInRange.length,
      avgDiscount,
    };
  });

  return (
    <div style={styles.container}>
      {/* Прилипающая шапка */}
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Назад на доску
        </button>
        <h1 style={styles.title}>📊 Зависимость скидки от полной цены</h1>
      </header>

      {/* Прокручиваемый контент */}
      <main style={styles.content}>
        {/* Карточки метрик (включая общую стоимость со скидкой) */}
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <span style={styles.metricTitle}>Игр в анализе</span>
            <span style={styles.metricValue}>{trashedBoxes.length}</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricTitle}>Суммарная стоимость со скидкой</span>
            <span style={{ ...styles.metricValue, color: '#10b981' }}>
              ${totalSalePrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* График по ценовым категориям */}
        <div style={styles.chartCard}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#111827' }}>
            Средняя скидка по ценовым сегментам
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#6b7280' }}>
            Показывает, в каком диапазоне исходных цен издатели делают наиболее агрессивные скидки.
          </p>

          <div style={styles.barChartContainer}>
            {categoryAnalytics.map((cat) => {
              const barHeight = Math.max(cat.avgDiscount, 5);

              return (
                <div key={cat.label} style={styles.barGroup}>
                  <span style={styles.discountValueLabel}>
                    {cat.count > 0 ? `${cat.avgDiscount}%` : '—'}
                  </span>
                  <div style={styles.barsArea}>
                    <div
                      title={`${cat.label}\nСредняя скидка: ${cat.avgDiscount}%\nИгр в сегменте: ${cat.count}`}
                      style={{
                        ...styles.bar,
                        height: `${barHeight}%`,
                        backgroundColor:
                          cat.avgDiscount >= 50
                            ? '#10b981'
                            : cat.avgDiscount >= 25
                            ? '#4f46e5'
                            : '#f59e0b',
                        opacity: cat.count === 0 ? 0.3 : 1,
                      }}
                    />
                  </div>
                  <span style={styles.barLabel}>{cat.label}</span>
                  <span style={styles.countLabel}>({cat.count} шт.)</span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f4f4f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  backButton: {
    padding: '8px 14px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: '30px 20px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '460px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  content: {
    flex: 1,
    padding: '20px 16px 40px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  metricTitle: { fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' },
  metricValue: { fontSize: '1.4rem', fontWeight: 'bold', color: '#1f2937' },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
  },
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    height: '220px',
    paddingTop: '20px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    flex: 1,
    minWidth: '80px',
  },
  discountValueLabel: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '4px',
  },
  barsArea: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  bar: {
    width: '32px',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.4s ease',
  },
  barLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#374151',
    marginTop: '8px',
    textAlign: 'center',
  },
  countLabel: {
    fontSize: '0.65rem',
    color: '#9ca3af',
    marginTop: '2px',
  },
};