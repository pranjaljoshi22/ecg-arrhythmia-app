import os
import sys
import traceback

def diagnose():
    print("--- DIAGNOSTIC START ---")
    try:
        import tensorflow as tf
        print("TensorFlow Version:", tf.__version__)
    except Exception as e:
        print("TensorFlow Import Failed:")
        traceback.print_exc()
        return

    try:
        from keras.models import load_model
    except Exception as e:
        print("Keras Import Failed:")
        traceback.print_exc()
        return

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(BASE_DIR, 'ECG FINAL', 'best_model.h5')
    
    print(f"Loading model from: {model_path}")
    print(f"File exists: {os.path.exists(model_path)}")
    
    if os.path.exists(model_path):
        try:
            m = load_model(model_path)
            print("Model loaded successfully!")
        except Exception as e:
            print("Model Load Failed with Exception:")
            traceback.print_exc()

if __name__ == '__main__':
    diagnose()
