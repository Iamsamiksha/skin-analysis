import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const labels = ['Wrinkles', 'Dark Circles', 'Unevenness', 'Pigmentation'];  // Renamed labels

const BarChart = ({ yourData, averageData }) => {
    const data = {
        labels,
        datasets: [
            {
                label: 'Your Data',
                data: [
                  Math.round(yourData?.wrinkles) || 0,
                  Math.round(yourData?.dark_circles) || 0,
                  Math.round(yourData?.evenness / 2) || 0,
                  Math.round(yourData?.pigmentation) || 0
                ],
                backgroundColor: '#d8bfe9',  // Light Lavender
                borderColor: '#7957a8',      // Darker Lavender
                borderWidth: 1,
                borderRadius: 5,
            },
            {
                label: 'Avg Data of this Age Group',
                data: [
                    averageData?.wrinkles || 0,
                    averageData?.dark_circles || 0,
                    averageData?.evenness/2 || 0,
                    averageData?.pigmentation || 0
                ],
                backgroundColor: '#c3aed6',  // Medium Lavender
                borderColor: '#553980',      // Darker Purple
                borderWidth: 1,
                borderRadius: 5,
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#553980'
                }
            },
            title: {
                display: true,
                text: 'Skin Analysis Comparison',
                color: '#7957a8'
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#553980'
                }
            },
            y: {
                ticks: {
                    color: '#553980'
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
};

export default BarChart;