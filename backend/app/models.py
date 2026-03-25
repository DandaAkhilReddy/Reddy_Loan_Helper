import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, Numeric, String, func
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    loan_data = relationship("LoanData", back_populates="user", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_name_lower", func.lower(name), unique=True),
    )


class LoanData(Base):
    __tablename__ = "loan_data"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    principal = Column(Numeric(15, 2), nullable=False)
    annual_rate = Column(Numeric(5, 2), nullable=False)
    emi = Column(Numeric(12, 2), nullable=True)
    tenure_months = Column(Integer, nullable=True)
    extra_monthly = Column(Numeric(12, 2), default=0)
    currency = Column(String(3), default="INR")
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="loan_data")
