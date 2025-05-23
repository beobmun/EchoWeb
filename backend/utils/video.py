import cv2
import numpy as np
import os

class Video2Img:
    def __init__(self):
        self.video_path = None
        self.cap = None
        self.fps = None
        self.width = None
        self.height = None
        self.imgs = None
        
    def load_video(self, video_path):
        self.cap = cv2.VideoCapture(video_path)
        if not self.cap.isOpened():
            print(f"Error opening video file: {video_path}")
            return None
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return self

    def convert(self, gray=True):
        if self.cap is None:
            print("Video not loaded.")
            return None
        self.imgs = []
        if self.cap.isOpened():
            ret, frame = self.cap.read()
            while ret:
                if gray:
                    self.imgs.append(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY))
                else:
                    self.imgs.append(frame)
                ret, frame = self.cap.read()
        self.cap.release()
        self.imgs = np.array(self.imgs)
        return self.imgs

