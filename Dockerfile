# use lightweight python image
FROM python:3.11-slim

# set working directory
WORKDIR /src/api/

# install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# copy requirements and install python packages
COPY /src/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# download nltk data (wordnet)
RUN python -m nltk.downloader wordnet

# copy the rest of the app
COPY . .

# expose the port gunicorn will run on
EXPOSE 8000

# run the app with gunicorn for production
CMD ["gunicorn", "src.api.app:app", "--bind", "0.0.0.0:8000", "--workers", "2"]
