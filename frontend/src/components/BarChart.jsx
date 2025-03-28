import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const labels = ['Wrinkles', 'Dark Circles', 'Unevenness', 'Pigmentation'];

const BarChart = ({ yourData, averageData }) => {

    // Log immediately upon entering the component
    console.log("BarChart component received: yourData =", yourData, ", averageData =", averageData);

    // Function to safely convert to number, handling null/undefined
    const getSafeNumber = (value) => {
        if (value === null || value === undefined) {
            return 0;
        }
        const num = Number(value);
        return isNaN(num) ? 0 : num; // Return 0 if conversion fails
    };

    const yourWrinkles = getSafeNumber(yourData?.wrinkles);
    const yourDarkCircles = getSafeNumber(yourData?.dark_circles);
    const yourEvenness = getSafeNumber(yourData?.evenness / 2);
    const yourPigmentation = getSafeNumber(yourData?.pigmentation);

    const avgWrinkles = getSafeNumber(averageData?.wrinkles);
    const avgDarkCircles = getSafeNumber(averageData?.dark_circles);
    const avgEvenness = getSafeNumber(averageData?.evenness / 2);
    const avgPigmentation = getSafeNumber(averageData?.pigmentation);

    console.log("Processed data:", {
        yourWrinkles, yourDarkCircles, yourEvenness, yourPigmentation,
        avgWrinkles, avgDarkCircles, avgEvenness, avgPigmentation
    });


    const data = {
        labels,
        datasets: [
            {
                label: 'Your Data',
                data: [
                    Math.round(yourWrinkles),
                    Math.round(yourDarkCircles),
                    Math.round(yourEvenness),
                    Math.round(yourPigmentation)
                ],
                backgroundColor: '#8b63f7',
                borderColor: '#04000f',
                borderWidth: 1,
                borderRadius: 5,
            },
            {
                label: 'Avg Data of this Age Group',
                data: [
                    Math.round(avgWrinkles),
                    Math.round(avgDarkCircles),
                    Math.round(avgEvenness),
                    Math.round(avgPigmentation)
                ],
                backgroundColor: '#632ff5',
                borderColor: '#04000f',
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
                },
                beginAtZero: true // Ensure y-axis starts from 0
            }
        }
    };

    console.log("Chart data being passed to Bar component:", data);

    return <Bar data={data} options={options} />;
};

export default BarChart;