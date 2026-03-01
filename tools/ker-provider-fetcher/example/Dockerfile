FROM ghcr.io/benlad17/keycloak-extension-registry/ker-provider-fetcher AS provider-fetcher
WORKDIR /work
COPY providers.yaml /work/providers.yaml
RUN ["/kc-provider-fetcher", "/work/providers.yaml"]

FROM quay.io/keycloak/keycloak AS builder
WORKDIR /opt/keycloak
COPY --chown=keycloak:keycloak --from=provider-fetcher /work/*.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]