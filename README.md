StepCounterApp: A Complete Guide
Project Overview
StepCounterApp is a comprehensive full-stack application that tracks and analyzes step count data. The system consists of an Android mobile application, a Flask backend API, and an interactive web dashboard for data visualization.
✨ Features

Mobile App: Real-time step counting, clean user interface with a count of steps.

Backend API: RESTful API for data processing and storage.

Web Dashboard: Real-time analytics and visualization of step data with interactive charts.
🛠️ Technology Stack & Software Versions

For the best compatibility, it is recommended to use the following versions or newer:

Component	Technology	Recommended Version
Mobile App	Android SDK	API 28 (Android 9.0) or later
Backend API	Python, Flask	Python 3.8+, Flask 2.3.3
Database	MongoDB	MongoDB Atlas (Cloud)
Web Dashboard	HTML5, CSS3, JavaScript, Chart.js	Chart.js 4.0+
Build Tools	Gradle, pip	As included in Android Studio and Python

🚀 Guide to Run the Application

# Backend Setup

# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
The backend API will be running at http://localhost:5000.

# Web Dashboard Setup
# Navigate to the web-dashboard directory
cd web-dashboard

# Start a local web server
python -m http.server 8000
Access the dashboard by opening http://localhost:8000 in your web browser.

# Mobile App Setup

Open the mobile-app project folder in Android Studio.
Let the project sync with Gradle.
Connect an Android device or create an emulator.
Build and run the application.

📁 Project Structure
StepCounterApp/
├── 📱 mobile-app/          # Android Application
├── 🖥️ backend/            # Flask Backend API
├── 🌐 web-dashboard/       # Interactive Web Dashboard
└── 📄 README.md            # This file
All the required source code files for the mobile app, backend, and web dashboard are available in their respective directories on the GitHub repository.

# Key Implementation Notes
Sensor Accuracy: The mobile app uses the device's built-in step sensor or accelerometer. Accuracy can vary between devices, and some may stop counting when the screen is locked due to system limitations.
Data Privacy: The application is designed with privacy in mind. No personal data is shared with third parties.
