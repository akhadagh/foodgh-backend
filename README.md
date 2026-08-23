# Food Ordering Backend API

Backend API for the FoodGH frontend. This service provides auth, menu browsing, order placement, promo code validation, and admin reporting endpoints.

## Base URL

- Local: `http://localhost:5000`
- API prefix: `/api`

Example:

```text
http://localhost:5000/api/health
```

## Authentication

The API uses JWT authentication.

- Send the token in the `Authorization` header as `Bearer <token>`.
- The backend also accepts a `token` cookie.
- Most customer endpoints require authentication.
- Admin endpoints require an authenticated user with the `admin` role.

## Common Response Notes

- Success responses usually return JSON.
- Validation errors return HTTP `400` with an `errors` array from `express-validator` or a `message` string.
- Unauthorized access returns HTTP `401`.
- Forbidden access returns HTTP `403`.
- Missing records return HTTP `404`.

## Health Check

### GET `/api/health`

Public endpoint used to confirm the API is running.

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-08-23T12:00:00.000Z"
}
```

## Auth Endpoints

### POST `/api/auth/signup`

Create a new customer account.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "+233000000000",
  "address": "Accra, Ghana"
}
```

Required fields:

- `name`
- `email`
- `password` at least 6 characters

Response:

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233000000000",
    "address": "Accra, Ghana",
    "role": "customer",
    "created_at": "2026-08-23T12:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

### POST `/api/auth/login`

Login with email and password.

