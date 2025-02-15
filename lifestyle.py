from flask import Flask, request, render_template, redirect, url_for
from flask_pymongo import PyMongo
import datetime
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Initialize Flask application
app = Flask(__name__)

# MongoDB URI - Replace <db_password> with your actual password
uri = "mongodb+srv://imsrish20:<db_password>@lifestyle.0fabx.mongodb.net/?retryWrites=true&w=majority&appName=Lifestyle"

# Create a new client and connect to the MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))

# Check if MongoDB connection is successful
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print("Failed to connect to MongoDB:", e)

# Access the database
db = client['Skin_analysis']  # Replace 'Skin_analysis' with your database name

# Select the collection
collection = db['Lifestyle']  # Replace 'Lifestyle' with your collection name

# Initialize PyMongo with the Flask app
mongo = PyMongo(app)

# Define the Lifestyle class for storing the form data
class Lifestyle:
    def __init__(self, water_points, sleep_points, stress_points, sun_points):
        self.water_points = water_points
        self.sleep_points = sleep_points
        self.stress_points = stress_points
        self.sun_points = sun_points
        self.timestamp = datetime.datetime.utcnow()

    def to_dict(self):
        return {
            "water_points": self.water_points,
            "sleep_points": self.sleep_points,
            "stress_points": self.stress_points,
            "sun_points": self.sun_points,
            "timestamp": self.timestamp
        }

# Route for the lifestyle form
@app.route('/lifestyle', methods=['GET', 'POST'])
def lifestyle():
    if request.method == 'POST':
        # Collect form data
        water_intake = float(request.form['waterIntake'])
        sleep_hours = int(request.form['sleepHours'])
        stress_level = request.form['stressLevel']
        sun_exposure = request.form['sunExposure']

        # Calculate points based on lifestyle
        water_points = calculateWaterPoints(water_intake)
        sleep_points = calculateSleepPoints(sleep_hours)
        stress_points = calculateStressPoints(stress_level)
        sun_points = calculateSunPoints(sun_exposure)

        # Save the data to MongoDB
        lifestyle = Lifestyle(water_points, sleep_points, stress_points, sun_points)
        mongo.db.lifestyles.insert_one(lifestyle.to_dict())

        # Redirect to the age prediction page
        return redirect(url_for('predict_age'))

    return render_template('lifestyle.html')

# Points calculation functions
def calculateWaterPoints(waterIntake):
    if waterIntake <= 1:
        return 1
    if waterIntake <= 2:
        return 3
    return 5

def calculateSleepPoints(sleepHours):
    if sleepHours < 5:
        return 1
    if sleepHours <= 7:
        return 3
    return 5

def calculateStressPoints(stressLevel):
    if stressLevel == "high":
        return 1
    if stressLevel == "moderate":
        return 3
    return 5

def calculateSunPoints(sunExposure):
    if sunExposure == "high":
        return 1
    if sunExposure == "moderate":
        return 3
    return 5

# Start the Flask app
if __name__ == "__main__":
    app.run(debug=True)
