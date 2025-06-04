import numpy as np

class GetPoints:
    def __init__(self, mask):
        self.mask = mask
    
    def get_rect_coords(self):
        top, bottom, left, right = 0, 0, 0, 0
        threshold = self.mask.max()*0.5
        for r in range(self.mask.shape[0]):
            if self.mask[r].max() > threshold:
                top = r
                break
        for r in range(self.mask.shape[0]-1, -1, -1):
            if self.mask[r].max() > threshold:
                bottom = r
                break
        for c in range(self.mask.shape[1]):
            if self.mask[:, c].max() > threshold:
                left = c
                break
        for c in range(self.mask.shape[1]-1, -1, -1):
            if self.mask[:, c].max() > threshold:
                right = c
                break
        self.hori_1 = top + ((bottom - top)//3)
        self.hori_2 = bottom - ((bottom - top)//3)
        self.vert = left + ((right - left)//2)
        self.top, self.bottom, self.left, self.right = top, bottom, left, right        
        
    def rect_mask(self, top, bottom, left, right):
        rect = np.zeros((bottom-top, right-left))
        for r in range(top, bottom):
            for c in range(left, right):
                rect[r-top][c-left] = self.mask[r][c]
        return rect
    
    def get_pos(self, mask, base_rc):
        threshold = mask.max()*0.9
        coords = np.argwhere(mask > threshold)
        if len(coords) > 25:
            yx = np.array(coords[np.random.randint(len(coords))])
            x, y = yx[1]+base_rc[1], yx[0]+base_rc[0]
            return [x, y]
        return None
    
    def get_neg(self, mask, base_rc):
        threshold = mask.max()*0.1
        coords = np.argwhere(mask < threshold)
        if len(coords) > 25:
            yx = np.array(coords[np.random.randint(len(coords))])
            x, y = yx[1]+base_rc[1], yx[0]+base_rc[0]
            return [x, y]
        return None
    
    def run(self):
        self.get_rect_coords()
        rectangles = [
            self.rect_mask(self.top, self.hori_1, self.left, self.vert),
            self.rect_mask(self.top, self.hori_1, self.vert, self.right),
            self.rect_mask(self.hori_1, self.hori_2, self.left, self.vert),
            self.rect_mask(self.hori_1, self.hori_2, self.vert, self.right),
            self.rect_mask(self.hori_2, self.bottom, self.left, self.vert),
            self.rect_mask(self.hori_2, self.bottom, self.vert, self.right)
        ]
        pos_points = [
            self.get_pos(rectangles[0], [self.top, self.left]),
            self.get_pos(rectangles[1], [self.top, self.vert]),
            self.get_pos(rectangles[2], [self.hori_1, self.left]),
            self.get_pos(rectangles[3], [self.hori_1, self.vert]),
            self.get_pos(rectangles[4], [self.hori_2, self.left]),
            self.get_pos(rectangles[5], [self.hori_2, self.vert])
        ]
        neg_points = [
            self.get_neg(rectangles[0], [self.top, self.left]),
            self.get_neg(rectangles[1], [self.top, self.vert]),
            self.get_neg(rectangles[2], [self.hori_1, self.left]),
            self.get_neg(rectangles[3], [self.hori_1, self.vert]),
            self.get_neg(rectangles[4], [self.hori_2, self.left]),
            self.get_neg(rectangles[5], [self.hori_2, self.vert])
        ]
        points = []
        labels = []
        for p in pos_points:
            if p is not None:
                points.append(p)
                labels.append(1)
        for p in neg_points:
            if p is not None:
                points.append(p)
                labels.append(0)
        return np.array(points), np.array(labels)        