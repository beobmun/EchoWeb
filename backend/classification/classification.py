import os
import cv2
import numpy as np

import torch
import torch.nn as nn
import torch.nn.functional as F

from backend.classification import video

CLASSIFICATION_MODEL_PATH = "../model_weights/view_model.pth"

class CNNModel(nn.Module):
    def __init__(self):
        super(CNNModel, self).__init__()
        # Layer 1: Convolutional
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=32, kernel_size=3, padding=1)
        # Layer 2: Convolutional
        self.conv2 = nn.Conv2d(in_channels=32, out_channels=32, kernel_size=3, padding=1)
        # Layer 3: MaxPooling
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Layer 4: Convolutional
        self.conv3 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        # Layer 5: Convolutional
        self.conv4 = nn.Conv2d(in_channels=64, out_channels=64, kernel_size=3, padding=1)
        # Layer 6: MaxPooling
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Layer 7: Convolutional
        self.conv5 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        # Layer 8: Convolutional
        self.conv6 = nn.Conv2d(in_channels=128, out_channels=128, kernel_size=3, padding=1)
        # Layer 10: MaxPooling
        self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Layer 19: Flatten
        # Flattening is handled in the forward method using `view`.

        # Layer 20: Fully Connected Layer
        self.fc1 = nn.Linear(128 * 28 * 28, 1028)  # Assuming input image size is (224, 224)
        # Layer 21: Fully Connected Layer
        self.fc2 = nn.Linear(1028, 512)
        # Layer 22: Softmax Layer
        self.fc3 = nn.Linear(512, 2)

    def forward(self, x):
        # Convolution + ReLU + Pooling
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = self.pool1(x)

        x = F.relu(self.conv3(x))
        x = F.relu(self.conv4(x))
        x = self.pool2(x)

        x = F.relu(self.conv5(x))
        x = F.relu(self.conv6(x))
        x = self.pool3(x)

        # Flatten
        x = x.view(x.size(0), -1)  # Flatten the tensor

        # Fully connected layers + ReLU
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))

        # Output layer with Softmax
        # x = F.softmax(self.fc3(x), dim=1)
        x = self.fc3(x)

        return x
    
class ClassificationModel:
    def __init__(self):
        self.model = CNNModel()

    def with_weight(self, weight_path):
        try:
            # model = CNNModel()
            self.model.load_state_dict(torch.load(weight_path))
            self.model.eval()
            return self 
        except Exception as e:
            print(f"Error loading model weights: {e}")
            return None

    def with_device(self, device):
        self.model.to(device)
        return self
    
    def build(self):
        return self.model
    

class Classification:
    def __init__(self, video_path):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = (ClassificationModel()
                      .with_weight(CLASSIFICATION_MODEL_PATH)
                      .with_device(self.device)
                      .build())
        self.video_path = video_path
        
    def predict(self):
        imgs = (video.Video2Img().
                load_video(self.video_path).
                convert())
        pred = []
        for img in imgs:
            img = cv2.resize(img, (224, 224))
            img = torch.tensor(img).unsqueeze(0).unsqueeze(0).float()  # Convert to float
            img = img.to(self.device)
            with torch.no_grad():
                output = self.model(img)
                _, predicted = torch.max(output, 1)
                pred.append(predicted.item())
        return np.mean(pred)
    
    def run(self):
        pred = self.predict()
        if pred <= 0.1:
            return self.video_path
        else:
            return None
