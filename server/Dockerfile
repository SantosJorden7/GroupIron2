###############################################
# Backend Image
###############################################
FROM rust:1.73 as builder
WORKDIR /app
COPY src ./src
COPY Cargo.toml .
COPY Cargo.lock .
COPY collection_log_info.json .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update
RUN apt-get install -y openssl ca-certificates
RUN rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/server ./
COPY --from=builder /app/collection_log_info.json ./

# Create a simple startup script that runs directly
RUN echo '#!/bin/sh' > start.sh \
    && echo 'echo "[pg]" > config.toml' >> start.sh \
    && echo 'echo "user = \"$PG_USER\"" >> config.toml' >> start.sh \
    && echo 'echo "password = \"$PG_PASSWORD\"" >> config.toml' >> start.sh \
    && echo 'echo "host = \"$PG_HOST\"" >> config.toml' >> start.sh \
    && echo 'echo "port = $PG_PORT" >> config.toml' >> start.sh \
    && echo 'echo "dbname = \"$PG_DB\"" >> config.toml' >> start.sh \
    && echo 'echo "pool.max_size = 16" >> config.toml' >> start.sh \
    && echo 'echo "$BACKEND_SECRET" > secret' >> start.sh \
    && echo 'exec /app/server' >> start.sh \
    && chmod +x start.sh

# Run our startup script
CMD ["/app/start.sh"]
