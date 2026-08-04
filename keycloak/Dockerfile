FROM quay.io/keycloak/keycloak:26.5.2

USER root

# Corporate proxy (Zscaler) — trust root CA in the JVM truststore
COPY --from=certs ZscalerRootCA.pem /etc/pki/ca-trust/source/anchors/ZscalerRootCA.crt
RUN (keytool -delete -alias zscaler-root-ca \
        -cacerts \
        -storepass changeit >/dev/null 2>&1 || true) \
    && printf 'yes\n' | keytool -importcert -trustcacerts \
        -alias zscaler-root-ca \
        -file /etc/pki/ca-trust/source/anchors/ZscalerRootCA.crt \
        -cacerts \
        -storepass changeit

COPY themes/ /opt/keycloak/themes/

USER 1000

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev"]
