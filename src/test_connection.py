from database import Database


db = Database()
connection = db.connect()

if connection.is_connected():
    print("✅ Database connected successfully!")
    print("Database:", connection.database)

connection.close()