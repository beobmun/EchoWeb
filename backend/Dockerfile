FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN apt-get update && \
    apt-get install -y build-essential curl netcat-openbsd bash && \
    apt-get clean && \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    chmod +x ./wait-for-mysql.sh

EXPOSE 4242

CMD ["./wait-for-mysql.sh", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4242", "--reload"]
