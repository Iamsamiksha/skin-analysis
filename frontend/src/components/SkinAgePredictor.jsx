import { useEffect, useRef, useState } from "react";
import Results from "./Results"; 
import './SkinAgePredictor.css'; 

const SkinAgePredictor = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const capturedImageRef = useRef(null);
  const [skinFactors, setSkinFactors] = useState({
    sun_exposure: 3,
    sleep_cycle: 3,
    diet_level: 3,
    stress_level: 3,
    water_intake: 3,
  });
  const [predictedAge, setPredictedAge] = useState("");
  const [insights, setInsights] = useState({});
  const [skinScore, setSkinScore] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [imageCaptured, setImageCaptured] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } })
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
    setImageCaptured(true);
  };

  const handlePrediction = async () => {
    if (!imageCaptured) return alert("Please capture an image first!");

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
    setSkinFactors({ ...skinFactors, [e.target.name]: parseInt(e.target.value) });
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  return (
    <div className="predictor-container">
      <h2>Skin Age Predictor</h2>
      
      <div className="video-wrapper">
        <video ref={videoRef} autoPlay></video>
        <canvas ref={canvasRef} width="480" height="360" style={{ display: "none" }}></canvas>
      </div>

      <button onClick={captureImage} className="capture-button">📸 Capture Image</button>

      <div className="captured-image-container">
        <img ref={capturedImageRef} className="captured-image" alt="Captured" />
      </div>

      <h3>Adjust Skin Factors</h3>
      <div className="factors-grid">
        {Object.keys(skinFactors).map((factor) => (
          <div className="factor-container" key={factor}>
            <label>{factor.replace("_", " ")}: {skinFactors[factor]}</label>
            <input 
              type="range" 
              name={factor} 
              min="1" 
              max="5" 
              value={skinFactors[factor]} 
              onChange={handleChange} 
              className="factor-slider" 
            />
          </div>
        ))}
      </div>

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
