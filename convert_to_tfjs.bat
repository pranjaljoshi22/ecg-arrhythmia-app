@echo off
echo ========================================================
echo TensorFlow.js Model Converter
echo ========================================================
echo This script will install 'tensorflowjs' via pip
echo and convert your best_model.h5 into a format the
echo web browser can understand for offline execution.
echo.

echo [1/3] Installing tensorflowjs converter package...
pip install tensorflowjs
echo.

echo [2/3] Preparing output directory...
mkdir "%~dp0\frontend\tfjs_model" 2>nul
echo.

echo [3/3] Converting best_model.h5...
tensorflowjs_converter --input_format keras "%~dp0\ECG FINAL\best_model.h5" "%~dp0\frontend\tfjs_model"
echo.

echo ========================================================
echo CONVERSION COMPLETE!
echo If there are no errors above, you can now open 
echo frontend\index.html in your web browser.
echo ========================================================
