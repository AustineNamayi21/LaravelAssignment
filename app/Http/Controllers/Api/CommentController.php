<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        $comments = $post->comments()->with('user')->latest()->paginate(10);

        return CommentResource::collection($comments);
    }

    public function store(Request $request, Post $post)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $comment = new Comment(['body' => $data['body']]);
        $comment->user_id = $request->user()->id;
        $post->comments()->save($comment);

        return (new CommentResource($comment->load('user')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Comment $comment)
    {
        Gate::authorize('update', $comment);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $comment->update($data);

        return new CommentResource($comment->load('user'));
    }

    public function destroy(Comment $comment)
    {
        Gate::authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }
}
