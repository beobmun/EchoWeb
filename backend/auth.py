from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from pydantic import BaseModel
import bcrypt
import schemas, crud
import logging


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
        elif not bcrypt.checkpw(user.password.encode(), db_user.password.encode()):
            raise HTTPException(status_code=400, detail="Invalid password")
        else:
            return {"result": True, "message": "로그인 성공"}
    except HTTPException as e:
        return {"result": False, "message": str(e)}
    
@auth.post("/signup", tags=["auth"])
async def sign_up(user: schemas.User, db: Session = Depends(get_db)):
    logging.info(f"Received signup request: {user}")
    try:
        db_user = crud.get_user_by_email(db, user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
        user.password = hashed_password.decode()
        
        crud.create_user(db, user)
        return {"result": True, "message": "회원가입 성공"}
    except HTTPException as e:
        return {"result": False, "message": str(e)}

@auth.get("/signup/{email}", tags=["auth"])
async def check_id(email: str, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email)
    if db_user:
        return {"result": False, "message": "이미 사용중인 e-amil입니다."}
    else:
        return {"result": True, "message": "사용 가능한 e-mail입니다."}