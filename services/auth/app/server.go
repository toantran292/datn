package main

import (
    "crypto/hmac"
    "crypto/rsa"
    "crypto/sha256"
    "encoding/base64"
    "encoding/hex"
    "encoding/json"
    "errors"
    "fmt"
    "io"
    "log"
    "math/big"
    "net/http"
    "net/url"
    "os"
    "strconv"
    "strings"
    "sync"
    "time"

    jwt "github.com/golang-jwt/jwt/v5"
)

type jwkKey struct {
  Kid string `json:"kid"`
  Kty string `json:"kty"`
  Alg string `json:"alg"`
  Use string `json:"use"`
  N   string `json:"n"`
  E   string `json:"e"`
}

type jwksDoc struct {
  Keys []jwkKey `json:"keys"`
}

type jwksCache struct {
  url  string
  mu   sync.RWMutex
  keys map[string]*rsa.PublicKey
  ttl  time.Duration
  last time.Time
  hc   *http.Client
}

func newJWKS(url string, ttl time.Duration) *jwksCache {
  return &jwksCache{
    url:  url,
    keys: make(map[string]*rsa.PublicKey),
    ttl:  ttl,
    hc:   &http.Client{Timeout: 5 * time.Second},
  }
}

func (c *jwksCache) fetch() error {
  resp, err := c.hc.Get(c.url)
  if err != nil {
    return err
  }
  defer resp.Body.Close()
  if resp.StatusCode != 200 {
    return fmt.Errorf("jwks fetch status %d", resp.StatusCode)
  }
  data, err := io.ReadAll(resp.Body)
  if err != nil {
    return err
  }
  var doc jwksDoc
  if err := json.Unmarshal(data, &doc); err != nil {
    return err
  }
  m := make(map[string]*rsa.PublicKey)
  for _, k := range doc.Keys {
    if strings.ToUpper(k.Kty) != "RSA" || k.N == "" || k.E == "" || k.Kid == "" {
      continue
    }
    nBytes, err := base64.RawURLEncoding.DecodeString(k.N)
    if err != nil {
      continue
    }
    eBytes, err := base64.RawURLEncoding.DecodeString(k.E)
    if err != nil {
      continue
    }
    var eInt int
    for _, b := range eBytes {
      eInt = eInt<<8 + int(b)
    }
    if eInt == 0 {
      continue
    }
    pub := &rsa.PublicKey{N: new(big.Int).SetBytes(nBytes), E: eInt}
    m[k.Kid] = pub
  }
  if len(m) == 0 {
    return errors.New("no usable jwks keys")
  }
  c.mu.Lock()
  c.keys = m
  c.last = time.Now()
  c.mu.Unlock()
  return nil
}

func (c *jwksCache) get(kid string) (*rsa.PublicKey, error) {
  c.mu.RLock()
  pub, ok := c.keys[kid]
  last := c.last
  c.mu.RUnlock()
  if ok && time.Since(last) < c.ttl {
    return pub, nil
  }
  if err := c.fetch(); err != nil {
    c.mu.RLock()
    pub, ok = c.keys[kid]
    c.mu.RUnlock()
    if ok {
      return pub, nil
    }
    return nil, err
  }
  c.mu.RLock()
  pub, ok = c.keys[kid]
  c.mu.RUnlock()
  if ok {
    return pub, nil
  }
  return nil, fmt.Errorf("kid %s not found", kid)
}

func parseSecret(s string) ([]byte, error) {
  if s == "" {
    return nil, errors.New("empty secret")
  }
  if b, err := hex.DecodeString(s); err == nil {
    return b, nil
  }
  if b, err := base64.StdEncoding.DecodeString(s); err == nil {
    return b, nil
  }
  if b, err := base64.URLEncoding.DecodeString(s); err == nil {
    return b, nil
  }
  if b, err := base64.RawStdEncoding.DecodeString(s); err == nil {
    return b, nil
  }
  if b, err := base64.RawURLEncoding.DecodeString(s); err == nil {
    return b, nil
  }
  return []byte(s), nil
}

