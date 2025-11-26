# syntax=docker/dockerfile:1
FROM openresty/openresty:alpine

# Tools cần cho opm & healthcheck
RUN apk add --no-cache perl curl ca-certificates bash

# Lua libs cho access_by_lua:
# - HTTP client: ledgetech/lua-resty-http  → require "resty.http"
# - OpenSSL FFI: fffonion/lua-resty-openssl → require "resty.openssl.hmac"
RUN opm get ledgetech/lua-resty-http \
 && opm get fffonion/lua-resty-openssl
#  && opm get zmartzone/lua-resty-openidc  
#  && opm get cdbattags/lua-resty-session

EXPOSE 80

# Healthcheck (đảm bảo nginx.conf có `location = /healthz { return 200; }`)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1/healthz || exit 1