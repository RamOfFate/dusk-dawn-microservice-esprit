# Dusk/Dawn Bookshop – Microservices (ESPRIT)

Monorepo containing a small bookshop microservices system (Spring Boot + NestJS) orchestrated with Docker Compose.

## Quick start (Docker)

```bash
docker compose up -d --build
```

Main URLs (default compose ports):

- Front (Next.js): http://localhost:3000
- API Gateway: http://localhost:8060
- Keycloak: http://localhost:8081
- Eureka: http://localhost:8761
- Config Server: http://localhost:8888

Seeded Keycloak realm (imported at startup):

- Realm: `bookshop`
- Client: `front`
- Users:
  - admin: `admin` / `admin123`
  - customer: `alice` / `password`

## Architecture (high level)

- **api-gateway** (Spring Cloud Gateway MVC) routes external traffic to services.
- **eureka-server** provides service discovery.
- **bookshop-config-server** provides centralized configuration.
- **keycloak** provides authentication + realm roles.
- **usermicroservice** keeps a MySQL projection of Keycloak users for the admin dashboard (Keycloak is source of truth).
- **springboot-bookshop** exposes the catalog (books, categories) and calls review-service via **OpenFeign**.
- **review-service** manages reviews; validates book existence via **OpenFeign** to bookshop-service.
- **CARTMANAGEMENT** manages carts; creates orders via **RabbitMQ** request/reply.
- **Candidat4TWIN2Ms** acts as the “orders” service.
- **recommendation-search-service** (NestJS) provides search, recommendations, indexing, events, health.

## Authentication / Authorization

- Keycloak realm roles used by the app: `admin`, `customer`.
- JWTs also include Keycloak built-ins such as `offline_access`, `uma_authorization`, and `default-roles-bookshop`.
  These are normal defaults.

Gateway auth rules (see api-gateway security config):

- Public (no token required):
  - `GET /api/books/**`, `GET /api/categories/**`, `GET /api/books/popular`, `GET /api/books/ping`
  - `GET /search/**`
  - `GET /reviews/**`
  - `GET /health/**`
- Admin-only:
  - `/users/**`
  - `/index/**`
  - `POST|PUT|PATCH|DELETE /api/**`
- Everything else: requires login (customer or admin)

### How login identifiers work

When creating users from the admin dashboard, the **Keycloak username is set to the email**.
So users log in with their email + password.

## API Endpoints (via API Gateway)

Base URL: `http://localhost:8060`

The gateway routes are defined in: bookshop-config-server/src/main/resources/config/api-gateway.properties

### Catalog – Books (springboot-bookshop)

Base path: `/api/books`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/api/books` | Public | List all books |
| POST | `/api/books` | Admin | Create a book |
| GET | `/api/books/{id}` | Public | Get book by id |
| PUT | `/api/books/{id}` | Admin | Update a book |
| DELETE | `/api/books/{id}` | Admin | Delete a book |
| GET | `/api/books/popular` | Public | List popular books |
| GET | `/api/books/ping` | Public | Health check (returns `pong`) |

### Catalog – Categories (springboot-bookshop)

Base path: `/api/categories`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/api/categories` | Public | List categories |
| POST | `/api/categories` | Admin | Create a category |

### Users (usermicroservice)

Base path: `/users`

Keycloak is the **source of truth**. The user service mirrors changes to Keycloak and keeps a local MySQL projection.

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/users` | Admin | List users (triggers Keycloak → MySQL sync) |
| GET | `/users/{id}` | Admin | Get local user by id |
| POST | `/users` | Admin | Create user in Keycloak + upsert local projection |
| PUT | `/users/{id}` | Admin | Update user in Keycloak + local (optional `password` resets Keycloak password) |
| DELETE | `/users/{id}` | Admin | Delete user in Keycloak + local |

Create user request body:

```json
{
  "name": "Amine",
  "email": "amine@example.com",
  "password": "possposs",
  "role": "customer"
}
```

Update user request body (password optional):

```json
{
  "name": "Amine Updated",
  "email": "amine@example.com",
  "role": "admin",
  "password": "newPasswordOptional"
}
```

### Carts (CARTMANAGEMENT)

Base path: `/carts`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/carts` | Login | List all carts |
| GET | `/carts/customer/{customerId}` | Login | List carts by numeric customer id |
| GET | `/carts/customerName/{customerName}` | Login | List carts by customer name |
| POST | `/carts` | Login | Create cart item |
| PUT | `/carts/{id}` | Login | Update cart item |
| DELETE | `/carts/{id}` | Login | Delete cart item |
| GET | `/carts/user/{id}` | Login | Fetch user (via user service) |

