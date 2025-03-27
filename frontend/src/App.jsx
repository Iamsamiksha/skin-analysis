import React from 'react';
import SkinAgePredictor from "./components/SkinAgePredictor";
import './App.css'; // Import CSS
// No need to import Results here, SkinAgePredictor handles it

function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">SkinVision AI</h1>
      <SkinAgePredictor />
    </div>
  );
}

export default App;