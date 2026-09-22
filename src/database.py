import os

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv


load_dotenv()


class Database:

    def connect(self):
        try:
            return mysql.connector.connect(
                host=os.getenv("DB_HOST"),
                port=int(os.getenv("DB_PORT")),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME")
            )

        except Error as error:
            print(f"Database connection failed: {error}")
            return None

    def execute(
        self,
        query,
        params=None,
        fetch=False
    ):
        connection = self.connect()

        if connection is None:
            return None

        cursor = connection.cursor(dictionary=True)

        try:
            cursor.execute(query, params)

            if fetch:
                return cursor.fetchall()

            connection.commit()

            return cursor.lastrowid

        except Error as error:
            connection.rollback()
            print(f"Database error: {error}")
            return None

        finally:
            cursor.close()
            connection.close()