import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server use
import matplotlib.pyplot as plt
import io
import base64
import os

# Class mapping for arrhythmia types
CLASS_MAPPING = {
    0: 'Normal',
    1: 'Supraventricular Ectopic Beats',
    2: 'Ventricular Ectopic Beats',
    3: 'Fusion Beats',
    4: 'Unknown Beats',
}

CLASS_DESCRIPTIONS = {
    0: "Normal beats, also known as sinus rhythm, are the standard and regular heartbeats. They originate from the heart's natural pacemaker, the sinoatrial (SA) node, and follow a consistent pattern. These beats maintain the optimal rhythm of the heart, ensuring efficient blood circulation.",
    1: "Supraventricular ectopic beats are abnormal heartbeats that arise above the ventricles but outside the normal pathway of the SA node. These beats can be premature, irregular, or extra beats, often resulting from electrical disturbances in the atria. They may disrupt the heart's regular rhythm.",
    2: "Ventricular ectopic beats are abnormal heartbeats originating from the ventricles, the lower chambers of the heart. These beats are usually premature and can be caused by various factors, such as heart disease or stress. Ventricular ectopic beats may feel like a skipped or extra beat and can potentially lead to more severe arrhythmias.",
    3: "Fusion beats are a unique type of heart rhythm irregularity that occurs when a normal beat and a premature beat from another source coincide or 'fuse' together on the electrocardiogram (ECG). These beats are challenging to differentiate from other types of beats and often appear as a combination of normal and abnormal characteristics.",
    4: "Unknown beats refer to heart rhythms that are difficult to classify or identify. These beats may not fit into the typical categories of normal, supraventricular, or ventricular beats. Accurate diagnosis and treatment of unknown beats can be challenging and may require further investigation or specialized testing to determine their origin and significance.",
}

ARRHYTHMIA_DETAILS = {
    1: "These are arrhythmias that originate in the atria (upper chambers of the heart), such as atrial fibrillation, atrial flutter, or supraventricular tachycardia.",
    2: "These are arrhythmias that originate in the ventricles (lower chambers of the heart), such as premature ventricular contractions (PVCs) or ventricular tachycardia.",
}

RISK_LEVELS = {
    0: 'low',
    1: 'high',
    2: 'high',
    3: 'medium',
    4: 'medium',
}


def load_ecg_model(model_path):
    """Load the pre-trained Keras model using pure NumPy."""
    from numpy_inference import NumpyECGModel
    model = NumpyECGModel(model_path)
    return model


def get_csv_info(csv_path):
    """Get metadata about a CSV file without loading it fully into memory."""
    # Count rows efficiently by iterating lines (avoids loading 100MB+ into RAM)
    with open(csv_path, 'r') as f:
        row_count = sum(1 for _ in f)

    # Read only the first row to get column count
    first_row = pd.read_csv(csv_path, header=None, nrows=1)
    col_count = int(first_row.shape[1])

    return {
        'rows': row_count,
        'columns': col_count,
    }


def add_gaussian_noise(signal, target_length=186):
    """Pad or truncate signal to target_length with Gaussian noise."""
    current_length = len(signal)
    noise_length = target_length - current_length
    if noise_length > 0:
        noise = np.random.normal(0, 0.5, noise_length)
        return np.concatenate((signal, noise), axis=0)
    elif noise_length < 0:
        return signal[:target_length]
    else:
        return signal


def preprocess_row(csv_path, row_number):
    """Read a CSV and extract + preprocess a single row for prediction."""
    df = pd.read_csv(csv_path, header=None)
    df[0] = df[0].astype(int)

    if row_number < 0 or row_number >= df.shape[0]:
        raise ValueError(f"Row {row_number} is out of range. File has {df.shape[0]} rows (0-indexed).")

    # Extract features (first 186 columns)
    X_raw = df.iloc[row_number:row_number + 1, 0:186].values
    signal_data = X_raw[0].copy()

    # Apply Gaussian noise padding
    noisy_signals = []
    for i in range(X_raw.shape[0]):
        noisy_signal = add_gaussian_noise(X_raw[i], target_length=186)
        noisy_signals.append(noisy_signal)

    X_processed = np.array(noisy_signals)
    X_processed = X_processed.reshape(X_processed.shape[0], 186, 1)

    return X_processed, signal_data, df


