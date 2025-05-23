import cv2
import torch
import torchvision
import torch.nn.utils
from sam2.sam2_video_predictor import SAM2VideoPredictor

from utils.unet import UNet
from utils.video import Video2Img
from utils.dataset import Dataset, Resize
from utils.get_points import GetPoints

UNET_PATH = "model_weights/unet.pth"
SAM2_BASE_MODEL = "facebook/sam2-hiera-large"
SAM2_TUNED_MODEL_PATH = "model_weights/fine_tuned_sam2.torch"

class UnetPredictor:
    def __init__(self, device):
        self.device = device
        self.convertor = Video2Img()
        
    def load_weight(self, weight_path, device):
        self.model = UNet(n_channels=1, n_classes=2, bilinear=True).to(device)
        self.model.load_state_dict(torch.load(weight_path))
        self.model.eval()
        
    def predict(self, video_path, output_path):
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
            mask = mask.permute(1,2,0).squeuze()+0.5
            mask = cv2.resize(mask.numpy(), (width, height), interpolation=cv2.INTER_CUBIC)
            mask = (mask > mask.max()*0.8).astype(int)
            img = img.cpu().permute(1,2,0).squeeze()+0.5
            img = cv2.resize(img.numpy(), (width, height), interpolation=cv2.INTER_CUBIC)
        
        return mask

class SAM2Predictor:
    def __init__(self, video_path, output_path, base_model=SAM2_BASE_MODEL, tuned_model_path=SAM2_TUNED_MODEL_PATH):
        self.video_path = video_path
        self.output_path = output_path
        self.base_model = base_model
        self.tuned_model_path = tuned_model_path
        self.predictor = SAM2VideoPredictor.from_pretrained(base_model)

        
    def load_weight(self, device):
        name = self.video_path.split("/")[-1].split(".")[0]
        self.predictor.load_state_dict(torch.load(self.tuned_model_path))
        self.predictor.to(device)
        self.inference_state = self.predictor.init_state(video_path=f"{self.output_path}"/{name})
        self.predictor.reset_state(self.inference_state)
        
    def predict(self, mask):
        points, labels = GetPoints(mask).run()
        _, out_obj_ids, out_mask_logits = self.predictor.add_new_points_or_box(
            inference_state=self.inference_state,
            frame_idx=0,
            obj_id=0,
            points=points,
            labels=labels
        )
        video_segment = dict()
        for out_frame_idx, out_obj_ids, out_mask_logits in self.predictor.propagate_in_video(self.inference_state):
            video_segment[out_frame_idx] = {
                out_obj_id: (out_mask_logits[i] > 0.0).cpu().numpy()
                for i, out_obj_id in enumerate(out_obj_ids)
            }