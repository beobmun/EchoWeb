import cv2
import os
import torch
import torchvision
import torch.nn.utils
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np
from sam2.sam2_video_predictor import SAM2VideoPredictor

from utils.unet import UNet
from utils.video import Video2Img
from utils.dataset import Dataset, Resize
from utils.get_points import GetPoints

UNET_PATH = "model_weights/unet.pth"
SAM2_BASE_MODEL = "facebook/sam2-hiera-large"
SAM2_TUNED_MODEL_PATH = "model_weights/fine_tuned_sam2.torch"

class UnetPredictor:
    def __init__(self):
        self.convertor = Video2Img()
        
    def load_weight(self, weight_path):
        self.model = UNet(n_channels=1, n_classes=2, bilinear=True)
        self.model.load_state_dict(torch.load(weight_path))
        self.model.eval()
        
    def to(self, device):
        self.device = device
        self.model.to(device)
        
    def predict(self, video_path, output_path):
        os.makedirs(output_path, exist_ok=True)
        name = video_path.split("/")[-1].split(".")[0]
        imgs = (self.convertor
                .load_video(video_path)
                .convert())
        self.convertor.save_imgs(name, output_path)
        width = self.convertor.get_width()
        height = self.convertor.get_height()
        transform = torchvision.transforms.Compose([Resize((256, 256))])
        dataset = Dataset(output_path, name, transform=transform)
        
        with torch.no_grad():
            img = dataset.__getitem__(0).to(self.device)
            mask = torch.argmax(self.model(img), dim=1).cpu()
            mask = mask.permute(1,2,0).squeeze()+0.5
            mask = cv2.resize(mask.numpy(), (width, height), interpolation=cv2.INTER_CUBIC)
            mask = (mask > mask.max()*0.8).astype(int)
            img = img.cpu()[0].permute(1,2,0).squeeze()+0.5
            img = cv2.resize(img.numpy(), (width, height), interpolation=cv2.INTER_CUBIC)
        
        return mask

class SAM2Predictor:
    def __init__(self, base_model=SAM2_BASE_MODEL,):
        self.base_model = base_model
        self.predictor = SAM2VideoPredictor.from_pretrained(base_model)

    def with_video_path(self, video_path):
        self.video_path = video_path
        return self
    
    def with_output_path(self, output_path):
        self.output_path = output_path
        return self
        
    def load_weight(self, tuned_model_path):
        name = self.video_path.split("/")[-1].split(".")[0]
        self.predictor.load_state_dict(torch.load(tuned_model_path))
        self.inference_state = self.predictor.init_state(video_path=f"{self.output_path}/{name}")
        self.predictor.reset_state(self.inference_state)
        
    def to(self, device):
        self.device = device
        self.predictor.to(device)
        
    def predict(self, mask):
        points, labels = GetPoints(mask).run()
        _, out_obj_ids, out_mask_logits = self.predictor.add_new_points_or_box(
            inference_state=self.inference_state,
            frame_idx=0,
            obj_id=0,
            points=points,
            labels=labels
        )
        self.video_segment = dict()
        for out_frame_idx, out_obj_ids, out_mask_logits in self.predictor.propagate_in_video(self.inference_state):
            self.video_segment[out_frame_idx] = {
                out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy()
                for i, out_obj_id in enumerate(out_obj_ids)
            }
    
    def save_segment_video(self, imgs, fps, width, height, save_path):
        fig, ax = plt.subplots()
        w = width / fig.dpi
        h = height / fig.dpi
        fig.set_figwidth(w)
        fig.set_figheight(h)
        
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0, hspace=0, wspace=0)
        def show_mask(mask, ax, obj_id=None, random_color=False):
            if random_color:
                color = np.concatenate([np.random.random(3), np.array([0.6])], axis=0)
            else:
                cmap = plt.get_cmap("tab10")
                cmap_idx = 0 if obj_id is None else obj_id
                color = np.array([*cmap(cmap_idx)[:3], 0.6])
            h, w = mask.shape[-2:]
            mask_img = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
            ax.imshow(mask_img)
        def update(out_frame_idx):
            ax.clear()
            ax.axis('off')
            ax.axes.get_xaxis().set_visible(False)
            ax.axes.get_yaxis().set_visible(False)
            ax.imshow(imgs[out_frame_idx], cmap='gray')
            if out_frame_idx in self.video_segment:
                for out_obj_id, out_mask in self.video_segment[out_frame_idx].items():
                    show_mask(out_mask, ax, obj_id=out_obj_id)
        ani = animation.FuncAnimation(fig, update, frames=range(0, len(imgs)))
        ani.save(save_path, writer='ffmpeg', fps=fps)
        plt.close()
class Segmentation:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.unet_predictor = UnetPredictor()
        self.sam2_predictor = SAM2Predictor()
    
    def run(self, video_path, output_path):
        self.unet_predictor.load_weight(UNET_PATH)
        self.unet_predictor.to(self.device)
        mask = self.unet_predictor.predict(video_path, output_path)

        self.sam2_predictor.with_video_path(video_path)
        self.sam2_predictor.with_output_path(output_path)
        self.sam2_predictor.load_weight(SAM2_TUNED_MODEL_PATH)
        self.sam2_predictor.to(self.device)
        self.sam2_predictor.predict(mask)
        self.sam2_predictor.save_segment_video(
            self.unet_predictor.convertor.get_imgs(),
            self.unet_predictor.convertor.get_fps(),
            self.unet_predictor.convertor.get_width(),
            self.unet_predictor.convertor.get_height(),
            f"{output_path}/{video_path.split('/')[-1].split('.')[0]}_segmentation.mp4"
        )