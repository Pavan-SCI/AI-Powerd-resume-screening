FROM python:3.9-slim

WORKDIR /code

# Copy requirements and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the backend files
COPY . /code

# Expose port 7860 (Hugging Face Spaces default port)
EXPOSE 7860

# Command to run uvicorn on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
