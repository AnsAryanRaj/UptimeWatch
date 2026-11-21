import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./uptimewatch.db")

# Fix Render / Cloud PostgreSQL URL format and map to modern Psycopg 3 driver:
# 1. Render supplies 'postgres://', which is deprecated in SQLAlchemy 2.0.
# 2. Map 'postgres://' or generic 'postgresql://' to 'postgresql+psycopg://' to use the installed Psycopg 3 package.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Connection parameters depending on database dialect
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Connection pooling options
engine_kwargs = {"connect_args": connect_args}
if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_pre_ping": True,  # Automatically tests and recycles disconnected connections
        "pool_recycle": 300,
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
