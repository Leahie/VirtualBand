"""
This module contains all database interfacing methods for the MFlix
application. You will be working on this file for the majority of M220P.

Each method has a short description, and the methods you must implement have
docstrings with a short explanation of the task.

Look out for TODO markers for additional help. Good luck!
"""
import bson

from flask import current_app, g
from werkzeug.local import LocalProxy
from flask_pymongo import PyMongo
from pymongo.errors import DuplicateKeyError, OperationFailure
from bson.objectid import ObjectId
from bson.errors import InvalidId
import boto3

mongo = PyMongo() 

def get_db():
    return mongo.db


def get_band_workspace_by_name(name):
    """
    Finds and returns band workspaces by name.
    Returns a list of dictionaries, each dictionary contains a title and an _id.
    """
    try:

        """
        Ticket: Projection

        Write a query that matches movies with the countries in the "countries"
        list, but only returns the title and _id of each movie.

        Remember that in MongoDB, the $in operator can be used with a list to
        match one or more values of a specific field.
        """

        # Find movies matching the "countries" list, but only return the title
        # and _id. Do not include a limit in your own implementation, it is
        # included here to avoid sending 46000 documents down the wire.
        print(f" c: {name}")
        return list(get_db().bands.find({},{"name" : 1}))

    except Exception as e:
        return e

def get_bands():
    """
    Returns a list of all bands
    """
    return list(get_db().bands.find({})), get_db().bands.count_documents({})

def get_band_workspace(id):
    """
    Given a band workspace ID, return a band workspace with that ID.
    """
    try:
        band = get_db().bands.find_one({"_id": ObjectId(id)})
        return band
    except (InvalidId,Exception):
        return None

#Create 
def add_band_workspace(name, date_created, date_modified, original_song, modified_song):
    band_doc = {
        "name": name, 
        "date_created": date_created, 
        "date_modified": date_modified, 
        "original_song": original_song, 
        "modified_song": modified_song
    }
    validate_band_workspace(band_doc)
    return get_db().bands.insert_one(band_doc)

#Delete 
def delete_band_workspace(band_id):
    response = get_db().bands.delete_one({"_id": ObjectId(band_id)})
    return response.deleted_count

#Update 
def update_band_workspace(band_id, name, date_created, date_modified, original_song, modified_song):
    response = get_db().bands.update_one(
        { "_id": ObjectId(band_id) },
        { "$set": { "name ": name, "date_created" : date_created, "date_modified": date_modified, "original_song": original_song, "modified_song": modified_song 
        } }
    )
    return response  


def upload_file_to_s3(file_path, bucket_name, object_name, aws_access_key_id, aws_secret_access_key, region_name='us-east-1'):
    s3 = boto3.client(
        's3',
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=region_name
    )
    s3.upload_file(file_path, bucket_name, object_name)
    return f"https://{bucket_name}.s3.{region_name}.amazonaws.com/{object_name}"

def validate_band_workspace(data):
    required_fields = ["name", "date_created", "date_modified", "original_song", "modified_song"]
    for field in required_fields:
        if field not in data or not data[field]:
            raise ValueError(f"Missing or empty required field: {field}")
        
