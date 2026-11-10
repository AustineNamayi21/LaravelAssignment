<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    public function store(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot follow yourself.'],
            ]);
        }

        $request->user()->following()->syncWithoutDetaching([$user->id]);

        return response()->json([
            'message' => 'Now following ' . $user->name . '.',
            'followers_count' => $user->followers()->count(),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $request->user()->following()->detach($user->id);

        return response()->json([
            'message' => 'Unfollowed ' . $user->name . '.',
            'followers_count' => $user->followers()->count(),
        ]);
    }
}