type server struct {
  jwks        *jwksCache
  secret      []byte
  leeway      time.Duration
  identityURL string
  hc          *http.Client
}

func (s *server) authorize(w http.ResponseWriter, r *http.Request) {
  orgSlug := r.Header.Get("X-Org-Slug")
  log.Printf("/authorize %s from=%s org_slug=%q", r.Method, r.RemoteAddr, orgSlug)

  if r.Method != http.MethodPost {
    log.Printf("method not allowed: %s", r.Method)
    w.WriteHeader(http.StatusMethodNotAllowed)
    return
  }
  authz := r.Header.Get("Authorization")
  if authz == "" || !strings.HasPrefix(strings.ToLower(authz), "bearer ") {
    log.Printf("unauthorized: missing bearer token (org_slug=%q)", orgSlug)
    http.Error(w, "missing bearer token", http.StatusUnauthorized)
    return
  }
  tokenStr := strings.TrimSpace(authz[len("Bearer "):])

  // Read JWT header for kid
  parts := strings.Split(tokenStr, ".")
  if len(parts) != 3 {
    log.Printf("unauthorized: invalid token format (org_slug=%q)", orgSlug)
    http.Error(w, "invalid token", http.StatusUnauthorized)
    return
  }
  hb, err := base64.RawURLEncoding.DecodeString(parts[0])
  if err != nil {
    log.Printf("unauthorized: cannot decode token header: %v", err)
    http.Error(w, "invalid token header", http.StatusUnauthorized)
    return
  }
  var hdr struct{ Kid, Alg string }
  if err := json.Unmarshal(hb, &hdr); err != nil || hdr.Kid == "" {
    log.Printf("unauthorized: invalid token header (kid missing or bad json)")
    http.Error(w, "invalid token header", http.StatusUnauthorized)
    return
  }

  pub, err := s.jwks.get(hdr.Kid)
  if err != nil {
    log.Printf("unauthorized: jwks error for kid=%s: %v", hdr.Kid, err)
    http.Error(w, "jwks error", http.StatusUnauthorized)
    return
  }

  parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256", "RS384", "RS512"}), jwt.WithLeeway(s.leeway))
  claims := jwt.MapClaims{}
  tok, err := parser.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) { return pub, nil })
  if err != nil || !tok.Valid {
    log.Printf("unauthorized: token validation failed: %v", err)
    http.Error(w, "invalid token", http.StatusUnauthorized)
    return
  }
  userID, _ := claims["sub"].(string)
  if userID == "" {
    log.Printf("unauthorized: missing sub claim")
    http.Error(w, "missing sub", http.StatusUnauthorized)
    return
  }

  // Org resolution via X-Org-Slug
  orgID := ""
  if orgSlug != "" {
    u, _ := url.Parse(s.identityURL)
    u.Path = strings.TrimRight(u.Path, "/") + "/orgs/resolve"
    q := u.Query()
    q.Set("slug", orgSlug)
    u.RawQuery = q.Encode()
    req, _ := http.NewRequest(http.MethodGet, u.String(), nil)
    // pass user id for membership check in Identity
    req.Header.Set("X-User-ID", userID)
    log.Printf("resolve org slug=%q url=%s", orgSlug, u.String())
    resp, err := s.hc.Do(req)
    if err != nil {
      log.Printf("identity resolve error: %v", err)
      http.Error(w, "identity unavailable", http.StatusBadGateway)
      return
    }
    defer resp.Body.Close()
    if resp.StatusCode == http.StatusOK {
      var body struct{ OrgID string `json:"org_id"` }
      data, _ := io.ReadAll(resp.Body)
      if err := json.Unmarshal(data, &body); err != nil || body.OrgID == "" {
        log.Printf("identity resolve invalid response: status=%d body=%s", resp.StatusCode, string(data))
        http.Error(w, "invalid identity response", http.StatusBadGateway)
        return
      }
      orgID = body.OrgID
      log.Printf("resolve success: org_id=%s", orgID)
    } else if resp.StatusCode == http.StatusNotFound {
      log.Printf("resolve slug not found: %q (403)", orgSlug)
      http.Error(w, "unknown org", http.StatusForbidden)
      return
    } else if resp.StatusCode == http.StatusForbidden {
      log.Printf("resolve slug forbidden for user: %q (403)", orgSlug)
      http.Error(w, "forbidden", http.StatusForbidden)
      return
    } else if resp.StatusCode >= 500 {
      log.Printf("identity resolve 5xx: %d", resp.StatusCode)
      http.Error(w, "identity error", http.StatusBadGateway)
      return
    } else {
      log.Printf("identity resolve unexpected status: %d", resp.StatusCode)
      http.Error(w, "identity error", http.StatusBadGateway)
      return
    }
  }

  ts := time.Now().Unix()
  payload := fmt.Sprintf("%s|%s|%d", userID, orgID, ts)
  mac := hmac.New(sha256.New, s.secret)
  _, _ = mac.Write([]byte(payload))
  sig := hex.EncodeToString(mac.Sum(nil))

  w.Header().Set("X-User-ID", userID)
  w.Header().Set("X-Org-ID", orgID)
  // Always echo X-Org-Slug, even if empty
  w.Header().Set("X-Org-Slug", orgSlug)
  w.Header().Set("X-Context-Timestamp", strconv.FormatInt(ts, 10))
  w.Header().Set("X-Context-Signature", sig)
  log.Printf("authorized OK user=%s org_id=%q slug=%q ts=%d", userID, orgID, orgSlug, ts)
  w.WriteHeader(http.StatusOK)
}

