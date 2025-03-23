from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app  # Importing app.py
from flask import Flask, render_template, request, jsonify
app_server = FastAPI()

# Enable CORS for frontend communication
app_server.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321/results"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define route for message
@app_server.get("/api/message")
def get_message():
    insights = {}
    skin_quality_score = ''
    return render_template('index.html', insights=insights, skin_quality_score=skin_quality_score)

    try:
        return {"message": app.get_message()}
    except AttributeError:
        return {"error": "get_message() function not found in app.py"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app_server, host="127.0.0.1", port=8000)
