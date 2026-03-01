package main

import (
	"os"

	"github.com/benlad17/keycloak-extension-registry/tools/ker-provider-fetcher/internal/config"
	"github.com/benlad17/keycloak-extension-registry/tools/ker-provider-fetcher/internal/downloader"
	"github.com/benlad17/keycloak-extension-registry/tools/ker-provider-fetcher/internal/logging"
)

func main() {
	logger := logging.New("info")

	cfgPath := "providers.yaml"
	if len(os.Args) > 1 {
		cfgPath = os.Args[1]
	}
	cfg, err := config.Load(cfgPath)
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger.Info("starting downloads")
	err = downloader.DownloadAll(*cfg, logger)
	if err != nil {
		logger.Error("download failed", "error", err)
		os.Exit(2)
	}

	logger.Info("all providers downloaded successfully")
}
