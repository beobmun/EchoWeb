from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from pydantic import BaseModel
import bcrypt
import schemas, crud


auth = APIRouter(prefix="/auth")

# DB 세션 생성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()    

@auth.post("/signin", tags=["auth"])
async def sign_in(user: schemas.User, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    try:
        if not db_user:
            raise HTTPException(status_code=400, detail="Invalid email")
        if not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
            raise HTTPException(status_code=400, detail="Invalid email or password")
        return {"result": True}
    except HTTPException as e:
        return {"result": False, "error": str(e)}
    
# @auth.post("/signup", tags=["auth"])
# async def sign_up(user: User, db: Session = Depends(get_db)):
    # try:
    #     if db.quer(UserInDB).filter(UserInDB.email == user.email).first():
    #         raise HTTPException(status_code=400, detail="Email already registered")
    #     hased_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    #     new_user = UserInDB(
    #         email=user.email,
    #         password=hased_pw,
    #         username=user.username
    #     )
    #     db.add(new_user)
    #     db.commit()
    #     db.refresh(new_user)
    #     return {"result": True}
    # except HTTPException as e:
    #     return {"result": False, "error": str(e)}

@auth.get("/signup/{user_id}", tags=["auth"])
async def check_id(user_id: str):
    # db에서 user_id와 중복되는 id가 있는지 확인하는 로직을 추가해야 합니다.
    # 예를 들어, db에서 user_id와 중복되는 id가 있으면 False, 아니면 True를 반환합니다.
    # 여기서는 단순히 True를 반환합니다.
    if user_id == "test":
        return {"result": False}
    else:
        return {"result": True}