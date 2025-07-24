# Stage 1: Build the Go application
# Use a Go official image with Alpine Linux for a smaller build environment
FROM golang:1.24-alpine AS builder

# Set the working directory inside the container to the root of devex
WORKDIR /devex

# Copy packages first
COPY packages/ /devex/packages

# Set the working directory inside the container to the root of your Go module
WORKDIR /devex/apps/runner

# Copy go.mod and go.sum first to allow Docker to cache these layers.
# This means if only your code changes, but dependencies don't, the build will be faster.
COPY apps/runner/go.mod apps/runner/go.sum ./

# Download all Go module dependencies
RUN go mod tidy

# Copy the rest of your application source code into the working directory
# This includes all subdirectories like cmd/, internal/, models/, pkg/, services/
COPY apps/runner/ .

# Build the Go application binary
# CGO_ENABLED=0: Disables cgo, resulting in a statically linked binary, which is highly portable.
# GOOS=linux: Ensures the binary is built for a Linux environment, as is typical for Docker containers.
# -a -installsuffix cgo: Additional flags to help create a fully static binary.
# -o main: Specifies the output executable name as 'main'.
# cmd/main.go: This is crucial! It explicitly tells the Go compiler where your application's entry point is.
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go



# ---- Step 2: Final Runtime Stage ----
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# ✅ Install essential packages:
# - bash: for interactive shell
# - curl: for downloading (e.g., starship)
# - ca-certificates: for HTTPS support
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python specific tools
RUN pip install --no-cache-dir \
    flask \
    fastapi \
    uvicorn \
    requests \
    ipython

# ✅  Install Starship prompt
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    echo 'eval "$(starship init bash)"' >> /root/.bashrc


# ✅ Copy the compiled Go binary from builder
COPY --from=builder /devex/apps/runner/main .

# ✅ Set permissions if needed (e.g., make executable)
# RUN chmod +x /app/runner

# ✅ Port on which your Go backend or other service runs
EXPOSE 8080

# ✅ Default command: run the Go binary as the container entrypoint
CMD ["/app/main"]
