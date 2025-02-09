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
def preprocess_image(image_path, gender=None, skin_type=None):
    try:
        image = Image.open(image_path).convert("RGB")

        # Convert to grayscale for better age detection
        gray_image = image.convert("L")  

        # Enhance contrast (helps with washed-out images)
        enhancer = ImageEnhance.Contrast(gray_image)
        gray_image = enhancer.enhance(1.5)

        # Resize to 224x224 for better DeepFace processing
        gray_image = gray_image.resize((224, 224))

        # Additional preprocessing based on form inputs (gender, skin_type)
        if gender:
            # Maybe apply different filtering based on gender (e.g., different contrast adjustments)
            if gender.lower() == 'female':
                enhancer = ImageEnhance.Brightness(gray_image)
                gray_image = enhancer.enhance(1.2)
            elif gender.lower() == 'male':
                enhancer = ImageEnhance.Sharpness(gray_image)
                gray_image = enhancer.enhance(1.3)

        # Save the processed image
        gray_image.save(image_path, format="JPEG")
    except Exception as e:
        print("Preprocessing Error:", str(e))

# Analyze Age with Enhanced Processing
def analyze_image(image_path):
    try:
        analysis = DeepFace.analyze(
            img_path=image_path,
            actions=["age"],
            detector_backend="retinaface",
            enforce_detection=True  # Ensures only valid face images are analyzed
        )
        
        print("DeepFace Analysis:", analysis)  # Log the result to check what it returns

        # Extract the age prediction
        if isinstance(analysis, list) and len(analysis) > 0:
            return jsonify({"age": analysis[0].get("age", "Not detected")})
        
        return jsonify({"error": "Age prediction failed. No face detected."}), 400
    except Exception as e:
        print("Analysis error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return render_template('index.html')

# Upload from file
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    gender = request.form.get('gender')  # Get the gender input from the form
    skin_type = request.form.get('skin_type')  # Get the skin type input from the form

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        preprocess_image(file_path, gender, skin_type)  # Apply preprocessing based on form inputs
        return analyze_image(file_path)

    return jsonify({"error": "Invalid file type"}), 400

# Upload from webcam (client-side)
@app.route('/upload_webcam', methods=['POST'])
def upload_webcam():
    try:
        data = request.get_json()
        img_data = data.get('image')
        gender = data.get('gender')  # Gender from the client-side input
        skin_type = data.get('skin_type')  # Skin type from the client-side input

        if not img_data:
            return jsonify({"error": "No image data received"}), 400

        # Decode Base64 image
        header, encoded = img_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        image = Image.open(BytesIO(img_bytes)).convert("RGB")

        img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'captured_image.jpg')
        image.save(img_path, format='JPEG')

        preprocess_image(img_path, gender, skin_type)  # Apply preprocessing based on form inputs
        return analyze_image(img_path)
    except Exception as e:
        print("Webcam Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500

# Capture from server's webcam (for testing)
@app.route('/capture', methods=['GET'])
def capture_image():
    try:
        cap = cv2.VideoCapture(0)
        for _ in range(5):  # Capture multiple frames to improve accuracy
            ret, frame = cap.read()
            if ret:
                break
        cap.release()

        if ret:
            img_path = os.path.join(app.config['UPLOAD_FOLDER'], 'server_captured_image.jpg')
            cv2.imwrite(img_path, frame)
            return analyze_image(img_path)

        return jsonify({"error": "Failed to capture image"}), 500
    except Exception as e:
        print("Server Webcam Error:", str(e))
        return jsonify({"error": str(e)}), 500

# Run Flask app
if __name__ == "__main__":
    app.run(debug=True)
