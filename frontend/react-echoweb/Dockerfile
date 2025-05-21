# build stage
FROM node:18 AS builder

WORKDIR /app
COPY . .

RUN npm install && \
    npm run build

# Serve with nginx
FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
# ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]