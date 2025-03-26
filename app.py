import os
import base64
from io import BytesIO
from PIL import Image, ImageEnhance
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS  # Corrected CORS import
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # CORS should be initialized after the Flask app

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = '/tmp'  # Suitable for temporary files
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure the directory exists

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
def calculate_skin_quality(dark_circles, wrinkles, evenness, pigmentation, real_age):
    age_factor = (real_age ** 2) / 200
    skin_quality_score = max(0, 100 - (
        0.25 * dark_circles +
        0.25 * wrinkles +
        0.20 * evenness +
        0.20 * pigmentation +
        0.10 * age_factor
    ))
    return round(skin_quality_score, 2)

def analyze_skin_quality(image_path):
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    dark_areas = np.sum(gray < 50) / (gray.size) * 100
    wrinkle_intensity = np.sum(edges) / (edges.size * 255) * 100
    evenness = np.std(gray)
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    pigmentation = np.std(a_channel) + np.std(b_channel)

    insights = {
        "dark_circles": "Mild" if dark_areas < 20 else "Noticeable" if dark_areas < 30 else "Prominent",
        "wrinkles": "Smooth" if wrinkle_intensity < 15 else "Few lines" if wrinkle_intensity < 25 else "Visible",
        "evenness": "Even" if evenness < 80 else "Slight unevenness" if evenness < 100 else "Noticeable unevenness",
        "pigmentation": "Minimal" if pigmentation < 20 else "Moderate" if pigmentation < 40 else "High"
    }
    return calculate_skin_quality(dark_areas, wrinkle_intensity, evenness, pigmentation, 0), insights

# Age Analysis
def analyze_image(image_path):
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 6, minSize=(80, 80), flags=cv2.CASCADE_SCALE_IMAGE)

    if len(faces) > 0:
        (x, y, w, h) = faces[0]
        face_img = gray[y:y+h, x:x+w]
        edges = cv2.Canny(face_img, 30, 100)
        wrinkle_intensity = np.sum(edges) / (edges.size * 255) * 100
        estimated_age = 20 + int(wrinkle_intensity)
        modified_age = estimated_age - 18  # Subtract 18
        return max(1, min(modified_age, 80))  # Keep within 1-80
    else:
        return -1  # No face detected

# Calculate Skin Age
def calculate_skin_age(real_age, skin_quality_score, skin_factors):
    if not isinstance(real_age, (int, float)) or real_age <= 0:
        return -1  # Return -1 for invalid input

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
    return max(1, skin_age)  # Ensure skin_age is at least 1

@app.route('/')
def index():
    return render_template('index.html', insights={}, skin_quality_score='')

@app.route('/upload_webcam', methods=['POST'])
def upload_webcam():
    try:
        data = request.get_json()
        img_data = data.get('image')
        skin_factors = data.get('skin_factors', {})

        if not img_data:
            return jsonify({"error": "No image data"}), 400

        header, encoded = img_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        image = Image.open(BytesIO(img_bytes)).convert("RGB")
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'captured_image.jpg')
        image.save(img_path, format='JPEG')

        preprocess_image(img_path)
        real_age = analyze_image(img_path)
        skin_quality_score, insights = analyze_skin_quality(img_path)
        skin_age = calculate_skin_age(real_age, skin_quality_score, skin_factors)

        return jsonify({
            "real_age": real_age,
            "skin_quality_score": skin_quality_score,
            "skin_age": skin_age,
            "insights": insights
        })

    except Exception as e:
        print("Webcam Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500  # Return specific error

if __name__ == "__main__":
    app.run(debug=True)  # Corrected debug statement
