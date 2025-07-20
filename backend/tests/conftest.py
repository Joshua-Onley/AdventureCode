"""

I used generative AI (ChatGPT) to help with this file because i have no prior experience in writing tests for FastAPI apps.

"""

import pytest
from sqlalchemy import JSON, Interval, String, types
import sqlalchemy.dialects.postgresql as psql

# The postgresql models used in the production version of the app use UUID, JSONB, and INTERVAL columns which are imported from "sqlalchemy.dialects.postgresql"
# For testing purposes an in-memory SQLite database is used. The in-memory SQLite datase does not recognise these types so a new class is required.

# Declare a custom SQLAlcehmy type decorator that pretends to be a string
class SQLiteUUID(types.TypeDecorator):
    impl = String 

    # Overrides the constructor to accept as_uuid=True (which is used in the postgres models) but ignores it
    def __init__(self, length=36, as_uuid=False, **kwargs):
        super().__init__(length=length, **kwargs)
    
    # when writing Python values into the DB, this function urns UUID objects into their string form or None
    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    # when reading from SQLite, leaves the returned string as-is 
    def process_result_value(self, value, dialect):
        return value

# Monkey-patches the Postgres dialect so that anywhere my production models refer to JSONB,
# INTERVAL, or UUID, SQLite will see plain JSON, Inteval, or SQLiteUUID which allows metadata.create_all() to succeed
psql.JSONB = JSON        
psql.INTERVAL = Interval    
psql.UUID = SQLiteUUID  

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from database import Base, get_db     
from main import app                 


# Creates an in-memory SQLite database
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# create al tables in the in-memory SQLite database
Base.metadata.create_all(bind=engine)


# Opens a new DB connection adn begins a transaction. Yields a session for the tests to use
@pytest.fixture(scope="function")
def db_session():
    conn = engine.connect()
    txn = conn.begin()
    session = TestSessionLocal(bind=conn)
    try:
        yield session
    finally:
        session.close()
        txn.rollback()
        conn.close()

# Defines a test_user fixture that imports the user model and creates a new user in the test DB
# returns the user object for other fixtures or tests to use
@pytest.fixture(scope="function")
def test_user(db_session):
    
    from models.user import User
    user = User(name="Bob", username="bob123", password_hash="123")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user



# the following fixtuer overrides FastAPI's get_db dependency so that every request uses db_session
# overrides get_current_user so protected endpoitns see tset_user as the authenticated user
# yields a TestClient(app) - allowing HTTP calls in tests
@pytest.fixture(scope="function")
def client(db_session, test_user):
    
    def _get_test_db():
        yield db_session

    def _get_current_user():
        yield test_user

    app.dependency_overrides[get_db] = _get_test_db
    from dependencies import get_current_user
    app.dependency_overrides[get_current_user] = _get_current_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
