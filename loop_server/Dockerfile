# Github Action을 사용하지 않고 Dockerfile로 빌드하는 경우 사용
ARG PROJECT_DIR="프로젝트 디렉토리"
ARG PROJECT_NAME="프로젝트 이름"

####################################################################################################
## Planner - 의존성 분석
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS planner
ARG PROJECT_DIR
ARG SOURCE_DIRS
WORKDIR /app
RUN cargo install cargo-chef
COPY ./${PROJECT_DIR}/Cargo.* .

COPY ./${PROJECT_DIR}/src ./src
RUN cargo chef prepare --recipe-path recipe.json

####################################################################################################
## Cacher - 의존성 빌드
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS cacher
WORKDIR /app
RUN cargo install cargo-chef

# protobuf 컴파일러 설치
RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

RUN update-ca-certificates

COPY --from=planner /app/recipe.json recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo chef cook --target x86_64-unknown-linux-musl --release --recipe-path recipe.json

####################################################################################################
## Builder - 실제 애플리케이션 빌드
####################################################################################################
FROM messense/rust-musl-cross:x86_64-musl AS builder
ARG PROJECT_DIR
ARG PROJECT_NAME

# protobuf 컴파일러 설치
RUN apt-get update && \
    apt-get install -y protobuf-compiler && \
    rm -rf /var/lib/apt/lists/*

RUN update-ca-certificates

# Create appuser
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

# 캐시된 의존성 복사
COPY --from=cacher /app/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME
COPY ./${PROJECT_DIR}/ .

# 캐시 마운트를 분리하여 처리
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    cargo build --target x86_64-unknown-linux-musl --release && \
    cp -r target/x86_64-unknown-linux-musl/release/${PROJECT_NAME} /app/${PROJECT_NAME}
# cp -r target/armv7-unknown-linux-musleabihf/release/${PROJECT_NAME} /app/${PROJECT_NAME}

RUN mkdir log && \
    chown -R appuser:${PROJECT_NAME} ./log
# RUN cargo build --target armv7-unknown-linux-musleabihf --release

####################################################################################################
## Final image
####################################################################################################
FROM scratch
ARG PROJECT_NAME

# Import from builder.
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app

# Copy our build
COPY --from=builder /app/${PROJECT_NAME} ./application

# Use an unprivileged user.
USER appuser:${PROJECT_NAME}

CMD ["/app/application"]