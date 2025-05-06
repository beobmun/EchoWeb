from fastapi import APIRouter
from pydantic import BaseModel

auth = APIRouter(prefix="/auth")

class User(BaseModel):
    id: str
    password: str


@auth.post("/signin", tags=["auth"])
async def sign_in(user: User):
    # db에서 user_id와 password를 확인하는 로직을 추가해야 합니다.
    # 예를 들어, db에서 user_id와 password를 확인하고, 맞으면 True, 아니면 False를 반환합니다.
    # 여기서는 단순히 True를 반환합니다.
    if user.id == "test" and user.password == "test":
        return {"result": True}
    else:
        return {"result": False}
    
@auth.post("/signup", tags=["auth"])
async def sign_up(user: User):
    # user.password를 해시화하는 로직을 추가해야 합니다.
    # 예를 들어, bcrypt를 사용하여 비밀번호를 해시화하고 db에 저장합니다.
    # 여기서는 단순히 True를 반환합니다.
    return {"result": True}

@auth.get("/signup/{user_id}", tags=["auth"])
async def check_id(user_id: str):
    # db에서 user_id와 중복되는 id가 있는지 확인하는 로직을 추가해야 합니다.
    # 예를 들어, db에서 user_id와 중복되는 id가 있으면 False, 아니면 True를 반환합니다.
    # 여기서는 단순히 True를 반환합니다.
    if user_id == "test":
        return {"result": False}
    else:
        return {"result": True}