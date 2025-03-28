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

# Preprocess Image - DOES NOT SAVE THE GREY IMAGE
def preprocess_image(image_path):
    try:
        image = Image.open(image_path).convert("RGB")
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        image = image.resize((224, 224))
        image.save(image_path, format="JPEG") #Saves processed image over original
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

    print("a_channel std:", np.std(a_channel))
    print("b_channel std:", np.std(b_channel))
    pigmentation = np.std(a_channel) + np.std(b_channel)
    print("pigmentation:", pigmentation)


    insights = {
        "dark_circles": "Mild" if dark_areas < 15 else "Noticeable" if dark_areas < 25 else "Prominent",
        "wrinkles": "Smooth" if wrinkle_intensity < 15 else "Few lines" if wrinkle_intensity < 25 else "Visible",
        "evenness": "Even" if evenness < 60 else "Slight unevenness" if evenness < 90 else "Noticeable unevenness",
        "pigmentation": "Minimal" if pigmentation < 10 else "Moderate" if pigmentation < 30 else "High"
    }
    numeric_insights = {
        "dark_circles": 1 if dark_areas < 15 else 2 if dark_areas < 25 else 3,
        "wrinkles": 1 if wrinkle_intensity < 15 else 2 if wrinkle_intensity < 25 else 3,
        "evenness": 1 if evenness < 60 else 2 if evenness < 90 else 3,
        "pigmentation": 1 if pigmentation < 10 else 2 if pigmentation < 30 else 3
    }

    real_data = {
        "dark_circles": dark_areas,
        "wrinkles": wrinkle_intensity,
        "evenness": evenness,
        "pigmentation": pigmentation
    }
    return calculate_skin_quality(dark_areas, wrinkle_intensity, evenness, pigmentation, 0), insights, numeric_insights, real_data

# Age Analysis - No Changes Needed
def analyze_image(image_path):
    image = cv2.imread(image_path)

    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return -1, "Error: Could not load image. Please try again."

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 6, minSize=(80, 80), flags=cv2.CASCADE_SCALE_IMAGE)

    if len(faces) > 1:
        return -1, "Multiple faces detected. Please ensure only one face is in the frame."
    elif len(faces) > 0:
        (x, y, w, h) = faces[0]
        face_img = gray[y:y+h, x:x+w]
        edges = cv2.Canny(face_img, 30, 100)
        wrinkle_intensity = np.sum(edges) / (edges.size * 255) * 100
        estimated_age = 20 + int(wrinkle_intensity)
        modified_age = estimated_age - 15  # Subtract 18
        return max(1, min(modified_age, 80)), None  # Keep within 1-80
    else:
        return -1, "No face detected. Please make sure your face is clearly visible in the frame."

# Calculate Skin Age - No changes needed
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

def get_average_data_for_age(real_age):
    if 0 <= real_age <= 15:
        return {"Wrinkles": 3, "Dark_Circles": 4, "Pigmentation": 5, "Evenness": 50}  # Example values
    elif 16 <= real_age <= 30:
        return {"Wrinkles": 7, "Dark_circles": 6, "Pigmentation": 15, "Evenness": 58}  # Example values
    elif 31 <= real_age <= 45:
        return {"Wrinkles": 12, "Dark_circles": 9, "Pigmentation": 20, "Evenness": 70}  # Example values
    else:
        return {"Wrinkles": 15, "Dark_circles": 10, "Pigmentation": 20, "Evenness": 60}  # Example values

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

        # Analyze with the same image
        real_age, age_error_message = analyze_image(img_path)

        if age_error_message:
            return jsonify({
                "real_age": -1,
                "skin_quality_score": None,
                "skin_age": -1,
                "insights": {},
                "numeric_insights": {},
                "average_data": {},
                "real_data": {},
                "age_error_message": age_error_message
            })

        skin_quality_score, insights, numeric_insights, real_data = analyze_skin_quality(img_path)

        # Get average values
        average_data = get_average_data_for_age(real_age)
        
        # Prepare data for numeric_insights based on real skin analysis results and insights
        numeric_insights = {
            "dark_circles": 1 if insights["dark_circles"] == "Mild" else 2 if insights["dark_circles"] == "Noticeable" else 3,
            "wrinkles": 1 if insights["wrinkles"] == "Smooth" else 2 if insights["wrinkles"] == "Few lines" else 3,
            "evenness": 1 if insights["evenness"] == "Even" else 2 if insights["evenness"] == "Slight unevenness" else 3,
            "pigmentation": 1 if insights["pigmentation"] == "Minimal" else 2 if insights["pigmentation"] == "Moderate" else 3
        }

        # Explicitly convert NumPy values to standard Python types:
        real_age = int(real_age) if real_age != -1 else -1
        skin_quality_score = float(skin_quality_score)
        average_data = {k: int(v) for k, v in average_data.items()}
        real_data = {k: float(v) for k, v in real_data.items()}  # Convert real_data too!

        skin_age = calculate_skin_age(real_age, skin_quality_score, skin_factors)

        return jsonify({
            "real_age": real_age,
            "skin_quality_score": skin_quality_score,
            "skin_age": skin_age,
            "insights": insights,
            "numeric_insights": numeric_insights,
            "average_data": average_data,
            "real_data": real_data,
            "age_error_message": None  # Clear error message if no error
        })

    except Exception as e:
        print("Webcam Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500  # Return specific error

if __name__ == "__main__":
    app.run(debug=True)