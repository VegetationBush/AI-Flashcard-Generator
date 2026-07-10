# Build stage — has the actual Go compiler
FROM golang:1.26 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bootstrap entry/main.go


# Runtime stage — AWS's provided runtime (recommended over lambda/go for custom bootstrap binaries)
FROM public.ecr.aws/lambda/provided:al2023

COPY --from=build /bootstrap ${LAMBDA_RUNTIME_DIR}/bootstrap

CMD ["bootstrap"]