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
        return self
        
    def to(self, device):
        self.device = device
        self.model.to(device)
        return self
        
    def predict(self, video_path, output_path):
        os.makedirs(output_path, exist_ok=True)
        name = video_path.split("/")[-1].split(".")[0]
        self.convertor.load_video(video_path).convert()
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
        return self
        
    def to(self, device):
        self.device = device
        self.predictor.to(device)
        return self
        
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
        return self
    
    def save_segmented_video(self, imgs, fps, width, height, save_path):
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
        
        self.segmented_video_path = save_path
        
        return self
        
    def get_video_segment(self):
        return self.video_segment
    def get_segmented_video_path(self):
        return self.segmented_video_path
        
class Calculator:
    def __init__(self):
        self.areas = list()
        self.masks = list()
    
    def calc_areas(self, imgs, video_segment):
        for out_frame_idx in range(len(imgs)):
            if out_frame_idx in video_segment:
                for out_obj_id, out_mask in video_segment[out_frame_idx].items():
                    mask = out_mask.astype(np.uint8).squeeze()
                    mask = mask > 0
                    area = np.sum(mask)
                    self.areas.append(area)
                    self.masks.append(mask)
        self.areas = np.array(self.areas)
        self.masks = np.array(self.masks)
        self.imgs = imgs
        
        return self
    
    def find_es_ed(self, conv_base):
        self.conv_base = conv_base
        conved_areas = np.convolve(self.areas, np.ones(conv_base)/conv_base, mode='valid')
        mean_area = np.mean(conved_areas)
        es_idx = list()
        ed_idx = list()
        for i, area in enumerate(conved_areas):
            if area < mean_area:
                es_idx.append(i)
            else:
                ed_idx.append(i)
        
        s = 0
        es_list = list()
        for i in range(len(es_idx)):
            if i == len(es_idx) - 1:
                temp = es_idx[s:]
                es_list.append([temp[0], temp[-1]])
                break
            current_idx = es_idx[i]
            next_idx = es_idx[i + 1]
            if next_idx - current_idx == 1:
                continue
            temp = es_idx[s:i + 1]
            s = i + 1
            es_list.append([temp[0], temp[-1]])
        es_points = list()
        for r in es_list:
            try:
                es_points.append(r[0] + np.argmin(conved_areas[r[0]:r[1]]))
            except Exception as e:
                print(f"Error in finding ES points: {e}")
        
        s = 0
        ed_list = list()
        for i in range(len(ed_idx)):
            if i == len(ed_idx) - 1:
                temp = ed_idx[s:]
                ed_list.append([temp[0], temp[-1]])
                break
            current_idx = ed_idx[i]
            next_idx = ed_idx[i + 1]
            if next_idx - current_idx == 1:
                continue
            temp = ed_idx[s:i + 1]
            s = i + 1
            ed_list.append([temp[0], temp[-1]])
        ed_points = list()
        for r in ed_list:
            try:
                ed_points.append(r[0] + np.argmax(conved_areas[r[0]:r[1]]))
            except Exception as e:
                print(f"Error in finding ED points: {e}")
        
        es_points, ed_points = np.array(es_points), np.array(ed_points)
        es_points = np.sort(es_points)
        ed_points = np.sort(ed_points)
        
        if es_points[0] < 5:
            es_points = es_points[1:]
        if es_points[-1] > len(conved_areas) - 5:
            es_points = es_points[:-1]
        if ed_points[0] < 5:
            ed_points = ed_points[1:]
        if ed_points[-1] > len(conved_areas) - 5:
            ed_points = ed_points[:-1]
        
        self.es_points = es_points
        self.ed_points = ed_points
        self.conved_areas = conved_areas
        return self
        
    def save_frames(self, output_path):
        self.es_frames_path = f"{output_path}/es_frames"
        self.ed_frames_path = f"{output_path}/ed_frames"
        es_points = self.es_points + self.conv_base//2
        ed_points = self.ed_points + self.conv_base//2
        os.makedirs(self.es_frames_path, exist_ok=True)
        os.makedirs(self.ed_frames_path, exist_ok=True)
        for i, f in enumerate(es_points):
            cv2.imwrite(f"{self.es_frames_path}/{i}.jpg", self.imgs[f])
        for i, f in enumerate(ed_points):
            cv2.imwrite(f"{self.ed_frames_path}/{i}.jpg", self.imgs[f])
        
        return self
        
    def calc_ef(self):
        def continuous(row):
            for i in range(len(row)):
                r = row[i]
                if r == 0:
                    return i
            return len(row)
        def calc_volume(mask):
            volume = 0
            for r in mask:
                i = 0
                while i < len(r):
                    if r[i] == 0:
                        i += 1
                        continue
                    j = continuous(r[i:])
                    v = ((j/2)**2)*np.pi
                    volume += v
                    i += j
            return volume
        ed_volumes = np.array([calc_volume(self.masks[i]) for i in self.ed_points])
        es_volumes = np.array([calc_volume(self.masks[i]) for i in self.es_points])
        edv = np.mean(ed_volumes)
        esv = np.mean(es_volumes)
        self.ef = (edv - esv) / edv * 100
        
        return self
        
    def get_es_frames_path(self):
        return self.es_frames_path
    def get_ed_frames_path(self):
        return self.ed_frames_path
    def get_conved_areas(self):
        return self.conved_areas
    def get_es_points(self):
        return self.es_points
    def get_ed_points(self):
        return self.ed_points
    def get_ef(self):
        return self.ef
class Segmentation:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.unet_predictor = UnetPredictor()
        self.sam2_predictor = SAM2Predictor()
        self.calculator = Calculator()
    
    def run(self, video_path, output_path):
        mask = (self.unet_predictor
                .load_weight(UNET_PATH)
                .to(self.device)
                .predict(video_path, output_path))
        
        (self.sam2_predictor.with_video_path(video_path)
                            .with_output_path(output_path)
                            .load_weight(SAM2_TUNED_MODEL_PATH)
                            .to(self.device)
                            .predict(mask)
                            .save_segmented_video(
                                self.unet_predictor.convertor.get_imgs(),
                                self.unet_predictor.convertor.get_fps(),
                                self.unet_predictor.convertor.get_width(),
                                self.unet_predictor.convertor.get_height(),
                                f"{output_path}/{video_path.split('/')[-1].split('.')[0]}/segmentation.mp4"))
        
        (self.calculator.calc_areas(self.unet_predictor.convertor.get_imgs(), 
                                    self.sam2_predictor.get_video_segment())
                        .find_es_ed(int(self.unet_predictor.convertor.get_fps()/4))
                        .save_frames(f"{output_path}/{video_path.split('/')[-1].split('.')[0]}")
                        .calc_ef())
        
        return self
    
    def get_segmented_video_path(self):
        return self.sam2_predictor.get_segmented_video_path()
    def get_conved_areas(self):
        return self.calculator.get_conved_areas().tolist()
    def get_es_frames_path(self):
        return self.calculator.get_es_frames_path()
    def get_ed_frames_path(self):
        return self.calculator.get_ed_frames_path()
    def get_es_points(self):
        return self.calculator.get_es_points().tolist()
    def get_ed_points(self):
        return self.calculator.get_ed_points().tolist()
    def get_ef(self):
        return self.calculator.get_ef()
    