# Blog API

A Laravel 13 REST API for a small blog. Users can register, log in, reset their password, publish text or photo posts, comment on posts, like posts and follow other users. PostgreSQL is the database and Laravel Sanctum handles token authentication.

## Features

- Register, login, logout and password reset (token based, Sanctum)
- Posts: a text post (max 280 characters), a photo post (jpg/png, max 2MB), or both
- Full CRUD on posts (owner only) and on comments (comment author only)
- Deleting a post also deletes its comments and its image file
- Get a user with their posts, and a post with its comments and the people who commented
- Extras: likes, follows, a global feed and a "following" feed
- Lists are paginated, 10 per page (use ?page=2)

## Requirements

- PHP 8.3 or higher with the pdo_pgsql, mbstring, openssl, fileinfo and gd extensions
- Composer
- PostgreSQL 14 or higher

## Setup

1. Install dependencies:

        composer install

2. Create the environment file and app key:

        copy .env.example .env
        php artisan key:generate

3. Create two PostgreSQL databases, one for the app and one for the tests (for example blog_api and blog_api_test), then set the DB_ values in .env:

        DB_CONNECTION=pgsql
        DB_HOST=127.0.0.1
        DB_PORT=5432
        DB_DATABASE=blog_api
        DB_USERNAME=postgres
        DB_PASSWORD=your-password

4. Run the migrations, link the public storage folder and start the server:

        php artisan migrate
        php artisan storage:link
        php artisan serve

The API is now at http://127.0.0.1:8000/api. Send the header `Accept: application/json` with every request.

## Authentication

Register or log in to receive a token, then send it on protected requests as `Authorization: Bearer <token>`.

Password reset: `POST /api/forgot-password` creates a reset email. With `MAIL_MAILER=log` (the default here) the email is written to storage/logs/laravel.log and contains the token. Then call `POST /api/reset-password` with the token, email and new password.

## Endpoints

All routes are prefixed with /api. Everything except the first four requires a token.

| Method | Path | What it does |
| --- | --- | --- |
| POST | /register | Create an account (name, email, password, password_confirmation) |
| POST | /login | Log in (email, password) and receive a token |
| POST | /forgot-password | Request a password reset (email) |
| POST | /reset-password | Reset the password (token, email, password, password_confirmation) |
| POST | /logout | Revoke the current token |
| GET | /user | The logged in user |
| GET | /users/{id} | A user with their posts (paginated) and follower counts |
| POST | /users/{id}/follow | Follow a user |
| DELETE | /users/{id}/follow | Unfollow a user |
| GET | /posts | Global feed, newest first. Add ?following=1 for people you follow |
| POST | /posts | Create a post (body and/or image, send as form-data for images) |
| GET | /posts/{id} | A post with its comments and each commenter (comments paginated) |
| PUT/PATCH | /posts/{id} | Update your post (body, image, remove_image) |
| DELETE | /posts/{id} | Delete your post, its comments and its image |
| POST | /posts/{id}/like | Like a post |
| DELETE | /posts/{id}/like | Remove your like |
| GET | /posts/{id}/comments | List a post's comments (paginated) |
| POST | /posts/{id}/comments | Comment on a post (body) |
| PUT/PATCH | /comments/{id} | Update your comment (body) |
| DELETE | /comments/{id} | Delete your comment |

Errors: 401 when not logged in, 403 when you do not own the post or comment, 404 when it does not exist, 422 for validation errors.

## Tests

The tests use their own database so your real data is never touched. Make sure the blog_api_test database exists, then run:

    php artisan test

## Postman

Import postman/BlogAPI.postman_collection.json into Postman. Running Register or Login saves the token automatically. Change the postId, commentId and userId collection variables to try other records.
