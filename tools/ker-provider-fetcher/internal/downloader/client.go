package downloader

import (
	"crypto/sha256"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/benlad17/keycloak-extension-registry/tools/ker-provider-fetcher/internal/config"
)

func DownloadAll(config config.Config, logger *slog.Logger) error {
	for _, p := range config.Providers {
		logger.Info("downloading provider", "name", p.Name, "version", p.Version)
		err := downloadWithRetry(p, config.RegistryURL, 3, logger)
		if err != nil {
			return err
		}
	}
	return nil
}

func downloadWithRetry(p config.Provider, baseUrl string, attempts int, logger *slog.Logger) error {
	var err error
	for i := 0; i < attempts; i++ {
		err = download(p, baseUrl, logger)
		if err == nil {
			return nil
		}
		logger.Warn("download failed, retrying", "attempt", i+1, "max", attempts, "error", err)
		time.Sleep(time.Second)
	}
	return fmt.Errorf("failed to download %s: %w", p.Name, err)
}

func download(p config.Provider, baseUrl string, logger *slog.Logger) error {
	finalFile := p.Name + ".jar"
	tmpFile := finalFile + ".tmp"

	downloadUrl := getDownloadURL(p, baseUrl)
	resp, err := http.Get(downloadUrl)
	if err != nil {
		return fmt.Errorf("failed to fetch: %w", err)
	}
	defer func() {
		if cerr := resp.Body.Close(); cerr != nil {
			logger.Warn("failed to close response body", "error", cerr)
		}
	}()

	if resp.StatusCode != 200 {
		return fmt.Errorf("failed to fetch %s (HTTP %d)", downloadUrl, resp.StatusCode)
	}

	out, err := os.Create(tmpFile)
	if err != nil {
		return err
	}

	hash := sha256.New()
	mw := io.MultiWriter(out, hash)

	_, err = io.Copy(mw, resp.Body)
	if err != nil {
		out.Close()
		if rerr := os.Remove(tmpFile); rerr != nil {
			logger.Warn("failed to delete temp file", "error", rerr)
		}
		return fmt.Errorf("failed to write file: %w", err)
	}

	if p.SHA256 != "" {
		sum := fmt.Sprintf("%x", hash.Sum(nil))
		if sum != p.SHA256 {
			out.Close()
			if rerr := os.Remove(tmpFile); rerr != nil {
				logger.Warn("failed to delete temp file", "error", rerr)
			}
			return fmt.Errorf("checksum mismatch for %s (expected %s, got %s)", p.Name, p.SHA256, sum)
		}
	}

	if err = out.Close(); err != nil {
		return fmt.Errorf("failed to close file: %w", err)
	}

	if err = os.Rename(tmpFile, finalFile); err != nil {
		return fmt.Errorf("cannot rename: %w", err)
	}

	return nil
}

func getDownloadURL(provider config.Provider, baseUrl string) string {
	return fmt.Sprintf("%s/extension/%s/%s/download", baseUrl, provider.Name, provider.Version)
}
