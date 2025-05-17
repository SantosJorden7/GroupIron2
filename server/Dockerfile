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
# Create an entrypoint shell script instead of trying to use environment variables directly
RUN echo '#!/bin/sh' > entrypoint.sh \
    && echo 'echo "[pg]" > config.toml' >> entrypoint.sh \
    && echo 'echo "user = \"$PG_USER\"" >> config.toml' >> entrypoint.sh \
    && echo 'echo "password = \"$PG_PASSWORD\"" >> config.toml' >> entrypoint.sh \
    && echo 'echo "host = \"$PG_HOST\"" >> config.toml' >> entrypoint.sh \
    && echo 'echo "port = $PG_PORT" >> config.toml' >> entrypoint.sh \
    && echo 'echo "dbname = \"$PG_DB\"" >> config.toml' >> entrypoint.sh \
    && echo 'echo "pool.max_size = 16" >> config.toml' >> entrypoint.sh \
    && echo 'echo "$BACKEND_SECRET" > secret' >> entrypoint.sh \
    && echo 'exec "/app/server"' >> entrypoint.sh \
    && chmod +x entrypoint.sh

# Use the entrypoint script
CMD ["/app/entrypoint.sh"]
