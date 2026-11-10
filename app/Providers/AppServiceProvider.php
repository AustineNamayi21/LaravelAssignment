<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return config('app.frontend_url', 'http://localhost:3000')
                . '/reset-password?token=' . $token
                . '&email=' . urlencode($user->getEmailForPasswordReset());
        });
    }
}
