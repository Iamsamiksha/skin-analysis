import React, { useEffect, useRef, useState } from "react";
import Results from "./results";
import './SkinAgePredictor.css';

const SkinAgePredictor = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const capturedImageRef = useRef(null);
    const [skinFactors, setSkinFactors] = useState({
        sun_exposure: "moderate",
        sleep_cycle: "moderate",
        diet_level: "moderate",
        stress_level: "moderate",
        water_intake: "moderate",
    });
    const [predictedAge, setPredictedAge] = useState("");
    const [insights, setInsights] = useState({});
    const [numericInsights, setNumericInsights] = useState({});  // Add numeric insights
    const [skinScore, setSkinScore] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [showPredicted, setShowPredicted] = useState(false);
    const [predictionData, setPredictionData] = useState({});
    const [averageData, setAverageData] = useState({});
    const [realData, setRealData] = useState({});

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                videoRef.current.srcObject = stream;
            })
            .catch(err => console.error("Camera access denied", err));
    }, []);

    const captureImage = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext("2d");

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");

        capturedImageRef.current.src = imageData;
        capturedImageRef.current.style.display = "block";
        document.querySelector(".captured-image-container").style.display = "flex"; // Show the preview dynamically
    };

    const handlePrediction = async () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL("image/jpeg");

        try {
            const response = await fetch("http://127.0.0.1:5000/upload_webcam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData, skin_factors: skinFactors }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                setPredictedAge(`❌ Error: ${data.error}`);
                setInsights({});
                setNumericInsights({});
                setSkinScore("");
                setShowResults(false);
                setShowPredicted(false);
                setAverageData({});  // clear average data as well
                setRealData({});
            } else {
                setPredictedAge(`✅ Real Age: ${data.real_age}, Skin Age: ${data.skin_age}`);
                setPredictionData({ real_age: data.real_age, skin_age: data.skin_age });
                setInsights(data.insights);
                setNumericInsights(data.numeric_insights); // Set numeric insights
                setSkinScore(data.skin_quality_score);
                setShowResults(true);
                setShowPredicted(true);
                setAverageData(data.average_data);
                setRealData(data.real_data);

                console.log("Data.Insights", data.insights);
                console.log("Data.NumericInsights", data.numeric_insights);
                console.log("Data.AverageData", data.average_data);  // log average data
                console.log("Data.realData", data.real_data);  // log real data

            }
        } catch (error) {
            console.error("Prediction error:", error);
            setPredictedAge(`❌ Error: ${error.message}`);
            setInsights({});
            setNumericInsights({});
            setSkinScore("");
            setShowResults(false);
            setShowPredicted(false);
            setAverageData({});  // clear average data in catch as well
            setRealData({})
        }
    };

    const handleChange = (e) => {
        setSkinFactors({ ...skinFactors, [e.target.name]: e.target.value });
    };

    return (
        <div className="predictor-container">
            <h2>Capture Your Image</h2>
            <div id="video-container">
                <video ref={videoRef} width="400" height="300" autoPlay></video>
            </div>
            <button onClick={captureImage} className="capture-button">Capture</button>

            <canvas ref={canvasRef} width="400" height="300" style={{ display: "none" }}></canvas>
            <div className="captured-image-container">
                <img ref={capturedImageRef} style={{ display: "none" }} alt="Captured" />

                </div>
<h3>Skin Factors</h3>
{[
    { key: "Sun_Exposure", labels: ["Very Low", "Low", "Moderate", "High", "Very High"] },
    { key: "Sleep_Cycle", labels: ["Very Poor", "Inadequate", "Irregular", "Good", "Excellent"] },
   { key: "Diet_Level", labels: ["Unhealthy", "Not Balanced", "Moderate", "Healthy", "Excellent"] }
,
    { key: "Stress_Level", labels: ["Very High", "High", "Moderate", "Low", "Very Low"] },
    { key: "Water_Intake", labels: ["Insufficient", "Low", "Moderate", "Adequate", "Well Hydrated"] }
].map(({ key, labels }) => (
    <div className="factor-container" key={key}>
        <label>{key.replace("_", " ")}:</label>
        <div className="slider-container">
            {/* Slider Input */}
            <input
                type="range"
                name={key}
                min="0"
                max="4"
                step="1"
                value={skinFactors[key]}
                onChange={(e) => handleChange(e, key)}
                className="factor-slider"
            />
            {/* Custom Static Labels Below */}
            <div className="slider-labels">
                {labels.map((label, index) => (
                    <span key={index}>{label}</span>
                ))}
            </div>
        </div>
    </div>
))}


            <button onClick={handlePrediction} className="predict-button">Predict Age</button>
            {showPredicted && (
                <div className="predicted-age-card">
                    <h3>{predictedAge}</h3>
                </div>
            )}

            <button onClick={() => setShowResults(true)} disabled={!skinScore || !showPredicted} className="results-button">
                Get Results
            </button>

            {showResults && (
                <Results
                    result={predictionData}
                    insights={insights}
                    numericInsights={numericInsights}
                    averageData={averageData}
                    skinScore={skinScore}
                    showResults={showResults}
                    realData = {realData}
                />
            )}
        </div>
    );
};

export default SkinAgePredictor;