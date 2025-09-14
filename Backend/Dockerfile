FROM python:3.11-slim


WORKDIR /Backend


COPY ./requirements.txt .





RUN pip install --no-cache-dir -r requirements.txt
#RUN pip install -q condacolab
#RUN conda install -c conda-forge pmdarima -y


COPY . .


COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh


ENV FLASK_ENV=development
ENV FLASK_APP=factory.py


ENV FLASK_APP="band.factory:create_app()" \
   FLASK_ENV=development \
   FLASK_RUN_HOST=0.0.0.0 \
   FLASK_RUN_PORT=5000


EXPOSE 5000


CMD ["flask", "run"]
