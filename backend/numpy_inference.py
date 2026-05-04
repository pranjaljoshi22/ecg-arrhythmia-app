import numpy as np
import h5py
import math

class NumpyECGModel:
    def __init__(self, h5_path):
        self.W = {}
        with h5py.File(h5_path, 'r') as f:
            weights = f['model_weights']
            for layer_name in weights.keys():
                self.W[layer_name] = {}
                for sub_layer in weights[layer_name].keys():
                    for param_key in weights[layer_name][sub_layer].keys():
                        clean_key = param_key.split(':')[0]
                        self.W[layer_name][clean_key] = weights[layer_name][sub_layer][param_key][()]

    def conv1d_valid(self, x, kernel, bias, stride=1):
        L, C_in = x.shape
        K, _, C_out = kernel.shape
        L_out = (L - K) // stride + 1
        out = np.zeros((L_out, C_out))
        for i in range(L_out):
            start = i * stride
            window = x[start:start+K, :]
            out[i, :] = np.tensordot(window, kernel, axes=([0, 1], [0, 1])) + bias
        return out

    def max_pool1d_same(self, x, pool_size, stride):
        L, C = x.shape
        L_out = int(np.ceil(L / stride))
        pad_len = max(0, (L_out - 1) * stride + pool_size - L)
        pad_left = pad_len // 2
        pad_right = pad_len - pad_left
        x_padded = np.pad(x, ((pad_left, pad_right), (0, 0)), constant_values=-np.inf)
        out = np.zeros((L_out, C))
        for i in range(L_out):
            start = i * stride
            window = x_padded[start:start+pool_size, :]
            out[i, :] = np.max(window, axis=0)
        return out

    def batch_norm(self, x, gamma, beta, mean, var, eps=0.001):
        return gamma * ((x - mean) / np.sqrt(var + eps)) + beta

    def predict(self, X):
        if len(X.shape) == 3:
            x = X[0]
        else:
            x = X

        # Layer 1
        x = self.conv1d_valid(x, self.W['conv1d']['kernel'], self.W['conv1d']['bias'])
        x = np.maximum(x, 0)
        bn = self.W['batch_normalization']
        x = self.batch_norm(x, bn['gamma'], bn['beta'], bn['moving_mean'], bn['moving_variance'])
        x = self.max_pool1d_same(x, 3, 2)
        
        # Layer 2
        x = self.conv1d_valid(x, self.W['conv1d_1']['kernel'], self.W['conv1d_1']['bias'])
        x = np.maximum(x, 0)
        bn1 = self.W['batch_normalization_1']
        x = self.batch_norm(x, bn1['gamma'], bn1['beta'], bn1['moving_mean'], bn1['moving_variance'])
        x = self.max_pool1d_same(x, 2, 2)
        
        # Layer 3
        x = self.conv1d_valid(x, self.W['conv1d_2']['kernel'], self.W['conv1d_2']['bias'])
        x = np.maximum(x, 0)
        bn2 = self.W['batch_normalization_2']
        x = self.batch_norm(x, bn2['gamma'], bn2['beta'], bn2['moving_mean'], bn2['moving_variance'])
        x = self.max_pool1d_same(x, 2, 2)
        
        # Flatten
        x = x.flatten()
        
        # Dense Layers
        x = np.dot(x, self.W['dense']['kernel']) + self.W['dense']['bias']
        x = np.maximum(x, 0)
        
        x = np.dot(x, self.W['dense_1']['kernel']) + self.W['dense_1']['bias']
        x = np.maximum(x, 0)
        
        x = np.dot(x, self.W['main_output']['kernel']) + self.W['main_output']['bias']
        
        # Softmax
        e_x = np.exp(x - np.max(x))
        probs = e_x / e_x.sum()
        
        return np.array([probs])
