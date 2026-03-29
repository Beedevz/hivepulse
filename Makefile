.PHONY: build-all build-web build-api clean

# Build frontend, copy to embed dir, build Go binary
build-all: build-web build-api

build-web:
	cd hivepulse-web && npm run build
	rm -rf hivepulse-api/web/dist
	cp -r hivepulse-web/dist hivepulse-api/web/dist

build-api:
	cd hivepulse-api && go build -ldflags="-s -w" -o bin/server ./cmd/server/...

clean:
	rm -rf hivepulse-api/web/dist
	rm -f hivepulse-api/bin/server
