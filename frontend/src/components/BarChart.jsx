import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const DATA_COUNT = 7;
const NUMBER_CFG = { count: DATA_COUNT, min: -100, max: 100 };

const labels = Array.from({ length: DATA_COUNT }, (_, i) => `Month ${i + 1}`);
const generateRandomData = () => Array.from({ length: DATA_COUNT }, () => Math.floor(Math.random() * 200 - 100));

const data = {
  labels,
  datasets: [
    {
      label: 'Fully Rounded',
      data: generateRandomData(),
      borderColor: 'red',
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      borderWidth: 2,
      borderRadius: Number.MAX_VALUE,
      borderSkipped: false,
    },
    {
      label: 'Small Radius',
      data: generateRandomData(),
      borderColor: 'blue',
      backgroundColor: 'rgba(0, 0, 255, 0.5)',
      borderWidth: 2,
      borderRadius: 5,
      borderSkipped: false,
    }
  ]
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Chart.js Bar Chart'
    }
  }
};

const BarChart = () => {
  return <Bar data={data} options={options} />;
};

export default BarChart;
