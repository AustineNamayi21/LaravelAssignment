<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::with('user')->withCount(['comments', 'likes'])->latest();

        if ($request->boolean('following')) {
            $query->whereIn('user_id', $request->user()->following()->pluck('users.id'));
        }

        return PostResource::collection($query->paginate(10));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:280', 'required_without:image'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048', 'required_without:body'],
        ]);

        $post = $request->user()->posts()->create([
            'body' => $data['body'] ?? null,
            'image_path' => $request->hasFile('image')
                ? $request->file('image')->store('posts', 'public')
                : null,
        ]);

        return (new PostResource($post->load('user')))->response()->setStatusCode(201);
    }

    public function show(Post $post)
    {
        $post->load('user')->loadCount(['comments', 'likes']);
        $comments = $post->comments()->with('user')->latest()->paginate(10);

        return (new PostResource($post))->additional([
            'comments' => CommentResource::collection($comments)->response()->getData(true),
        ]);
    }

    public function update(Request $request, Post $post)
    {
        Gate::authorize('update', $post);

        $data = $request->validate([
            'body' => ['sometimes', 'nullable', 'string', 'max:280'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
        ]);

        $body = array_key_exists('body', $data) ? $data['body'] : $post->body;
        $newImage = $request->hasFile('image');
        $removeImage = $request->boolean('remove_image');
        $keepsImage = $newImage || ($post->image_path && ! $removeImage);

        if ($body === null && ! $keepsImage) {
            throw ValidationException::withMessages([
                'body' => ['A post needs text or an image.'],
            ]);
        }

        if (($newImage || $removeImage) && $post->image_path) {
            Storage::disk('public')->delete($post->image_path);
            $post->image_path = null;
        }

        if ($newImage) {
            $post->image_path = $request->file('image')->store('posts', 'public');
        }

        $post->body = $body;
        $post->save();

        return new PostResource($post->load('user')->loadCount('comments'));
    }

    public function destroy(Post $post)
    {
        Gate::authorize('delete', $post);

        if ($post->image_path) {
            Storage::disk('public')->delete($post->image_path);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }
}

