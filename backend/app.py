from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import shutil
from model_utils import (
    load_ecg_model, get_csv_info, preprocess_row,
    predict_arrhythmia, generate_ecg_plot, generate_histogram
)

# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ECG_DATA_DIR = os.path.join(BASE_DIR, '..', 'ECG FINAL')
MODEL_PATH = os.path.join(ECG_DATA_DIR, 'best_model.h5')
UPLOAD_DIR = os.path.join(BASE_DIR, 'uploads')
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')

os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Flask App ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

# Load model at startup
try:
    print("Loading ECG model mathematically using NumPy Engine...")
    model = load_ecg_model(MODEL_PATH)
    model_load_error = None
    print("Model loaded successfully!")
except Exception as e:
    print("\n" + "="*50)
    print("CRITICAL ERROR LOADING MODEL:")
    print("="*50)
    import traceback
    traceback.print_exc()
    print("="*50)
    print("WARNING: The server will start, but prediction will fail.")
    model = None
    model_load_error = traceback.format_exc()


# ── Serve Frontend ─────────────────────────────────────────────────────────────
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'css'), filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'js'), filename)


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'assets'), filename)


# ── API Endpoints ──────────────────────────────────────────────────────────────
@app.route('/api/upload', methods=['POST'])
def upload_csv():
    """Upload a CSV file and return its metadata."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'Only CSV files are accepted'}), 400

    # Save uploaded file
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    file.save(filepath)

    try:
        info = get_csv_info(filepath)
        return jsonify({
            'success': True,
            'filename': file.filename,
            'rows': info['rows'],
            'columns': info['columns'],
        })
    except Exception as e:
        return jsonify({'error': f'Failed to read CSV: {str(e)}'}), 400


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Analyze a specific row of a CSV file for arrhythmia."""
    if model is None:
        return jsonify({'error': f"Model failed to load on server startup. \nTraceback: {model_load_error}"}), 500

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400

    filename = data.get('filename')
    row_number = data.get('row_number')

    if filename is None or row_number is None:
        return jsonify({'error': 'filename and row_number are required'}), 400

    row_number = int(row_number)

    # Check uploads first, then ECG FINAL directory
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        filepath = os.path.join(ECG_DATA_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': f'File not found: {filename}'}), 404

    try:
        # Preprocess
        X_processed, signal_data, df = preprocess_row(filepath, row_number)

        # Predict
        result = predict_arrhythmia(model, X_processed)

        # Generate plots
        ecg_plot = generate_ecg_plot(signal_data)
        histogram = generate_histogram(df)

        result['ecg_plot'] = ecg_plot
        result['histogram'] = histogram
        result['success'] = True

        return jsonify(result)

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/sample-data', methods=['GET'])
@app.route('/api/sample-data', methods=['GET'])
def get_sample():
    """Return metadata about the full ecg.csv dataset (~4,000+ rows)."""
    # Force ecg.csv for now to bypass any mitbih_test.csv path issues
    filepath = os.path.join(ECG_DATA_DIR, 'ecg.csv')
    
    print("-" * 30)
    print("DEMO REQUEST RECEIVED")
    print(f"Loading file: {filepath}")
    
    try:
        if not os.path.exists(filepath):
             return jsonify({'error': f'File not found: {filepath}'}), 404
             
        info = get_csv_info(filepath)
        print(f"SUCCESS: Found {info['rows']} rows.")
        print("-" * 30)
        return jsonify({
            'filename': 'ecg.csv',
            'rows': info['rows'],
            'columns': info['columns']
        })
    except Exception as e:
        print(f"ERROR: {e}")
        return jsonify({'error': str(e)}), 500


# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on 0.0.0.0:{port}...")
    app.run(debug=False, host='0.0.0.0', port=port)

