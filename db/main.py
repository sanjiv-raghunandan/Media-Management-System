# TODO execute sql script from py
from SQLDB import SQLiteDB
from datetime import datetime
import sys
import json
import os

op = SQLiteDB('./db/main.db')

def add_user(name, mail, pswd):
    op.execute_query(
        'INSERT INTO "user" (Name, email, password, created_at) VALUES (?, ?, ?, ?)',
        (name, mail, pswd, datetime.now())
    )

def delete_media_item(media_id):
    op.execute_query("DELETE FROM media WHERE media_ID = ?", (media_id,))
    return True



def determine_media_type(file_extension):
    """
    Determines the type of a media file based on its extension.
    """
    image_extensions = {"jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"}
    video_extensions = {"mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"}
    audio_extensions = {"mp3", "wav", "flac", "aac", "ogg", "m4a"}

    file_extension = file_extension.lower()

    if file_extension in image_extensions:
        return "image"
    elif file_extension in video_extensions:
        return "video"
    elif file_extension in audio_extensions:
        return "audio"
    else:
        return "unknown"
def get_file_size(file_path):
    file_size = os.path.getsize(file_path)
    file_size = int(file_path/1000)
    return file_size

def add_files_to_collection(collection_id, file_ids):
    for file_id in file_ids:
        op.execute_query("""
            UPDATE media
            SET collection_ID = ?
            WHERE media_ID = ?
        """, (collection_id, file_id))
        
def upload_media(name, file_path):
    file_extension = os.path.splitext(file_path)[1].lstrip('.')
    media_type = determine_media_type(file_extension)
    file_path_db = 'file://' + file_path
    file_size_bytes = os.path.getsize(file_path)
    name_db = name.removesuffix('.' + file_extension)
    # Conversion to kilobytes
    file_size_kb = int(file_size_bytes / 1024)
    op.execute_query(
        "INSERT INTO media (title, type, url, upload_time, size_kb, format) VALUES (?, ?, ?, ?, ?, ?)",
        (name_db, media_type, file_path_db, datetime.now(), file_size_kb, file_extension)
    )

def upload_media_folder(folder_path):
    media_files = []
    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            media_files.append((file, file_path))

    for name, path in media_files:
        upload_media(name, path)

def fetch_collections():
    collection_db = op.fetch_query("""
        SELECT collection_ID, name, description, 
               (SELECT COUNT(*) FROM media WHERE media.collection_ID = collection.collection_ID) as item_count
        FROM collection
    """)
    collections = [
        {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "itemCount": row[3]
        }
        for row in collection_db
    ]
    return collections

def fetch_media_in_collection(collection_id):
    col_items = op.fetch_query("""
        SELECT media_ID, title, type, url, format
        FROM media
        WHERE collection_ID = ?
    """, (collection_id,))
    media_items = [
        {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "path": row[3],
            "format": row[4]
        }
        for row in col_items
    ]
    return media_items


if __name__ == "__main__":
    # Receive command-line input from Node.js
    command = sys.argv[1]

    if command == "fetch":
        media_items = op.fetch_media_items()
        keys = ("id", "name", "type", "path")
        media_items_dict = [
            dict(zip(keys, values)) for values in media_items
        ]
        print(json.dumps(media_items_dict))  # Output JSON to Node.js

    elif command == "upload":
            print("Received file paths:", sys.argv[2:])  # Debugging received paths

            # Assume the remaining arguments are file paths
            for file_path in sys.argv[2:]:
                name = os.path.basename(file_path)
                upload_media(name, file_path)
            print("Media upload complete.")
    elif command == "upload-folder":
        folder_path = sys.argv[2]
        upload_media_folder(folder_path)
        print("Folder upload complete.")
    elif command == "fetch_collections":
        print(json.dumps(fetch_collections()))

    elif command == "fetch_media_in_collection":
        collection_id = int(sys.argv[2])
        print(json.dumps(fetch_media_in_collection(collection_id)))
    elif command == "add_collection":
        name = sys.argv[2]
        description = sys.argv[3]
        new_id = op.add_collection(name, description)
        print(json.dumps({"id": new_id}))
    elif command == "add_files_to_collection":
        collection_id = int(sys.argv[2])
        file_ids = json.loads(sys.argv[3])
        success = add_files_to_collection(collection_id, file_ids)
        print(json.dumps({"success": success}))
    elif command == "delete_media_item":
        media_id = int(sys.argv[2])
        success = delete_media_item(media_id)
        print(json.dumps({"success": success}))
