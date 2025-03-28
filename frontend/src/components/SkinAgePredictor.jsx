import React, { useEffect, useRef, useState } from "react";
import Results from "./Results";
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
    const [numericInsights, setNumericInsights] = useState({});
    const [skinScore, setSkinScore] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [showPredicted, setShowPredicted] = useState(false);
    const [predictionData, setPredictionData] = useState({});
    const [averageData, setAverageData] = useState({});
    const [realData, setRealData] = useState({});
    const [errorMessage, setErrorMessage] = useState(""); // New state for error message

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
        document.querySelector(".captured-image-container").style.display = "flex";
    };

    const handlePrediction = async () => {
        const canvas = canvasRef.current;
        const imageData = canvas.toDataURL("image/jpeg");

        try {
            const response = await fetch("https://skin-analysis-y74l.onrender.com/upload_webcam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData, skin_factors: skinFactors }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                setErrorMessage(`❌ Error: ${data.error}`); // Set generic error
                setPredictedAge("");
                setInsights({});
                setNumericInsights({});
                setSkinScore("");
                setShowResults(false);
                setShowPredicted(false);
                setAverageData({});
                setRealData({});
                setPredictionData({ real_age: null, skin_age: null }); // Reset
            } else if (data.age_error_message) {  // Check specifically for age_error_message
                // Handle the case where no face is detected or there's a specific age error
                setErrorMessage(data.age_error_message); // Use the message from the backend
                setPredictedAge("");
                setInsights({});
                setNumericInsights({});
                setSkinScore("");
                setShowResults(false);
                setShowPredicted(false);
                setAverageData({});
                setRealData({});
                setPredictionData({ real_age: null, skin_age: null }); // Reset
            } else {
                // Correct the data mapping and set data to the card
                setErrorMessage("");
                setPredictedAge(`Real Age: ${data.real_age}, Skin Age: ${data.skin_age}`);
                setPredictionData({
                    real_age: data.real_age,
                    skin_age: data.skin_age
                });
                setInsights(data.insights);
                setNumericInsights(data.numeric_insights);
                setSkinScore(data.skin_quality_score);
                setShowPredicted(true);
                setAverageData({
                    wrinkles: data.average_data.Wrinkles,
                    dark_circles: data.average_data.Dark_circles,
                    evenness: data.average_data.Evenness,
                    pigmentation: data.average_data.Pigmentation
                });
                setRealData({
                    wrinkles: data.real_data.wrinkles,
                    dark_circles: data.real_data.dark_circles,
                    evenness: data.real_data.evenness,
                    pigmentation: data.real_data.pigmentation
                });
            }
        } catch (error) {
            console.error("Prediction error:", error);
            setErrorMessage(`❌ Error: ${error.message}`);
            setPredictedAge("");
            setInsights({});
            setNumericInsights({});
            setSkinScore("");
            setShowResults(false);
            setShowPredicted(false);
            setAverageData({});
            setRealData({});
            setPredictionData({ real_age: null, skin_age: null }); // Reset
        }
    };

    const handleChange = (e) => {
        setSkinFactors({ ...skinFactors, [e.target.name]: e.target.value });
    };

    const renderPredictionContent = () => {
        if (errorMessage) {
            return (
                <div className="error-message">
                    <p>{errorMessage}</p>
                </div>
            );
        } else if (showPredicted && predictionData.real_age === null && predictionData.skin_age === null) {
            return (
                <div className="instruction-card">
                    <p className="instruction-message-header">Please ensure:</p>
                    <ul>
                        <li className="instruction-list-item">You are not too close to the camera.</li>
                        <li className="instruction-list-item">You are not too far from the camera.</li>
                        <li className="instruction-list-item">Only one face is in the frame.</li>
                        <li className="instruction-list-item">There is adequate brightness.</li>
                    </ul>
                </div>
            );
        } else if (showPredicted) {
            return (
                <div className="predicted-age-card">
                    <h3>{predictedAge}</h3>
                </div>
            );
        }

        return null;
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
            <h3>
                <span style={{ color: '#5604c7' }}>Skin Factors</span>
            </h3>
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
                            onChange={handleChange}
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
            <button
                onClick={handlePrediction}
                className="predict-button" // use class not inline
            >
                Predict Age
            </button>

            {renderPredictionContent()}

            <button
                onClick={() => setShowResults(true)}
                disabled={!skinScore || !showPredicted || errorMessage}
                className="results-button" // use class not inline
            >
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
                    realData={realData}
                />
            )}
        </div>
    );
};

export default SkinAgePredictor;