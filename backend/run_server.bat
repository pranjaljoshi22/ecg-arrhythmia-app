@echo off
echo ========================================================
echo ECG Arrhythmia Server - Raw NumPy Mode
echo ========================================================
echo.
echo Installing lightweight dependencies (no TensorFlow required)...
python -m pip install flask flask-cors pandas matplotlib numpy h5py --quiet
echo.
echo Starting Flask Server...
python app.py

echo.
echo Server has stopped. 
pause
