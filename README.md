# PLATERA Restaurant Management System

A comprehensive restaurant management system built with Django REST Framework and React.

## Features

- **User Authentication**
  - Admin, Manager, and Staff roles
  - JWT-based authentication
  - Role-based access control

- **Admin Dashboard**
  - System overview
  - Staff management
  - Menu management
  - Inventory tracking
  - Sales reporting

- **Staff Dashboard**
  - Table management
  - Order processing
  - Menu browsing
  - Order history

## Tech Stack

- **Backend**
  - Django 4.2
  - Django REST Framework
  - PostgreSQL
  - JWT Authentication

- **Frontend**
  - React 18
  - React Router 6
  - Tailwind CSS
  - Axios

## Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- pip
- npm or yarn

## Getting Started

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/shaheershat/PLATERA-RESTAURANT-MANAGEMENT-SYSTEM.git
   cd PLATERA-RESTAURANT-MANAGEMENT-SYSTEM/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory and configure the environment variables (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your database credentials and other settings.

5. Run migrations:
   ```bash
   python manage.py migrate
   ```

6. Create a superuser (admin):
   ```bash
   python manage.py createsuperuser
   ```

7. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. The application should now be running at `http://localhost:3000`

## API Endpoints

- `POST /api/token/` - Obtain JWT token (login)
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/manager/login/` - Manager login
- `POST /api/staff/login/` - Staff login
- `POST /api/logout/` - Logout
- `GET /api/user/` - Get current user profile

## Project Structure

```
PLATERA-RESTAURANT-MANAGEMENT-SYSTEM/
├── backend/                  # Django backend
│   ├── platera_app/         # Main app
│   │   ├── migrations/      # Database migrations
│   │   ├── __init__.py
│   │   ├── admin.py         # Admin configuration
│   │   ├── apps.py          # App config
│   │   ├── models.py        # Database models
│   │   ├── serializers.py   # API serializers
│   │   ├── urls.py          # App URLs
│   │   └── views.py         # API views
│   ├── platera_project/     # Project settings
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py      # Django settings
│   │   ├── urls.py          # Main URLs
│   │   └── wsgi.py
│   ├── manage.py
│   └── requirements.txt     # Python dependencies
│
└── frontend/                # React frontend
    ├── public/              # Static files
    └── src/
        ├── components/      # Reusable components
        ├── contexts/        # React contexts
        ├── pages/           # Page components
        ├── services/        # API services
        ├── App.js           # Main app component
        └── index.js         # Entry point
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
