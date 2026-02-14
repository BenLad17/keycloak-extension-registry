# Keycloak Extension Builder Image
# This image extends the official Keycloak image with extension management capabilities
#
# Usage:
#   Build-time: Add extensions.yaml and build custom image
#   docker build --build-arg EXTENSIONS_FILE=extensions.yaml -t my-keycloak .
#
# Extensions are defined in extensions.yaml (like package.json for npm)

ARG KEYCLOAK_VERSION=26.0

# =============================================================================
# Stage 1: Builder - Downloads extensions and runs kc.sh build
# =============================================================================
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION} AS builder

# Install required tools
USER root
RUN microdnf install -y curl jq && microdnf clean all
USER keycloak

# Copy extension manager script
COPY --chown=keycloak:keycloak scripts/extension-manager.sh /opt/keycloak/bin/extension-manager
RUN chmod +x /opt/keycloak/bin/extension-manager

# Copy extensions config file
# This file defines which extensions to install (like package.json)
COPY --chown=keycloak:keycloak extensions.yaml /opt/keycloak/extensions.yaml

# Set registry URL (can be overridden)
ARG REGISTRY_URL=https://registry.keycloak-extensions.org
ENV REGISTRY_URL=${REGISTRY_URL}

# Run extension manager to download all extensions
RUN /opt/keycloak/bin/extension-manager install /opt/keycloak/extensions.yaml

# Build Keycloak with extensions
RUN /opt/keycloak/bin/kc.sh build

# =============================================================================
# Stage 2: Runtime - Optimized production image
# =============================================================================
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}

# Copy built artifacts from builder stage
COPY --from=builder /opt/keycloak/providers/ /opt/keycloak/providers/
COPY --from=builder /opt/keycloak/lib/quarkus/ /opt/keycloak/lib/quarkus/

# Copy extension manager for runtime info (optional)
COPY --from=builder /opt/keycloak/bin/extension-manager /opt/keycloak/bin/extension-manager
COPY --from=builder /opt/keycloak/extensions.yaml /opt/keycloak/extensions.yaml

# Start optimized Keycloak
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]

