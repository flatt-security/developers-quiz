FROM golang:1.21.4-bullseye

RUN apt update && apt upgrade -y

WORKDIR /app
COPY go.mod go.sum ./
COPY api.go ./
RUN go build api

RUN useradd -m user
RUN chown -R root:user /app

CMD ./api
