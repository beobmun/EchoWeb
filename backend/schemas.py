from pydantic import BaseModel
from typing import Union


class User(BaseModel):
    id: str
    password: str
    user_name: Union[str, None] = None
