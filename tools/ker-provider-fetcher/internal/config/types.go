package config

type Config struct {
	RegistryURL string     `yaml:"registry_url,omitempty"`
	Providers   []Provider `yaml:"providers"`
}

type Provider struct {
	Name    string `yaml:"name"`
	Version string `yaml:"version"`
	SHA256  string `yaml:"sha256,omitempty"`
}
