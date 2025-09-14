from flask import Blueprint, request, jsonify
from band.db import get_band_workspace_by_name, get_bands, get_band_workspace, add_band_workspace, \
    delete_band_workspace, update_band_workspace, upload_file_to_s3

from flask_cors import CORS
from band.api.utils import expect
from datetime import datetime


bands_api_v1 = Blueprint(
    'bands_api_v1', 'bands_api_v1', url_prefix='/api/v1/bands')

CORS(bands_api_v1)

# Pulls up all bands
@bands_api_v1.route('/', methods=['GET'])
def api_get_bands():
    BANDS_PER_PAGE = 20

    (bands, total_num_entries) = get_bands()

    response = {
        "bands": bands,
        "page": 0,
        "filters": {},
        "entries_per_page": BANDS_PER_PAGE,
        "total_results": total_num_entries,
    }

    return jsonify(response)

# Shows only specific id 
@bands_api_v1.route('/id/<id>', methods=['GET'])
def api_get_band_by_id(id):
    band = get_band_workspace(id)
    if band is None:
        return jsonify({
            "error": "Not found"
        }), 400
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

# Add element to band database 
@bands_api_v1.route('/add', methods=['POST'])
def api_add_band():
    data = request.json
    result = add_band_workspace(
        data['name'], 
        data['date_created'], 
        data['date_modified'], 
        data['original_song'], 
        data['modified_song']
    )
    return jsonify({"inserted_id": str(result.inserted_id)}), 201

# Edit element in band database 
@bands_api_v1.route('/edit', methods=['POST'])
def api_edit_band():
    data = request.json
    band_id = data.get('id')
    result = update_band_workspace(
        band_id, 
        data['name'], 
        data['date_created'], 
        data['date_modified'], 
        data['original_song'], 
        data['modified_song']
    )
    return jsonify({"modified_count": str(result.modified_count)}), 200 # modified count is sus, check this spot


# Delete an element in band database 
@bands_api_v1.route('/delete/<id>', methods=['DELETE'])
def api_delete_band(id):
    deleted_count = delete_band_workspace(id)
    if deleted_count == 1: 
        return jsonify({"deleted": True}), 200
    else:
        return jsonify({"deleted": False, "error": "Not found"}), 404