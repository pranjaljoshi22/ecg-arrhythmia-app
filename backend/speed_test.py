import time
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

print("Starting performance test...")
start_time = time.time()

try:
    print("1. Reading large CSV (simulating backend load)")
    csv_path = '../ECG FINAL/mitbih_test.csv'
    t0 = time.time()
    df = pd.read_csv(csv_path, header=None)
    df[0] = df[0].astype(int)
    print(f"Read {len(df)} rows in {time.time()-t0:.2f} seconds")

    print("2. Testing histogram generation")
    class_number = 0
    min_col = 5
    max_col = 70
    bins = 65

    t0 = time.time()
    img = df.loc[df[140] == class_number].values
    img = img[:, min_col:max_col]
    img_flatten = img.flatten()
    print(f"Extraction took {time.time()-t0:.2f} seconds")

    t0 = time.time()
    final1 = np.tile(np.arange(min_col, max_col), img.shape[0])
    print(f"np.tile took {time.time()-t0:.2f} seconds (length = {len(final1)})")

    t0 = time.time()
    fig, ax = plt.subplots()
    h = ax.hist2d(final1, img_flatten, bins=(bins, bins), cmap='magma')
    print(f"hist2d compute took {time.time()-t0:.2f} seconds")

    print(f"\nTOTAL TIME: {time.time()-start_time:.2f} seconds")
except Exception as e:
    import traceback
    traceback.print_exc()
