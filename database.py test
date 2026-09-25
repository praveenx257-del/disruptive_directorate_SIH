"""
Database configuration.

Uses SQLite for zero-setup local development. Swap SQLALCHEMY_DATABASE_URL
for a Postgres DSN in production, e.g.:
    postgresql+psycopg2://user:pass@host:5432/mplads
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./mplads.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
