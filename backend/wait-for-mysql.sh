#!/bin/sh

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."

i=1
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  if [ $i -gt 30 ]; then
    echo "MySQL is not available after 30 seconds, exiting..."
  fi
  echo "MySQL is not available yet, waiting..."
  i=$((i+1))
  sleep 2
done

echo "MySQL is up and running!"

exec "$@"