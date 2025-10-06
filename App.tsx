import React from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Chart data
const data: ChartData<'line'> = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Monthly Sales',
      data: [12, 19, 3, 5, 2, 15],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
    },
  ],
};

// Chart options
const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#333', font: { size: 14, weight: 'bold' } },
    },
    title: {
      display: true,
      text: 'Sales Dashboard',
      color: '#333',
      font: { size: 22, weight: 'bold' },
    },
  },
  scales: {
    x: {
      ticks: { color: '#555', font: { size: 13 } },
      grid: { color: 'rgba(200,200,200,0.2)' },
    },
    y: {
      ticks: { color: '#555', font: { size: 13 } },
      grid: { color: 'rgba(200,200,200,0.2)' },
    },
  },
};

// App component with export
const App: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '700px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          padding: '30px',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
          Sales Analytics
        </h2>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default App;
