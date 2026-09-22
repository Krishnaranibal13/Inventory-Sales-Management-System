from datetime import datetime, timedelta, timezone
import os
import re

import jwt
from fastapi import HTTPException, status
from pwdlib import PasswordHash

from src.database import Database

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_ENV_BEFORE_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

password_hash = PasswordHash.recommended()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")


def get_user_by_email(email: str):
    db = Database()
    rows = db.execute("SELECT user_id, name, email, password_hash, role, is_active, created_at FROM users WHERE email = %s", (normalize_email(email),), fetch=True)
    return rows[0] if rows else None


def get_user_by_id(user_id: int):
    db = Database()
    rows = db.execute("SELECT user_id, name, email, password_hash, role, is_active, created_at FROM users WHERE user_id = %s", (user_id,), fetch=True)
    return rows[0] if rows else None


def public_user(user: dict) -> dict:
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": bool(user["is_active"]),
        "created_at": user["created_at"],
    }
