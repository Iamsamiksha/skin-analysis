import React, { useRef, useEffect } from "react";
import "./Results.css";
import { generateDonutChart } from "../chartUtils.js";
import BarChart from "../components/BarChart";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


const Results = ({ result, insights, numericInsights, skinScore, showResults, averageData, realData }) => {
    const resultRef = useRef();

    useEffect(() => {
        console.log("averageData in Results component:", averageData);
    }, [averageData]);

    const downloadPDF = () => {
        const input = resultRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
            pdf.save("SkinVision_Results.pdf");
        });
    };


    return (
        <div ref={resultRef} className="results-card">
            <div className="age-card">
                <h3 style={{ color: "#4d39ff", fontWeight: "bold" }}>Prediction Result</h3>
                <p style={{ color: "#4d39ff", fontWeight: "bold" }}>Real Age: {result.real_age}</p>
                <p style={{ color: "#4d39ff", fontWeight: "bold" }}>Skin Age: {result.skin_age}</p>
            </div>

            {showResults && (
                <>
                    <h3>Skin Insights:</h3>
                    <div className="insights-container">
                        {Object.entries(insights).map(([key, value]) => {
                            const numericValue = numericInsights[key];
                           
                            return (
                                <div className="insight-item" key={key}>
                                    <div className="insight-label"><b>{key.replace(/_/g, " ")}:</b></div>
                                    <div className="donut-chart" dangerouslySetInnerHTML={{ __html: generateDonutChart(numericValue) }} />
                                    <div className="insight-value">{value}</div>
                                </div>
                            );
                        })}
                    </div>
                    <BarChart yourData={realData} averageData={averageData} />
                    <div className="skin-score">Skin Score: {skinScore}</div>
                </>
            )}

            {/* Download Button */}
            <button className="download-btn" onClick={downloadPDF}>Download as PDF</button>
            <button className="download-btn" style={{ color: 'white' }}>
    <a href="https://skin-analysis-ui.vercel.app/" className="home" style={{ color: 'inherit', textDecoration: 'none' }}>
        Back To Home
    </a>
</button>
        </div>
    );
};

export default Results;