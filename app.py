import os
import base64
from io import BytesIO
from PIL import Image, ImageEnhance
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Preprocess Image
def preprocess_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        gray_image = image.convert("L")
        enhancer = ImageEnhance.Contrast(gray_image)
        gray_image = enhancer.enhance(1.5)
        gray_image = gray_image.resize((224, 224))
        gray_image.save(image_path, format="JPEG")
    except Exception as e:
        print("Preprocessing Error:", str(e))

# Skin Quality Analysis
def analyze_skin_quality(image_path):
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    # Dark Circles and Dark Spots Detection
    dark_areas = np.sum(gray < 50) / (gray.size) * 100
    
    # Fine Lines and Wrinkles Detection
    wrinkle_intensity = np.sum(edges) / (edges.size * 255) * 100
    
    # Evenness (Standard Deviation of Intensity)
    evenness = np.std(gray)
    
    # Pigmentation (Variance in Color)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    pigmentation = np.std(a_channel) + np.std(b_channel)
    
    skin_quality_score = max(0, 100 - (dark_areas * 0.3 + wrinkle_intensity * 0.3 + evenness * 0.2 + pigmentation * 0.2))
    insights = {
        "dark_circles": "Mild dark circles" if dark_areas < 10 else "Noticeable dark circles" if dark_areas < 20 else "Prominent dark circles",
        "wrinkles": "Smooth skin" if wrinkle_intensity < 5 else "Few fine lines" if wrinkle_intensity < 15 else "Visible wrinkles",
        "evenness": "Even skin tone" if evenness < 20 else "Slight unevenness" if evenness < 30 else "Noticeable uneven skin tone",
        "pigmentation": "Minimal pigmentation" if pigmentation < 20 else "Moderate pigmentation" if pigmentation < 40 else "High pigmentation"
    }
    print(insights)
    print(skin_quality_score)
    return skin_quality_score, insights

# Age Analysis
def analyze_image(image_path):
    try:
        analysis = DeepFace.analyze(img_path=image_path, actions=["age"], detector_backend="retinaface", enforce_detection=True)
        if isinstance(analysis, list) and len(analysis) > 0:
            real_age = analysis[0].get("age", "Not detected")
            if isinstance(real_age, int):
                real_age = max(1, real_age - 8)  # Adjusting for overestimation
            return real_age
        return None
    except Exception as e:
        print("Analysis error:", str(e))
        return None

# Calculate Skin Age
def calculate_skin_age(real_age, skin_quality_score, skin_factors):
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
    skin_quality_adjustment = (100 - skin_quality_score) // 10
    
    skin_age = real_age + skin_age_adjustment + skin_quality_adjustment
    return max(1, skin_age)

@app.route('/')
def index():
    insights = {}
    skin_quality_score = ''
    return render_template('index.html', insights=insights,skin_quality_score=skin_quality_score)


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
        skin_quality_score, insights = analyze_skin_quality(img_path)
        skin_age = calculate_skin_age(real_age, skin_quality_score, skin_factors)
        
        return jsonify({"real_age": real_age, "skin_quality_score": skin_quality_score, "skin_age": skin_age, "insights": insights, "image_path": img_path})
    except Exception as e:
        print("Webcam Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)