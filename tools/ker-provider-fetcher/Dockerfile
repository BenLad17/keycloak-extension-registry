FROM golang:alpine AS build

RUN apk add --no-cache ca-certificates git

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG VERSION=dev
ARG COMMIT=unknown
ARG DATE=unknown

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
      -trimpath \
      -ldflags="-s -w \
        -X main.version=${VERSION} \
        -X main.commit=${COMMIT} \
        -X main.date=${DATE}" \
      -o /out/kc-provider-fetcher \
      ./cmd/kc-provider-fetcher

FROM scratch

USER 65532:65532

COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /out/kc-provider-fetcher /kc-provider-fetcher

WORKDIR /work

ENTRYPOINT ["/kc-provider-fetcher"]