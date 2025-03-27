import React from 'react';
import './Results.css';
import { generateDonutChart } from "../chartUtils.js";

const Results = ({ result, insights, numericInsights, skinScore, showResults }) => {
    console.log("Result Prop", result);
    console.log("Insights Prop", insights);
    console.log("Numeric Insights Prop", numericInsights);
    console.log("Skin Score Prop", skinScore);
    console.log("Show Results", showResults);

    return (
        <div className="results-card">
            <h3>Prediction Result</h3>
            <p>Real Age: {result.real_age}, Skin Age: {result.skin_age}</p>

            {showResults && (
                <>
                    <h3>Skin Insights:</h3>
                    <div className="insights-container">
                        {Object.entries(insights).map(([key, value]) => {
                            const numericValue = numericInsights[key]; // ***This is the key line***
                            return (
                                <div className="insight-item" key={key}>
                                    <div className="insight-label"><b>{key.replace(/_/g, " ")}:</b></div>
                                    <div className="donut-chart" dangerouslySetInnerHTML={{ __html: generateDonutChart(numericValue) }} />
                                    <div className="insight-value">{value}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="skin-score">Skin Score: {skinScore}</div>
                </>
            )}
        </div>
    );
};

export default Results;