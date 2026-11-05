import React from 'react';

export default function Analytics({ onBack, trashedBoxes = [] }) {
  if (!trashedBoxes || trashedBoxes.length === 0) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>
            ← Назад на доску
          </button>
          <h1 style={styles.title}>📊 Аналитика скидок</h1>
        </header>
        <div style={styles.emptyState}>
          <div style={styles.emptyCard}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🗑️</span>
            <h2>Нет данных для анализа</h2>
            <p style={{ color: '#6b7280', fontSize: '1.05rem', lineHeight: '1.5' }}>
              Чтобы проанализировать тенденции цен и скидок, вернитесь на доску и 
              <strong> сбросьте игры в урну для анализа</strong>.
            </p>
            <button onClick={onBack} style={{ ...styles.backButton, marginTop: '15px' }}>
              Перейти к доске
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Расчёты данных
  const maxPrice = Math.max(
    ...trashedBoxes.map((b) => Math.max(b.salePrice, parseFloat(b.normalPrice) || b.salePrice)),
    1
  );
  
  const totalOriginal = trashedBoxes.reduce((acc, b) => acc + (parseFloat(b.normalPrice) || b.salePrice), 0);
  const totalSale = trashedBoxes.reduce((acc, b) => acc + b.salePrice, 0);
  const totalSaved = Math.max(0, totalOriginal - totalSale);

  return (
    <div style={styles.container}>
      {/* Прилипающая к верху шапка */}
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Назад на доску
        </button>
        <h1 style={styles.title}>📊 Аналитика проанализированных игр</h1>
      </header>

      {/* Прокручиваемый контент */}
      <main style={styles.content}>
        {/* Карточки метрик */}
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <span style={styles.metricTitle}>Игр в анализе</span>
            <span style={styles.metricValue}>{trashedBoxes.length}</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricTitle}>Общая стоимость со скидкой</span>
            <span style={styles.metricValue}>${totalSale.toFixed(2)}</span>
          </div>
          <div style={styles.metricCard}>
            <span style={styles.metricTitle}>Суммарная экономия</span>
            <span style={{ ...styles.metricValue, color: '#10b981' }}>${totalSaved.toFixed(2)}</span>
          </div>
        </div>

        {/* График цен */}
        <div style={styles.chartCard}>
          <h3>Сравнение цен (Скидка vs Базовая)</h3>
          <div style={styles.barChartContainer}>
            {trashedBoxes.map((box) => {
              const normal = parseFloat(box.normalPrice) || box.salePrice;
              const saleHeight = (box.salePrice / maxPrice) * 100;
              const normalHeight = (normal / maxPrice) * 100;

              return (
                <div key={box.id} style={styles.barGroup}>
                  <div style={styles.barsArea}>
                    <div
                      title={`Цена со скидкой: $${box.salePrice}`}
                      style={{ ...styles.bar, height: `${saleHeight}%`, backgroundColor: '#10b981' }}
                    />
                    <div
                      title={`Обычная цена: $${normal}`}
                      style={{ ...styles.bar, height: `${normalHeight}%`, backgroundColor: '#818cf8' }}
                    />
                  </div>
                  <span style={styles.barLabel}>{box.title}</span>
                </div>
              );
            })}
          </div>
          <div style={styles.legend}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 2 }} /> Цена со скидкой
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: 2 }} /> Обычная цена
            </span>
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
    overflow: 'hidden', // предотвращает двойную прокрутку страницы целиком
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
  emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
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
    overflowY: 'auto', // Прокрутка лентой на телефонах и узких экранах
    WebkitOverflowScrolling: 'touch', // Гладкий инерционный скролл на iOS
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    padding: '16px',
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
    minWidth: '50px',
  },
  barsArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
  },
  bar: {
    width: '14px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  barLabel: {
    fontSize: '0.7rem',
    color: '#4b5563',
    marginTop: '6px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70px',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '14px',
    fontSize: '0.8rem',
    color: '#374151',
    flexWrap: 'wrap',
  },
};