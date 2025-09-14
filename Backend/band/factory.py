import os

from flask import Flask, render_template
from json import JSONEncoder
from flask_cors import CORS
from band.db import mongo
##from flask_bcrypt import Bcrypt
##from flask_jwt_extended import JWTManager

from bson import json_util, ObjectId
from datetime import datetime, timedelta
import os 

from band.api.bands import bands_api_v1
MONGO_URI = os.getenv('MONGO_URI')


class MongoJsonEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(obj, ObjectId):
            return str(obj)
        return json_util.default(obj, json_util.CANONICAL_JSON_OPTIONS)


def create_app():

    APP_DIR = os.path.abspath(os.path.dirname(__file__))
    # STATIC_FOLDER = os.path.join(APP_DIR, 'build/static')
    # TEMPLATE_FOLDER = os.path.join(APP_DIR, 'build')

    app = Flask(__name__)
    app.config["MONGO_URI"] = MONGO_URI
    mongo.init_app(app)

    CORS(app)
    app.json_encoder = MongoJsonEncoder
    from band.api.bands import bands_api_v1
    app.register_blueprint(bands_api_v1)
    
    return app