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
    const [numericInsights, setNumericInsights] = useState({});
    const [skinScore, setSkinScore] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [showPredicted, setShowPredicted] = useState(false);
    const [predictionData, setPredictionData] = useState({});
    const [imageCaptured, setImageCaptured] = useState(false);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
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
        setImageCaptured(true);
    };

    const handlePrediction = async () => {
        if (!imageCaptured) return alert("Please capture an image first!");

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
            } else {
                setPredictedAge(`✅ Real Age: ${data.real_age}, Skin Age: ${data.skin_age}`);
                setPredictionData({ real_age: data.real_age, skin_age: data.skin_age });
                setInsights(data.insights);
                setNumericInsights(data.numeric_insights);
                setSkinScore(data.skin_quality_score);
                setShowResults(true);
                setShowPredicted(true);
            }
        } catch (error) {
            console.error("Prediction error:", error);
            setPredictedAge(`❌ Error: ${error.message}`);
            setInsights({});
            setNumericInsights({});
            setSkinScore("");
            setShowResults(false);
            setShowPredicted(false);
        }
    };

    const handleChange = (e) => {
        setSkinFactors({ ...skinFactors, [e.target.name]: e.target.value });
    };

    return (
        <div className="predictor-container">
            <h2>Skin Age Predictor</h2>

            <div id="video-container">
                <video ref={videoRef} width="400" height="300" autoPlay></video>
            </div>

            <button onClick={captureImage} className="capture-button">📸 Capture</button>

            <canvas ref={canvasRef} width="400" height="300" style={{ display: "none" }}></canvas>
            <div className="captured-image-container">
                <img ref={capturedImageRef} style={{ display: "none" }} alt="Captured" />
            </div>

            <h3>Adjust Skin Factors</h3>
            <div className="factors-grid">
                {Object.keys(skinFactors).map((factor) => (
                    <div className="factor-container" key={factor}>
                        <label>{factor.replace("_", " ")}:</label>
                        <select name={factor} value={skinFactors[factor]} onChange={handleChange} className="factor-select">
                            <option value="very_low">Very Low</option>
                            <option value="low">Low</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                            <option value="very_high">Very High</option>
                        </select>
                    </div>
                ))}
            </div>

            <button onClick={handlePrediction} className="predict-button">🔍 Predict Age</button>

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
                    skinScore={skinScore}
                    showResults={showResults}
                />
            )}
        </div>
    );
};

export default SkinAgePredictor;
