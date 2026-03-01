package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

func Load(path string) (*Config, error) {
	f, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("cannot read config: %w", err)
	}
	var cfg Config
	if err := yaml.Unmarshal(f, &cfg); err != nil {
		return nil, fmt.Errorf("cannot parse yaml: %w", err)
	}
	return &cfg, nil
}
