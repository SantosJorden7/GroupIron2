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
# Create config.toml and secret files directly in the Dockerfile
RUN echo "[pg]" > config.toml \
    && echo "user = \"\${PG_USER}\"" >> config.toml \
    && echo "password = \"\${PG_PASSWORD}\"" >> config.toml \
    && echo "host = \"\${PG_HOST}\"" >> config.toml \
    && echo "port = \${PG_PORT}" >> config.toml \
    && echo "dbname = \"\${PG_DB}\"" >> config.toml \
    && echo "pool.max_size = 16" >> config.toml \
    && echo "\${BACKEND_SECRET}" > secret

# Run the server directly
CMD ["/app/server"]
