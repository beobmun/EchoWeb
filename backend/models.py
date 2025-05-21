from sqlalchemy import String, Integer
from sqlalchemy.orm import mapped_column
from database import Base

class User(Base):
    __tablename__ = "users"
    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    email = mapped_column(String(255), unique=True, nullable=False)
    password = mapped_column(String(255), nullable=False)
    username = mapped_column(String(255), nullable=True)