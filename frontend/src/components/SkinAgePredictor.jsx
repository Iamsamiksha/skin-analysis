import { useEffect, useRef, useState } from "react";

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
  const [result, setResult] = useState("");
  const [insights, setInsights] = useState({});
  const [skinScore, setSkinScore] = useState("");

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
      setResult(`❌ Error: ${data.error}`);
    } else {
      setResult(`✅ Real Age: ${data.real_age}, Skin Age: ${data.skin_age}`);
      setInsights(data.insights);
      setSkinScore(data.skin_quality_score);
    }
  };

  const handleChange = (e) => {
    setSkinFactors({ ...skinFactors, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <h2>Skin Age & Real Age Prediction</h2>

      <div id="video-container">
        <video ref={videoRef} width="400" height="300" autoPlay></video>
      </div>
      <button onClick={captureImage}>📸 Capture</button>

      <canvas ref={canvasRef} width="400" height="300" style={{ display: "none" }}></canvas>
      <img ref={capturedImageRef} style={{ display: "none" }} />

      <h3>Skin Factors</h3>
      {["sun_exposure", "sleep_cycle", "diet_level", "stress_level", "water_intake"].map((factor) => (
        <div className="factor-container" key={factor}>
          <label>{factor.replace("_", " ")}:</label>
          <select name={factor} value={skinFactors[factor]} onChange={handleChange}>
            <option value="very_low">Very Low</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>
      ))}

      <button onClick={handlePrediction}>🔍 Predict Age</button>
      <h3>{result}</h3>

      <button>
        <a href="http://localhost:4321/results">Get Result</a>
      </button>

      <div>
        <h3>Skin Insights:</h3>
        {Object.entries(insights).map(([key, value]) => (
          <p key={key}><b>{key.replace(/_/g, " ")}:</b> {value}</p>
        ))}
      </div>

      <div>Skin Score: {skinScore}</div>
    </div>
  );
};

export default SkinAgePredictor;
