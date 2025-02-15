import os
import base64
from io import BytesIO
from PIL import Image, ImageEnhance
import cv2
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Function to validate file type
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Preprocess Image for Better Age Prediction
def preprocess_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        gray_image = image.convert("L")  # Convert to grayscale
        enhancer = ImageEnhance.Contrast(gray_image)
        gray_image = enhancer.enhance(1.5)
        gray_image = gray_image.resize((224, 224))
        gray_image.save(image_path, format="JPEG")
    except Exception as e:
        print("Preprocessing Error:", str(e))

# Analyze Age with Adjusted Accuracy
def analyze_image(image_path):
    try:
        analysis = DeepFace.analyze(
            img_path=image_path,
            actions=["age"],
            detector_backend="retinaface",
            enforce_detection=True
        )
        
        if isinstance(analysis, list) and len(analysis) > 0:
            real_age = analysis[0].get("age", "Not detected")
            if isinstance(real_age, int):
                real_age = max(1, real_age - 8)  # Adjusting for overestimation
            return real_age
        return None
    except Exception as e:
        print("Analysis error:", str(e))
        return None

# Calculate Skin Age Based on Parameters
def calculate_skin_age(real_age, skin_factors):
    if real_age is None:
        return "Error in predicting real age"
    
    adjustments = {
        "sun_exposure": {"very_low": -1, "low": 0, "moderate": 1, "high": 2, "very_high": 3},
        "sleep_cycle": {"very_low": 2, "low": 1, "moderate": 0, "high": -1, "very_high": -2},
        "diet_level": {"very_poor": 3, "poor": 2, "moderate": 1, "healthy": 0, "very_healthy": -1},
        "stress_level": {"very_low": -2, "low": -1, "moderate": 0, "high": 1, "very_high": 2},
        "water_intake": {"very_low": 3, "low": 2, "moderate": 1, "high": 0, "very_high": -1}
    }
    
    skin_age_adjustment = sum(adjustments[param].get(skin_factors.get(param, "moderate"), 0) for param in adjustments)
    
    skin_age = real_age + skin_age_adjustment
    return max(1, skin_age)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload_webcam', methods=['POST'])
def upload_webcam():
    try:
        data = request.get_json()
        img_data = data.get('image')
        skin_factors = data.get('skin_factors', {})
        
        if not img_data:
            return jsonify({"error": "No image data received"}), 400
        
        header, encoded = img_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        image = Image.open(BytesIO(img_bytes)).convert("RGB")
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'captured_image.jpg')
        image.save(img_path, format='JPEG')
        
        preprocess_image(img_path)
        real_age = analyze_image(img_path)
        skin_age = calculate_skin_age(real_age, skin_factors)
        
        return jsonify({"real_age": real_age, "skin_age": skin_age, "image_path": img_path})
    except Exception as e:
        print("Webcam Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
