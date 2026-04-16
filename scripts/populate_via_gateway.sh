#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8060}"

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8081}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-bookshop}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-front}"
KEYCLOAK_USERNAME="${KEYCLOAK_USERNAME:-admin}"
KEYCLOAK_PASSWORD="${KEYCLOAK_PASSWORD:-admin123}"

wait_for() {
  local url="$1"
  local tries="${2:-60}"
  local delay="${3:-2}"
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done
  echo "Timed out waiting for $url" >&2
  return 1
}

json_field() {
  local field="$1"
  python3 - <<PY
import json,sys
obj=json.load(sys.stdin)
print(obj.get("$field"))
PY
}

get_keycloak_token() {
  curl -fsS -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token" \
    -d "grant_type=password" \
    -d "client_id=${KEYCLOAK_CLIENT_ID}" \
    -d "username=${KEYCLOAK_USERNAME}" \
    -d "password=${KEYCLOAK_PASSWORD}" \
    | python3 - <<'PY'
import json,sys
print(json.load(sys.stdin)["access_token"])
PY
}

post_json() {
  local path="$1"
  local body="$2"
  curl -fsS \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -X POST "${BASE_URL}${path}" \
    -d "$body"
}

echo "Waiting for gateway..."
wait_for "${BASE_URL}/api/books/ping" 90 2

echo "Waiting for Keycloak realm (${KEYCLOAK_REALM})..."
wait_for "${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration" 90 2

echo "Fetching admin token from Keycloak (${KEYCLOAK_REALM})..."
ACCESS_TOKEN="$(get_keycloak_token)"

# --- Bookshop: categories + books ---
echo "Creating categories (bookshop)..."
cat_fiction_json=$(post_json "/api/categories" '{"name":"Fiction","description":"Fiction books","color":"#8b5cf6"}')
cat_tech_json=$(post_json "/api/categories" '{"name":"Technology","description":"Tech books","color":"#06b6d4"}')
cat_fiction_id=$(printf '%s' "$cat_fiction_json" | json_field id)
cat_tech_id=$(printf '%s' "$cat_tech_json" | json_field id)

echo "Created categories: Fiction=${cat_fiction_id}, Technology=${cat_tech_id}"

# NOTE: Book creation expects a category object; sending {"category":{"id":...}} references an existing category.
echo "Creating books (bookshop)..."
book1_json=$(post_json "/api/books" "{\"title\":\"Dusk Dawn\",\"isbn\":\"ISBN-001\",\"price\":19.99,\"description\":\"Seeded via gateway\",\"imageUrl\":\"https://example.com/1.jpg\",\"author\":\"Ram\",\"views\":0,\"category\":{\"id\":${cat_fiction_id}}}")
book2_json=$(post_json "/api/books" "{\"title\":\"Dawn to Dusk\",\"isbn\":\"ISBN-002\",\"price\":24.50,\"description\":\"Seeded via gateway\",\"imageUrl\":\"https://example.com/2.jpg\",\"author\":\"Ram\",\"views\":0,\"category\":{\"id\":${cat_tech_id}}}")
book1_id=$(printf '%s' "$book1_json" | json_field id)
book2_id=$(printf '%s' "$book2_json" | json_field id)

echo "Created books: book1=${book1_id}, book2=${book2_id}"

# --- User microservice ---
echo "Creating users (user microservice)..."
user1_json=$(post_json "/users" '{"name":"Alice","email":"alice@example.com","password":"password"}')
user2_json=$(post_json "/users" '{"name":"Bob","email":"bob@example.com","password":"password"}')
user1_id=$(printf '%s' "$user1_json" | json_field id)
user2_id=$(printf '%s' "$user2_json" | json_field id)

echo "Created users: user1=${user1_id}, user2=${user2_id}"

# --- CartsManagement ---
echo "Creating carts (cart management)..."
cart1_json=$(post_json "/carts" "{\"userId\":${user1_id},\"items\":[{\"productId\":${book1_id},\"quantity\":1}]}" )
cart2_json=$(post_json "/carts" "{\"userId\":${user2_id},\"items\":[{\"productId\":${book2_id},\"quantity\":2}]}" )
cart1_id=$(printf '%s' "$cart1_json" | json_field id)
cart2_id=$(printf '%s' "$cart2_json" | json_field id)

echo "Created carts: cart1=${cart1_id}, cart2=${cart2_id}"

# --- Orders (CANDIDAT4TWIN2MS) ---
echo "Creating orders (candidat service)..."
post_json "/orders" "{\"customerName\":\"Alice\",\"orderDate\":\"2026-04-16\",\"totalAmount\":19.99}" >/dev/null
post_json "/orders" "{\"customerName\":\"Bob\",\"orderDate\":\"2026-04-16\",\"totalAmount\":49.00}" >/dev/null

# --- Reviews ---
echo "Creating reviews (review-service)..."
post_json "/reviews" "{\"userId\":${user1_id},\"bookId\":${book1_id},\"rating\":5,\"comment\":\"Excellent read.\"}" >/dev/null
post_json "/reviews" "{\"userId\":${user2_id},\"bookId\":${book1_id},\"rating\":4,\"comment\":\"Solid, would recommend.\"}" >/dev/null
post_json "/reviews" "{\"userId\":${user1_id},\"bookId\":${book2_id},\"rating\":3,\"comment\":\"Good but some slow parts.\"}" >/dev/null
post_json "/reviews" "{\"userId\":${user2_id},\"bookId\":${book2_id},\"rating\":5,\"comment\":\"Loved it.\"}" >/dev/null

# --- Recommendation search ---
echo "Indexing books (recommendation-search-service)..."
post_json "/index/books" "{\"books\":[{\"bookId\":\"${book1_id}\",\"title\":\"Dusk Dawn\",\"author\":\"Ram\",\"description\":\"Seeded via gateway\",\"categoryName\":\"Fiction\",\"imageUrl\":\"https://example.com/1.jpg\",\"price\":19.99},{\"bookId\":\"${book2_id}\",\"title\":\"Dawn to Dusk\",\"author\":\"Ram\",\"description\":\"Seeded via gateway\",\"categoryName\":\"Technology\",\"imageUrl\":\"https://example.com/2.jpg\",\"price\":24.5}]}" >/dev/null

echo "Creating recommendation events (recommendation-search-service)..."
post_json "/events" "{\"userId\":${user1_id},\"bookId\":\"${book1_id}\",\"type\":\"VIEW\",\"categoryName\":\"Fiction\"}" >/dev/null
post_json "/events" "{\"userId\":${user1_id},\"bookId\":\"${book2_id}\",\"type\":\"PURCHASE\",\"categoryName\":\"Technology\"}" >/dev/null

echo "Done. Quick checks:"
echo "- Books: ${BASE_URL}/api/books"
echo "- Reviews for book1: ${BASE_URL}/reviews/book/${book1_id}"
echo "- Search: ${BASE_URL}/search?q=dusk"
