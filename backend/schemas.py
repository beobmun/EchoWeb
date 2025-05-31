from pydantic import BaseModel
from typing import Union

class User(BaseModel):
    email: str
    password: str
    username: Union[str, None] = None

class Videos(BaseModel):
    video_paths: list[str]