<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\UserResource;
use App\Models\User;

class UserController extends Controller
{
    public function show(User $user)
    {
        $user->loadCount(['followers', 'following']);
        $posts = $user->posts()->withCount(['comments', 'likes'])->latest()->paginate(10);

        return (new UserResource($user))->additional([
            'posts' => PostResource::collection($posts)->response()->getData(true),
        ]);
    }
}
