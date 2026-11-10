<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Request $request, Post $post)
    {
        $request->user()->likedPosts()->syncWithoutDetaching([$post->id]);

        return response()->json([
            'message' => 'Post liked.',
            'likes_count' => $post->likes()->count(),
        ]);
    }

    public function destroy(Request $request, Post $post)
    {
        $request->user()->likedPosts()->detach($post->id);

        return response()->json([
            'message' => 'Like removed.',
            'likes_count' => $post->likes()->count(),
        ]);
    }
}
