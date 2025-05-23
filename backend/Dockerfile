FROM nvidia/cuda:12.4.1-base-ubuntu22.04

WORKDIR /app

COPY . .

RUN apt-get update && \
    apt-get install -y python3.9 python3-pip python3-venv build-essential curl netcat-openbsd bash libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev git ffmpeg && \
    apt-get clean && \
    ln -sf /usr/bin/python3.9 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip && \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    chmod +x ./wait-for-mysql.sh && \
    cd / && git clone https://github.com/facebookresearch/sam2.git && cd sam2 && pip install -e . && cd /app 

EXPOSE 4242

CMD ["./wait-for-mysql.sh", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4242", "--reload"]
