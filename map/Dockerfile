FROM python:3.10.2

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "beat.py", "--host", "0.0.0.0"]