Request body:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+233000000000",
    "address": "Accra, Ghana",
    "role": "customer",
    "created_at": "2026-08-23T12:00:00.000Z"
  },
  "token": "jwt-token-here"
}
```

### GET `/api/auth/profile`

Get the current user profile.

Auth: required

Response includes:

- `id`
- `name`
- `email`
- `phone`
- `address`
- `role`
- `created_at`

### PUT `/api/auth/profile`

Update the current user profile.

Auth: required

Request body can include:

```json
{
  "name": "New Name",
  "phone": "+233111111111",
  "address": "Tema, Ghana"
}
```

## Menu Endpoints

### GET `/api/menu/categories`

Public endpoint that returns all categories.

Response is an array of category objects.

Category fields:

- `id`
- `name`
- `image`
- `description`
- `sort_order`
- `created_at`

### POST `/api/menu/categories`

Create a category.

Auth: admin only

Request body:

```json
{
  "name": "Burgers",
  "image": "https://example.com/burgers.jpg",
  "description": "Tasty burgers",
  "sort_order": 1
}
```

### PUT `/api/menu/categories/:id`

Update a category.

Auth: admin only

### DELETE `/api/menu/categories/:id`

Delete a category.

Auth: admin only

### GET `/api/menu/items`

Public endpoint that returns menu items.

Optional query params:

- `category_id` filter by category
- `is_featured=true|false` filter featured items

Example:

```text
/api/menu/items?category_id=2&is_featured=true
```

Menu item fields include:

- `id`
- `category_id`
- `category_name`
- `name`
- `description`
- `price`
- `image`
- `is_available`
- `is_featured`
- `custom_options`
- `created_at`
- `updated_at`

### GET `/api/menu/items/:id`

Get a single menu item by ID.

### POST `/api/menu/items`

Create a menu item.

Auth: admin only

Request body:

```json
{
  "category_id": 1,
  "name": "Cheeseburger",
  "description": "Beef burger with cheese",
  "price": 45,
  "image": "https://example.com/burger.jpg",
  "is_featured": true,
  "custom_options": []
}
```

### PUT `/api/menu/items/:id`

Update a menu item.

Auth: admin only

### DELETE `/api/menu/items/:id`

Delete a menu item.

Auth: admin only

## Order Endpoints

### POST `/api/orders`

Create a new order.

Auth: required

Request body:

```json
{
  "items": [
    {
      "menu_item_id": 1,
      "name": "Cheeseburger",
      "quantity": 2,
      "price": 45,
      "custom_options": [],
      "special_instructions": "No onions"
    }
  ],
  "delivery_address": "Accra Mall, Accra",
  "delivery_notes": "Call on arrival",
  "payment_method": "cash",
  "promo_code": "SAVE10"
}
```

Required fields:

- `items` with at least one item
- `delivery_address`

Supported payment methods:

- `cash`
- `card`
- `online`
- `mtn_momo`
- `vodafone_cash`
- `airteltigo_money`
- `bank_transfer`

The backend automatically calculates:

- `subtotal`
- `delivery_fee` fixed at `5.00`
- `discount` when a promo code is valid
- `total`
- `estimated_delivery` set to about 45 minutes after creation

### GET `/api/orders/my-orders`

Get the authenticated user’s orders.

Auth: required

Optional query params:

- `page` default `1`
- `limit` default `10`

Response shape:

```json
{
  "orders": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

### GET `/api/orders/:id`

Get one order.

Auth: required

Access rules:

- Admin can view any order.
- Customers can only view their own orders.

### POST `/api/orders/:id/cancel`

Cancel an order.

Auth: required

Rules:

- Only the order owner can cancel it.
- Only orders in `placed` or `confirmed` status can be cancelled.

### POST `/api/orders/validate-promo`

Validate a promo code for an order subtotal.

Auth: required

Request body:

```json
{
  "code": "SAVE10",
  "subtotal": 100
}
```

Response returns whether the promo is valid and the discount amount.

## Promo Code Endpoints

### GET `/api/promos`

Get all promo codes.

Auth: admin only

### POST `/api/promos`

Create a promo code.

Auth: admin only

Request body:

```json
{
  "code": "SAVE10",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_order": 50,
  "max_uses": 100,
  "expires_at": "2026-12-31T23:59:59.000Z"
}
```

Supported discount types:

- `percentage`
- `fixed`

### PUT `/api/promos/:id`

Update a promo code.

Auth: admin only

### DELETE `/api/promos/:id`

Delete a promo code.

Auth: admin only

### POST `/api/promos/validate`

Validate a promo code.

Auth: required

Request body:

```json
{
  "code": "SAVE10",
  "subtotal": 100
}
```

Response includes:

- `valid`
- `message` when invalid
- `promo` when valid
- `discount` when valid

## Admin Endpoints

All admin routes require authentication plus the `admin` role.

### GET `/api/admin/dashboard`

Return dashboard summary stats.

Response includes:

- `totalOrders`
- `pendingOrders`
- `preparingOrders`
- `deliveredOrders`
- `totalUsers`
- `totalMenuItems`
- `totalRevenue`
- `todayRevenue`

### GET `/api/admin/orders`

List all orders for admin management.

Optional query params:

- `page` default `1`
- `limit` default `20`
- `status` filter by order status

### PUT `/api/admin/orders/:id/status`

Update an order status.

Request body:

```json
{
  "status": "preparing",
  "note": "Kitchen started prep"
}
```

Supported statuses:

- `placed`
- `confirmed`
- `preparing`
- `out_for_delivery`
- `delivered`
- `cancelled`

### GET `/api/admin/sales`

Get sales analytics.

Optional query params:

- `start_date`
- `end_date`

Response includes:

- `salesStats`
- `popularItems`
- `paymentBreakdown`

### GET `/api/admin/sales/export`

Download a CSV sales report.

Optional query params:

- `start_date`
- `end_date`

### GET `/api/admin/users`

Get the user list for admin management.

## Frontend Integration Notes

- Store the token returned from login/signup and send it on protected requests.
- Use `credentials: 'include'` if you rely on the cookie-based token flow.
- Category and menu list pages can be loaded without auth.
- Order history, order details, and promo validation require auth.
- Admin pages should guard for the `admin` role from `/api/auth/profile` or login response.

## Environment Variables

Important backend environment values:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`

## Run Locally

```bash
npm install
npm run dev
```

The server starts on the configured `PORT` and runs migrations on startup.
