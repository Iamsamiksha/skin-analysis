import os

# Disable GPU to avoid CUDA errors
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Optional: Limit TensorFlow memory growth to avoid crashes
import tensorflow as tf
tf.config.set_logical_device_configuration(
    tf.config.list_physical_devices('CPU')[0],
    [tf.config.LogicalDeviceConfiguration()]
)
import os
import base64
from io import BytesIO
from PIL import Image, ImageEnhance
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from werkzeug.utils import secure_filename
from flask import make_response

app = Flask(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = '/tmp'
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
def calculate_skin_quality(dark_circles, wrinkles, evenness, pigmentation, real_age):
    age_factor = (real_age ** 2) / 200  # Non-linear age impact
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
    
    insights = {
        "dark_circles": "Mild dark circles" if dark_areas < 20 else "Noticeable dark circles" if dark_areas < 30 else "Prominent dark circles",
        "wrinkles": "Smooth skin" if wrinkle_intensity < 15 else "Few fine lines" if wrinkle_intensity < 25 else "Visible wrinkles",
        "evenness": "Even skin tone" if evenness < 80 else "Slight unevenness" if evenness < 100 else "Noticeable uneven skin tone",
        "pigmentation": "Minimal pigmentation" if pigmentation < 20 else "Moderate pigmentation" if pigmentation < 40 else "High pigmentation"
    }

    # Calculate skin quality score
    return calculate_skin_quality(dark_areas, wrinkle_intensity, evenness, pigmentation, 25), insights  # Default real_age=25 for testing

# Age Analysis
def analyze_image(image_path):
    try:
        # Convert the image to a proper format before passing it to DeepFace
        image = cv2.imread(image_path)
        if image is None:
            print("Error: Image not loaded properly.")
            return None

        # Ensure DeepFace does not receive a KerasTensor
        analysis = DeepFace.analyze(img_path=image_path, actions=["age"], detector_backend="retinaface", enforce_detection=False)

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


def get_message():
    return "Hello from FastAPI Backend in app.py!"


@app.route('/')
def index():
    insights = {}
    skin_quality_score = ''
    return render_template('index.html', insights=insights, skin_quality_score=skin_quality_score)

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
 
         # Load the image for face detection
         img_cv2 = cv2.imread(img_path)
         if img_cv2 is None:
             return jsonify({"error": "Failed to read the uploaded image."}), 400

         gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)
 
         # Load OpenCV pre-trained face detector
         face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
         faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
 
         img_area = img_cv2.shape[0] * img_cv2.shape[1]
 
         # If no face is detected, check if the image is too close by detecting large contours
         if len(faces) == 0:
             _, thresh = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY)
             contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
             for contour in contours:
                 contour_area = cv2.contourArea(contour)
                 if contour_area / img_area > 0.70:
                     return jsonify({"error": "Face too close to the camera. Step back."}), 400
             return jsonify({"error": "No face detected. Please ensure your face is visible in the frame."}), 400
 
         if len(faces) > 1:
             return jsonify({"error": "Multiple faces detected. Please capture an image with only one person."}), 400
         
         # Check if the face is too small or too large (too far or too close)
         (x, y, w, h) = faces[0]
         face_area = w * h
 
         if face_area / img_area < 0.20:
             return jsonify({"error": "Face too far from the camera. Move closer."}), 400
         
         if face_area / img_area > 0.75:
             return jsonify({"error": "Face too close to the camera. Step back."}), 400
 
         # Check brightness (lighting conditions)
         brightness = np.mean(gray)
         if brightness < 90:
             return jsonify({"error": "Low lighting detected. Please improve lighting conditions."}), 400
         elif brightness > 250:
             return jsonify({"error": "Overexposed image detected. Reduce lighting or avoid direct sunlight."}), 400
 
         preprocess_image(img_path)
         real_age = analyze_image(img_path)
         skin_quality_score, insights = analyze_skin_quality(img_path)
         skin_age = calculate_skin_age(real_age, skin_quality_score, skin_factors)
         
         return jsonify({
             "real_age": real_age,
             "skin_quality_score": skin_quality_score,
             "skin_age": skin_age,
             "insights": insights,
             "image_path": img_path
         })
 
     except Exception as e:
         print("Webcam Upload Error:", str(e))
         return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)