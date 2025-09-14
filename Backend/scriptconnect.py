from pymongo import MongoClient

try:
    # Your connection should work once IP is whitelisted
    client = MongoClient(
        "mongodb+srv://leahzhang1595995_db_user:TPnwKlk7EeHK24o8@cluster0.x0idehn.mongodb.net/",
        serverSelectionTimeoutMS=10000
    )
    
    # Test connection
    client.admin.command('ping')
    print("MongoDB connection successful!")
    
    # Access your database
    db = client.virtualbands
    collection = db.bands_collection
    
    print(f"Connected to database: {db.name}")
    print(f"Document count: {collection.count_documents({})}")
    
except Exception as e:
    print(f"Connection failed: {e}")