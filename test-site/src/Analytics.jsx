import React from 'react';

export default function Analytics({ onBack, boxesCount }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Назад на доску
        </button>
        <h1 style={styles.title}>📊 Страница аналитики</h1>
      </header>

      <main style={styles.content}>
        <div style={styles.card}>
          <h2>Статистика игр</h2>
          <p>Текущее количество активных блоков: <strong>{boxesCount}</strong></p>
        </div>

        <div style={styles.card}>
          <h2>Заглушка для графиков</h2>
          <p>Здесь в будущем будут размещены графики и отчеты по скидкам CheapShark.</p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    color: '#111827',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  content: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
  },
};