package logging

import (
	"log/slog"
	"os"
)

func New(level string) *slog.Logger {
	var l slog.Level
	if level == "debug" {
		l = slog.LevelDebug
	} else {
		l = slog.LevelInfo
	}
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: l}))
}
