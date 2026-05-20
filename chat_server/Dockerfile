# Mirrors loop_server/Dockerfile. Build from repo root with:
#   docker build --build-arg PROJECT_DIR=chat_server --build-arg PROJECT_NAME=chat_server -f chat_server/Dockerfile .
ARG PROJECT_DIR="chat_server"
ARG PROJECT_NAME="chat_server"

####################################################################################################
## Planner
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS planner
ARG PROJECT_DIR
WORKDIR /app
RUN cargo install cargo-chef
COPY ./${PROJECT_DIR}/Cargo.* .
COPY ./${PROJECT_DIR}/src ./src
RUN cargo chef prepare --recipe-path recipe.json

####################################################################################################
## Cacher
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS cacher
WORKDIR /app
RUN cargo install cargo-chef
RUN apt-get update && \
    apt-get install -y protobuf-compiler pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*
RUN update-ca-certificates

COPY --from=planner /app/recipe.json recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo chef cook --target x86_64-unknown-linux-musl --release --recipe-path recipe.json

####################################################################################################
## Builder
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS builder
ARG PROJECT_DIR
ARG PROJECT_NAME

RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*
RUN update-ca-certificates

ENV USER=appuser
ENV UID=1001

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}" && \
    groupadd ${PROJECT_NAME}

WORKDIR /app
COPY --from=cacher /app/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME
COPY ./${PROJECT_DIR}/ .

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo build --target x86_64-unknown-linux-musl --release && \
    cp -r target/x86_64-unknown-linux-musl/release/${PROJECT_NAME} /app/${PROJECT_NAME}

RUN mkdir log && chown -R appuser:${PROJECT_NAME} ./log

####################################################################################################
## Final image
####################################################################################################
FROM scratch
ARG PROJECT_NAME

COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app
COPY --from=builder /app/${PROJECT_NAME} ./application

USER appuser:${PROJECT_NAME}
EXPOSE 8088
CMD ["/app/application"]
