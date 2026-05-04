# ECG Arrhythmia Detection & Medical Assistant

An intelligent web application designed to analyze Electrocardiogram (ECG) data to detect arrhythmias and provide automated medical advice. The application uses a machine learning inference engine to classify ECG readings and features an integrated AI chatbot that offers tailored diet, exercise, and lifestyle recommendations based on the detected condition.

## Features

- **ECG Analysis Engine**: Fast and efficient detection of arrhythmias using a customized machine learning model.
- **AI Medical Assistant**: An integrated chatbot that automatically provides treatment suggestions, dietary guidelines, and exercise plans when an arrhythmia is detected.
- **Modern User Interface**: A responsive and visually appealing web interface for easy uploading of ECG data and real-time interaction.
- **Decoupled Architecture**: Built with a Flask Python backend API and a vanilla HTML/CSS/JS frontend for easy maintenance and deployment.

## Tech Stack

- **Backend**: Python, Flask, Flask-CORS
- **Machine Learning**: TensorFlow, Keras, NumPy, Pandas
- **Frontend**: HTML5, CSS3, JavaScript
- **AI Integration**: AI chatbot for personalized medical recommendations

## Project Structure

```
ECG FINAL/
│
├── backend/
│   ├── app.py                # Main Flask application and API routes
│   ├── model_utils.py        # Machine learning inference logic
│   ├── requirements.txt      # Python dependencies
│   └── ...                   # Model weights and other backend scripts
│
├── frontend/
│   ├── index.html            # Main web interface
│   ├── css/
│   │   └── style.css         # UI styling
│   └── js/
│       ├── app.js            # Frontend logic and API communication
│       └── chatbot.js        # Chatbot UI and interaction logic
│
└── README.md                 # Project documentation
```

## How to Run Locally

### 1. Start the Backend Server

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create and activate a virtual environment.
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
   The backend API will start running (typically on `http://127.0.0.1:5000`).

### 2. Launch the Frontend

1. You do not need a build process for the frontend. You can simply open the `frontend/index.html` file in your web browser.
2. Alternatively, you can serve it using a simple HTTP server (e.g., using VS Code Live Server or Python's `http.server`).
   ```bash
   cd frontend
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000` in your web browser to use the application.

## Disclaimer

**Medical Disclaimer**: This application is intended for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## License

MIT License