func atoiDefault(s string, def int) int {
  if s == "" {
    return def
  }
  if n, err := strconv.Atoi(s); err == nil {
    return n
  }
  return def
}

func main() {
  jwksURL := os.Getenv("JWKS_URL")
  if jwksURL == "" {
    jwksURL = "http://identity:40000/.well-known/jwks.json"
  }
  identityURL := os.Getenv("IDENTITY_URL")
  if identityURL == "" {
    identityURL = "http://identity:40000"
  }
  secretStr := os.Getenv("CONTEXT_HMAC_SECRET")
  if secretStr == "" {
    log.Println("warning: CONTEXT_HMAC_SECRET not set; using insecure default for dev")
    secretStr = "dev-secret"
  }
  secret, err := parseSecret(secretStr)
  if err != nil {
    log.Fatalf("invalid CONTEXT_HMAC_SECRET: %v", err)
  }
  leewaySec := atoiDefault(os.Getenv("ALLOW_CLOCK_SKEW_SEC"), 60)
  cacheTTL := atoiDefault(os.Getenv("CACHE_TTL_SEC"), 30)

  s := &server{
    jwks:        newJWKS(jwksURL, time.Duration(cacheTTL)*time.Second),
    secret:      secret,
    leeway:      time.Duration(leewaySec) * time.Second,
    identityURL: identityURL,
    hc:          &http.Client{Timeout: 5 * time.Second},
  }

  mux := http.NewServeMux()
  mux.HandleFunc("/authorize", s.authorize)
  mux.HandleFunc("/debug/echo", func(w http.ResponseWriter, r *http.Request) {
    resp := map[string]string{
      "Authorization": r.Header.Get("Authorization"),
      "X-Org-Slug":    r.Header.Get("X-Org-Slug"),
    }
    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(resp)
  })

  port := os.Getenv("PORT")
  if port == "" { port = "40900" }
  addr := ":" + port
  log.Printf("Auth service listening on %s (jwks=%s, identity=%s)", addr, jwksURL, identityURL)
  if err := http.ListenAndServe(addr, mux); err != nil {
    log.Fatalf("server error: %v", err)
  }
}
