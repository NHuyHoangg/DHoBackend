# DHoBackend

DHoBackend is the backend service for an ecommerce application, providing APIs for user management, posting and managing products, payment processing, and location/address services. It is built with Node.js and Express, and interacts with a PostgreSQL database.

## Features

- **User Management:** Register, log in, and manage user accounts.
- **Product Posts:** Create, view, and manage product listings with media content.
- **Payment & Recharge:** Integrates with VNPay for secure payment and account recharge operations.
- **Location Services:** Provides APIs to fetch provinces, districts, and wards for address management.
- **Admin Controls:** Admin endpoints for managing users and site content.
- **Logging:** Logs API requests and activities for monitoring and debugging.
- **Swagger Documentation:** API documentation generated with Swagger.

## Tech Stack

- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **API Docs:** Swagger (see `middlewares/swagger.js`)
- **Payment Gateway:** VNPay

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NHuyHoangg/DHoBackend.git
   cd DHoBackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required values (such as database credentials, VNPay keys, etc.).

4. **Run the server:**
   ```bash
   npm start
   ```
   Server will start on the port specified in your `.env` file.

## API Endpoints

- `/users` - User related actions (registration, login, etc.)
- `/posts` - Product posting and retrieval
- `/recharge` - Payment and recharge operations (VNPay integration)
- `/location` - Address and location data (provinces, districts, wards)
- `/ads` - Advertisement-related endpoints
- `/admin` - Admin-specific actions (user management)

Check out the Swagger documentation for a full list of endpoints and request/response formats.

## Database

- Uses PostgreSQL.
- Connection and queries are managed via a connection pool.
- Example tables: `users`, `post`, `recharge_history`, `logs`, etc.

## Payment Processing

- VNPay integration for secure online payments and recharges.
- Payment URLs are generated and transaction status is handled via callback endpoints.

## Logging

- All incoming requests and important activities are logged into the `logs` table with user ID, API route, and response time.

## Contributing

Contributions are welcome! Please fork the repository, create a new branch, and make a pull request.

## License

This project does not currently specify a license. Please contact the repository owner for more information.

## Links

- [Project Homepage](https://d-ho-backend.vercel.app)
- [GitHub Repository](https://github.com/NHuyHoangg/DHoBackend)
