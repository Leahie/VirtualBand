import os
import tempfile
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from band.db import get_band_workspace_by_name, get_bands, get_band_workspace, add_band_workspace, \
    delete_band_workspace, update_band_workspace, upload_file_to_s3

from flask_cors import CORS
from band.api.utils import expect
from datetime import datetime

# Environment variables for AWS
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'virtualband')
S3_REGION = os.getenv('S3_REGION', 'us-east-1')

bands_api_v1 = Blueprint(
    'bands_api_v1', 'bands_api_v1', url_prefix='/api/v1/bands')

CORS(bands_api_v1)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {
        'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',  # Audio formats
        'mp4', 'avi', 'mov', 'mkv', 'wmv', 'webm','mid'   # Video formats
    }
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bands_api_v1.route('/upload', methods=['POST'])
def api_upload_file():
    """Upload file to S3 and return URL"""
    try:
        print("Upload endpoint called")
        
        # Check if file is present
        if 'file' not in request.files:
            print("No file part in request")
            return jsonify({"error": "No file part in request"}), 400
        
        file = request.files['file']
        band_name = request.form.get('bandName', 'Unknown Band')
        
        print(f"File: {file.filename}, Band: {band_name}")
        
        # Check if file is selected
        if file.filename == '':
            print("No file selected")
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            print(f"Invalid file type: {file.filename}")
            return jsonify({
                "error": "Unsupported file type. Please upload audio or video files."
            }), 400
        
        # Validate file size (100MB limit)
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
        file.seek(0, os.SEEK_END)  # Go to end of file
        file_size = file.tell()    # Get current position (file size)
        file.seek(0)               # Reset to beginning
        
        print(f"File size: {file_size} bytes")
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                "error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
            }), 400
        
        # Generate unique filename to avoid conflicts
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        print(f"Unique filename: {unique_filename}")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_path = temp_file.name
            file.save(temp_path)
        
        print(f"Saved to temp path: {temp_path}")
        
        try:
            # Upload to S3
            s3_key = f"uploads/{unique_filename}"
            print(f"Uploading to S3 with key: {s3_key}")
            
            s3_url = upload_file_to_s3(
                temp_path,
                bucket_name=S3_BUCKET_NAME,
                object_name=s3_key,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY
            )
            
            if not s3_url:
                print("S3 upload failed")
                return jsonify({"error": "Failed to upload file to S3"}), 500
            
            print(f"Successfully uploaded to S3: {s3_url}")
            
            return jsonify({
                "s3_url": s3_url,
                "filename": filename,
                "size": file_size,
                "message": f"File uploaded successfully for {band_name}"
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                print(f"Cleaned up temp file: {temp_path}")
                
    except Exception as e:
        print(f"Error in upload endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error during upload"}), 500

# Pulls up all bands
@bands_api_v1.route('/', methods=['GET'])
def api_get_bands():
    try:
        print("Getting all bands")
        BANDS_PER_PAGE = 20

        (bands, total_num_entries) = get_bands()
        print(f"Found {total_num_entries} bands")

        response = {
            "bands": bands,
            "page": 0,
            "filters": {},
            "entries_per_page": BANDS_PER_PAGE,
            "total_results": total_num_entries,
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error getting bands: {e}")
        return jsonify({"error": "Failed to retrieve bands"}), 500

# Shows only specific id 
@bands_api_v1.route('/id/<id>', methods=['GET'])
def api_get_band_by_id(id):
    try:
        band = get_band_workspace(id)
        if band is None:
            return jsonify({
                "error": "Not found"
            }), 404
        elif band == {}:
            return jsonify({
                "error": "uncaught general exception"
            }), 400
        else:
            updated_type = str(type(band.get('lastupdated')))
            return jsonify(
                {
                    "band": band,
                    "updated_type": updated_type
                }
            ), 200
    except Exception as e:
        print(f"Error getting band by ID: {e}")
        return jsonify({"error": "Failed to retrieve band"}), 500

# Add element to band database 
@bands_api_v1.route('/add', methods=['POST'])
def api_add_band():
    try:
        print("Adding new band")
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        print(f"Band data: {data}")
        
        # Validate required fields
        required_fields = ["name", "original_song"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"'{field}' is required"}), 400
        
        fields = ["name", "date_created", "date_modified", "original_song", "modified_song"]
        band_doc = {field: data.get(field, "") for field in fields}
        
        print(f"Creating band document: {band_doc}")
        
        result = add_band_workspace(**band_doc)
        
        if result and result.inserted_id:
            print(f"Band created with ID: {result.inserted_id}")
            return jsonify({
                "inserted_id": str(result.inserted_id),
                "message": "Band created successfully"
            }), 201
        else:
            return jsonify({"error": "Failed to create band"}), 500
            
    except Exception as e:
        print(f"Error adding band: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to create band"}), 500

# Edit element in band database 
@bands_api_v1.route('/edit', methods=['POST'])
def api_edit_band():
    try:
        data = request.json
        
        if not data or 'id' not in data:
            return jsonify({"error": "Band ID is required"}), 400
        
        band_id = data.get('id')
        result = update_band_workspace(
            band_id, 
            data.get('name', ''), 
            data.get('date_created', ''), 
            data.get('date_modified', ''), 
            data.get('original_song', ''), 
            data.get('modified_song', '')
        )
        
        if result and result.modified_count > 0:
            return jsonify({
                "modified_count": str(result.modified_count),
                "message": "Band updated successfully"
            }), 200
        else:
            return jsonify({"error": "Band not found or no changes made"}), 404
            
    except Exception as e:
        print(f"Error editing band: {e}")
        return jsonify({"error": "Failed to update band"}), 500

# Delete an element in band database 
@bands_api_v1.route('/delete/<id>', methods=['DELETE'])
def api_delete_band(id):
    try:
        print(f"Deleting band with ID: {id}")
        deleted_count = delete_band_workspace(id)
        
        if deleted_count == 1: 
            return jsonify({
                "deleted": True,
                "message": "Band deleted successfully"
            }), 200
        else:
            return jsonify({
                "deleted": False, 
                "error": "Band not found"
            }), 404
            
    except Exception as e:
        print(f"Error deleting band: {e}")
        return jsonify({"error": "Failed to delete band"}), 500