def predict_arrhythmia(model, X_processed):
    """Run prediction and return results."""
    predictions = model.predict(X_processed)
    predicted_label = int(np.argmax(predictions, axis=1)[0])

    # Build confidence scores for all classes
    confidence_scores = {}
    for idx, class_name in CLASS_MAPPING.items():
        confidence_scores[class_name] = round(float(predictions[0][idx]) * 100, 2)

    result = {
        'predicted_class': predicted_label,
        'class_name': CLASS_MAPPING[predicted_label],
        'description': CLASS_DESCRIPTIONS[predicted_label],
        'risk_level': RISK_LEVELS[predicted_label],
        'is_arrhythmia': predicted_label in [1, 2],
        'arrhythmia_detail': ARRHYTHMIA_DETAILS.get(predicted_label, None),
        'confidence_scores': confidence_scores,
        'max_confidence': round(float(np.max(predictions[0])) * 100, 2),
    }

    return result


def generate_ecg_plot(signal_data):
    """Generate an ECG signal plot and return as base64 PNG."""
    plt.figure(figsize=(12, 5))
    plt.style.use('dark_background')

    fig, ax = plt.subplots(figsize=(12, 5))
    fig.patch.set_facecolor('#0a0e27')
    ax.set_facecolor('#0a0e27')

    ax.plot(signal_data, color='#00d4aa', linewidth=1.5, alpha=0.9)
    ax.fill_between(range(len(signal_data)), signal_data, alpha=0.1, color='#00d4aa')

    ax.set_title('ECG Signal Waveform', color='#e0e0e0', fontsize=16, fontweight='bold', pad=15)
    ax.set_xlabel('Time (samples)', color='#a0a0a0', fontsize=12)
    ax.set_ylabel('Amplitude', color='#a0a0a0', fontsize=12)

    ax.tick_params(colors='#666666')
    ax.spines['bottom'].set_color('#333333')
    ax.spines['left'].set_color('#333333')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(True, alpha=0.15, color='#00d4aa')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)

    return base64.b64encode(buf.read()).decode('utf-8')


def generate_histogram(df, class_number=0, min_col=5, max_col=70, bins=65):
    """Generate a 2D histogram and return as base64 PNG."""
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(12, 5))
    fig.patch.set_facecolor('#0a0e27')
    ax.set_facecolor('#0a0e27')

    try:
        img = df.loc[df[140] == class_number].values
        img = img[:, min_col:max_col]
        img_flatten = img.flatten()

        # FIX: Replaced O(N^2) concatenation loop with O(1) np.tile
        # This prevents the server from freezing on large datasets!
        final1 = np.tile(np.arange(min_col, max_col), img.shape[0])

        h = ax.hist2d(final1, img_flatten, bins=(bins, bins), cmap='magma')
        plt.colorbar(h[3], ax=ax, label='Count')
    except Exception:
        # If we can't generate the histogram with class data, create a simple one
        ax.text(0.5, 0.5, 'Insufficient data for histogram',
                transform=ax.transAxes, ha='center', va='center',
                color='#666666', fontsize=14)

    ax.set_title('ECG Signal Distribution (2D Histogram)', color='#e0e0e0', fontsize=16, fontweight='bold', pad=15)
    ax.set_xlabel('Feature Index', color='#a0a0a0', fontsize=12)
    ax.set_ylabel('Amplitude', color='#a0a0a0', fontsize=12)
    ax.tick_params(colors='#666666')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)

    return base64.b64encode(buf.read()).decode('utf-8')
