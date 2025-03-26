import { useEffect, useRef, useState } from "react";
import Results from "./Results"; // Import Results Component
import './SkinAgePredictor.css'; // Import Styles

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
  const [skinScore, setSkinScore] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { videoRef.current.srcObject = stream; })
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
  };

  const handlePrediction = async () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/jpeg");

    const response = await fetch("http://127.0.0.1:5000/upload_webcam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData, skin_factors: skinFactors }),
    });

    const data = await response.json();

    if (data.error) {
      setPredictedAge(`❌ Error: ${data.error}`);
      setInsights({});
      setSkinScore("");
      setShowResults(false);
    } else {
      setPredictedAge(`✅ Real Age: ${data.real_age}, Skin Age: ${data.skin_age}`);
      setInsights(data.insights);
      setSkinScore(data.skin_quality_score);
      setShowResults(false);
    }
  };

  const handleChange = (e) => {
    setSkinFactors({ ...skinFactors, [e.target.name]: e.target.value });
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  return (
    <div className="predictor-container">
      <h2>Capture Your Image</h2>
      <div id="video-container">
        <video ref={videoRef} width="400" height="300" autoPlay></video>
      </div>
      <button onClick={captureImage} className="capture-button">📸 Capture</button>

      <canvas ref={canvasRef} width="400" height="300" style={{ display: "none" }}></canvas>
      <img ref={capturedImageRef} style={{ display: "none" }} alt="Captured" />

      <h3>Skin Factors</h3>
      {["sun_exposure", "sleep_cycle", "diet_level", "stress_level", "water_intake"].map((factor) => (
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

      <button onClick={handlePrediction} className="predict-button">🔍 Predict Age</button>
      {predictedAge && (
        <div className="predicted-age-card">
          <h3>{predictedAge}</h3>
        </div>
      )}

      <button onClick={handleShowResults} disabled={!skinScore} className="results-button">
        Get Results
      </button>

      {showResults && <Results result={predictedAge} insights={insights} skinScore={skinScore} />}
    </div>
  );
};

export default SkinAgePredictor;