# Corporate root CA (Zscaler)

Place `ZscalerRootCA.pem` in this directory so Docker builds can trust the
enterprise SSL inspection proxy (same pattern as BCMS).

## Source

Copy from your IT bundle or from another project that already has it, e.g.:

```powershell
Copy-Item "C:\Users\kahonsu\Documents\GitHub\BCMS\cert\ZscalerRootCA.pem" -Destination "cert\ZscalerRootCA.pem"
```

```bash
cp /path/to/BCMS/cert/ZscalerRootCA.pem cert/ZscalerRootCA.pem
```

## Usage

`docker-compose.dev.yml` mounts this folder as a BuildKit additional context
named `certs`. Dockerfiles then run:

```dockerfile
COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
```

Without this file, `docker compose -f docker-compose.dev.yml build` will fail.
