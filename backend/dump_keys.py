import h5py

def dump_keys(h5_path):
    with open("h5_keys.txt", "w", encoding="utf-8") as f_out:
        with h5py.File(h5_path, 'r') as f:
            def print_item(name, node):
                if isinstance(node, h5py.Dataset):
                    f_out.write(f"Dataset: {name} | Shape: {node.shape}\n")
            f.visititems(print_item)

if __name__ == '__main__':
    dump_keys(r"C:\Users\admin\OneDrive\Desktop\ECG FINAL\ECG FINAL\best_model.h5")
