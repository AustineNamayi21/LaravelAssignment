<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'image_url' => $this->image_path ? asset('storage/' . $this->image_path) : null,
            'author' => new UserResource($this->whenLoaded('user')),
            'comments_count' => $this->whenCounted('comments'),
            'likes_count' => $this->whenCounted('likes'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
