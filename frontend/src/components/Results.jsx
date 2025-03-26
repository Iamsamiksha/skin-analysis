import React from 'react';
import './Results.css';  // Import styles
import { generateDonutChart } from "../chartUtils";// Utility function to generate donut chart

const Results = ({ result, insights, skinScore }) => {
    if (!result) {
        return null; // Don't display if no result yet
    }

    return (
        <div className="results-card">
            <h3>Prediction Result</h3>
            <p>{result}</p>

            <h3>Skin Insights:</h3>
            <div className="insights-container">
                {Object.entries(insights).map(([key, value]) => (
                    <div className="insight-item" key={key}>
                        <div className="insight-label"><b>{key.replace(/_/g, " ")}:</b></div>
                        <div className="donut-chart" dangerouslySetInnerHTML={{ __html: generateDonutChart(value) }} />
                        <div className="insight-value">{value}</div>
                    </div>
                ))}
            </div>

            <div className="skin-score">Skin Score: {skinScore}</div>
        </div>
    );
};

export default Results;