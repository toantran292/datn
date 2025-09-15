FROM golang:1.22-alpine AS build
WORKDIR /src

COPY go.mod ./
COPY app ./app
RUN --mount=type=cache,target=/go/pkg/mod go mod tidy && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/auth-server ./app

FROM alpine:3.20
RUN adduser -D -g '' appuser
WORKDIR /app
COPY --from=build /out/auth-server ./auth
USER appuser
EXPOSE 40900
CMD ["./auth"]
