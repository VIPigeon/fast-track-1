import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics({ onBack, trashedBoxes = [] }) {
  // Если урна пуста, показываем инструкцию
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

  // --- ПОДГОТОВКА ДАННЫХ ДЛЯ ГРАФИКОВ ---

  // 1. Сравнение цен каждой сброшенной игры (Текущая цена vs Обычная цена)
  const priceComparisonData = {
    labels: trashedBoxes.map((b) => b.title),
    datasets: [
      {
        label: 'Цена со скидкой ($)',
        data: trashedBoxes.map((b) => b.salePrice),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
      {
        label: 'Обычная цена ($)',
        data: trashedBoxes.map((b) => parseFloat(b.normalPrice) || b.salePrice),
        backgroundColor: 'rgba(99, 102, 241, 0.4)',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    ],
  };

  // 2. Средняя скидка по тегам (%)
  const tagSavingsMap = {};
  const tagCountMap = {};

  trashedBoxes.forEach((box) => {
    const normal = parseFloat(box.normalPrice) || box.salePrice;
    const discount = normal > 0 ? ((normal - box.salePrice) / normal) * 100 : 0;
    
    box.tags.forEach((tag) => {
      tagSavingsMap[tag] = (tagSavingsMap[tag] || 0) + discount;
      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
    });
  });

  const tagLabels = Object.keys(tagSavingsMap);
  const tagAvgSavings = tagLabels.map((tag) => (tagSavingsMap[tag] / tagCountMap[tag]).toFixed(1));

  const tagChartData = {
    labels: tagLabels,
    datasets: [
      {
        label: 'Средняя экономия (%)',
        data: tagAvgSavings,
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // --- ОБЩАЯ СТАТИСТИКА ---
  const totalOriginal = trashedBoxes.reduce((acc, b) => acc + (parseFloat(b.normalPrice) || b.salePrice), 0);
  const totalSale = trashedBoxes.reduce((acc, b) => acc + b.salePrice, 0);
  const totalSaved = Math.max(0, totalOriginal - totalSale);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Назад на доску
        </button>
        <h1 style={styles.title}>📊 Аналитика проанализированных игр</h1>
      </header>

      <main style={styles.content}>
        {/* Краткие метрики */}
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

        {/* Графики */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3>Сравнение цен (Скидка vs Базовая)</h3>
            <div style={{ height: '300px' }}>
              <Bar
                data={priceComparisonData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3>Средняя скидка по категориям (%)</h3>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={tagChartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#f4f4f9',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  title: {
    margin: 0,
    fontSize: '1.3rem',
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
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '460px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  content: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricTitle: {
    fontSize: '0.85rem',
    color: '#6b7280',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
  },
};