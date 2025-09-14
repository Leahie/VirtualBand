# Use the official Python image as the base
FROM python:3.11-slim


# Set the working directory
WORKDIR /Backend


# Copy the requirements file first to leverage Docker cache
COPY ./requirements.txt .






# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
#RUN pip install -q condacolab
#RUN conda install -c conda-forge pmdarima -y


# Copy the rest of the application
COPY . .


COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh


# Expose the port Flask runs on


# Set environment variables
ENV FLASK_ENV=development
ENV FLASK_APP=factory.py


# Run the application
ENV FLASK_APP="band.factory:create_app()" \
   FLASK_ENV=development \
   FLASK_RUN_HOST=0.0.0.0 \
   FLASK_RUN_PORT=5000


EXPOSE 5000


CMD ["flask", "run"]
