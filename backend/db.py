# db.py
import os
from dotenv import load_dotenv
import pymysql
from pymysql.cursors import DictCursor

load_dotenv()

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        cursorclass=DictCursor  # ✅ This is the correct way for pymysql
    )
