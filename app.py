import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Allowed extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Path to save uploaded images
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Route for the homepage
@app.route('/')
def index():
    return render_template('index.html')

# Route for uploading an image
@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Analyzing the uploaded image
            analysis = DeepFace.analyze(img_path=file_path, actions=["age"], model_name="VGG-Face", detector_backend="retinaface")
            
            return jsonify(analysis)

        return jsonify({"error": "Invalid file type"}), 400
    
    except Exception as e:
        # Catching any other errors and logging them
        return jsonify({"error": str(e)}), 500

# Route for capturing image from webcam
@app.route('/capture', methods=['GET'])
def capture_image():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    # Convert the captured frame to image
    if ret:
        # Save the image temporarily to be analyzed
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'captured_image.jpg')
        cv2.imwrite(img_path, frame)

        # Analyze the captured image using DeepFace
        analysis = DeepFace.analyze(img_path=img_path, actions=["age"], model_name="VGG-Face", detector_backend="retinaface")

        # Return the analysis result
        return jsonify(analysis)
    
    return jsonify({"error": "Failed to capture image"})

if __name__ == "__main__":
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True)
