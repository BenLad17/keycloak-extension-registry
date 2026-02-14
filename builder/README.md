# Keycloak Extension Builder

This directory contains the Docker builder image for Keycloak with extension management.

## Overview

The builder allows you to create custom Keycloak images with pre-installed extensions, similar to how `npm install` works with `package.json`.

## Usage

### 1. Create your `extensions.yaml`

```yaml
registry: https://registry.keycloak-extensions.org

extensions:
  - name: keycloak-metrics-spi
    version: 5.0.0
    
  - name: custom-auth-provider
    version: latest  # Highest compatible with your KC version
```

### 2. Build your custom Keycloak image

```bash
# Copy your extensions.yaml to builder directory
cp my-extensions.yaml builder/extensions.yaml

# Build the image
docker build -t my-keycloak:latest ./builder

# Or specify Keycloak version
docker build --build-arg KEYCLOAK_VERSION=26.0 -t my-keycloak:latest ./builder
```

### 3. Run your custom Keycloak

```bash
docker run -p 8080:8080 my-keycloak:latest
```

## Kubernetes Usage

### Option A: Pre-built Image (Recommended)

Build your image in CI/CD and deploy:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: keycloak
          image: my-registry/keycloak-with-extensions:v1.0.0
          args: ["start", "--optimized"]
```

### Option B: InitContainer (Dynamic)

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      initContainers:
        - name: extension-installer
          image: keycloak-extension-builder:latest
          command: ["/opt/keycloak/bin/extension-manager", "install"]
          volumeMounts:
            - name: providers
              mountPath: /opt/keycloak/providers
            - name: extensions-config
              mountPath: /opt/keycloak/extensions.yaml
              subPath: extensions.yaml
      
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:26.0
          args: ["start"]  # Will auto-build on first start
          volumeMounts:
            - name: providers
              mountPath: /opt/keycloak/providers
              
      volumes:
        - name: providers
          emptyDir: {}
        - name: extensions-config
          configMap:
            name: keycloak-extensions
```

## Extension Manager CLI

The `extension-manager` script is included in the image:

```bash
# Install extensions from config
extension-manager install extensions.yaml

# List installed extensions
extension-manager list

# Check for updates
extension-manager check-updates

# Get extension info
extension-manager info keycloak-metrics-spi
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REGISTRY_URL` | `https://registry.keycloak-extensions.org` | Registry API URL |
| `KC_VERSION` | Auto-detected | Keycloak version for compatibility |
| `PROVIDERS_DIR` | `/opt/keycloak/providers` | Directory to install JARs |

## How It Works

1. **Build Time**: Dockerfile runs `extension-manager install`
2. **Download**: Script fetches metadata from registry, downloads JARs
3. **Verify**: SHA256 checksums are verified
4. **Build**: `kc.sh build` is executed to optimize Keycloak
5. **Runtime**: Optimized image starts with `--optimized` flag

