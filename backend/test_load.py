import sys
import traceback

print("Testing model load...")
try:
    import tensorflow as tf
    print("TensorFlow Version:", tf.__version__)
    from keras.models import load_model
    print("Keras load_model imported")
    m = load_model('../ECG FINAL/best_model.h5')
    print("Model loaded successfully")
except Exception as e:
    print("Error loading model:")
    traceback.print_exc()