#### Create order from cart (RabbitMQ)

| Method | Path | Auth | Description |
|---|---|---:|---|
| POST | `/carts/order` | Login | Creates an order via RabbitMQ request/reply, then clears cart(s) |

- Optional query param: `cartId` (if provided, clears only that cart item)
- Body: `OrderCreateRequest`

Example:

```bash
curl -X POST "http://localhost:8060/carts/order" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "alice",
    "shippingAddress": "Tunis",
    "totalAmount": 120
  }'
```

Response headers include:

- `X-Cart-Clear-Status: ok|failed`
- `X-Carts-Deleted: <n>`

### Orders (Candidat4TWIN2Ms)

Base path: `/orders`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/orders` | Login | List orders |
| GET | `/orders/{id}` | Login | Get order by id |
| POST | `/orders` | Login | Create order |
| PUT | `/orders/{id}` | Login | Update order |
| DELETE | `/orders/{id}` | Login | Delete order |
| GET | `/orders/customerName/{customerName}` | Login | List orders by customer name |
| GET | `/orders/users` | Login | Debug: list users from user service |
| GET | `/orders/hello` | Login | Debug: returns `Hello` |

Note: orders can also be created indirectly via `/carts/order` (RabbitMQ).

### Reviews (review-service)

Base path: `/reviews`

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/reviews/book/{bookId}` | Public | Paginated reviews for a book (`sort=latest|rating`, `page`, `size`) |
| GET | `/reviews/book/{bookId}/average` | Public | Average rating for a book |
| POST | `/reviews` | Login | Create a review |
| PUT | `/reviews/{id}` | Login | Update a review |
| DELETE | `/reviews/{id}` | Login | Delete a review |

Create review body:

```json
{
  "customerName": "alice",
  "bookId": 1,
  "rating": 5,
  "comment": "Great book"
}
```

Service-to-service endpoint used by bookshop-service (OpenFeign):

| Method | Path | Intended use |
|---|---|---|
| POST | `/reviews/average/batch` | Internal ratings batch lookup |

Body:

```json
{ "bookIds": [1, 2, 3] }
```

### Search & Recommendations (recommendation-search-service)

| Method | Path | Auth | Description |
|---|---|---:|---|
| GET | `/health` | Public | Health check (`{ "status": "ok" }`) |
| GET | `/search?q=...&limit=...` | Public | Search books (limit 1..50, default 20) |
| GET | `/recommendations/user/{userId}?limit=...` | Login | Recommendations for a user (limit 1..50, default 12) |
| POST | `/index/books` | Admin | Upsert/index books (used to build search index) |
| POST | `/events` | Login | Track an event (`VIEW` or `PURCHASE`) |

Index books body:

```json
{
  "books": [
    {
      "bookId": "1",
      "title": "Book title",
      "author": "Author",
      "description": "...",
      "categoryName": "Fiction",
      "imageUrl": "https://...",
      "price": 10.5
    }
  ]
}
```

Create event body:

```json
{
  "userId": 1,
  "bookId": "1",
  "type": "VIEW",
  "categoryName": "Fiction"
}
```

## Notes

- The admin dashboard uses the gateway `/users` endpoints; user creation/update is mirrored to Keycloak.
- Token role changes require a fresh token (log out/in) to be reflected in the UI.
