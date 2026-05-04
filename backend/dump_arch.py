import h5py

def dump_h5_architecture(model_path):
    print("Opening model with h5py...")
    with h5py.File(model_path, 'r') as f:
        # Keras puts architecture in attrs['model_config']
        if 'model_config' in f.attrs:
            config = f.attrs['model_config']
            try:
                # In newer h5py, string attrs are bytes
                config_str = config.decode('utf-8')
            except AttributeError:
                config_str = config
            print("Model Config found!")
            with open("model_architecture.json", "w", encoding="utf-8") as out:
                out.write(config_str)
            print("Wrote model_architecture.json")
        else:
            print("No model_config found in root attributes.")
            print("Keys available:", list(f.keys()))
            if 'model_weights' in f.keys():
                print("Weights group keys:", list(f['model_weights'].keys()))

if __name__ == '__main__':
    dump_h5_architecture(r"C:\Users\admin\OneDrive\Desktop\ECG FINAL\ECG FINAL\best_model.h5")
