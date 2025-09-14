from band.factory import create_app

import os
import configparser
from band.db import mongo
from band.api.bands import bands_api_v1


config = configparser.ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), "config.ini"))

if __name__ == "__main__":
    app = create_app()
    app.config['DEBUG'] = True
    app.config['MONGO_URI'] = config['PROD']['DB_URI']
    mongo.init_app(app)
    
    app.run()

