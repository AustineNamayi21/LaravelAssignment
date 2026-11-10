<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    private function makeComment(): array
    {
        $postOwner = User::factory()->create();
        $commenter = User::factory()->create();
        $post = $postOwner->posts()->create(['body' => 'A post']);
        $comment = Comment::forceCreate(['user_id' => $commenter->id, 'post_id' => $post->id, 'body' => 'Original']);

        return [$post, $comment, $commenter, $postOwner];
    }

    public function test_user_can_comment_on_a_post(): void
    {
        $post = User::factory()->create()->posts()->create(['body' => 'A post']);
        $commenter = User::factory()->create();
        Sanctum::actingAs($commenter);

        $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'Nice post'])
            ->assertCreated()
            ->assertJsonPath('data.commenter.id', $commenter->id);

        $this->assertDatabaseHas('comments', ['post_id' => $post->id, 'user_id' => $commenter->id]);
    }

    public function test_comment_needs_a_body(): void
    {
        $post = User::factory()->create()->posts()->create(['body' => 'A post']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/posts/{$post->id}/comments", [])->assertUnprocessable();
    }

    public function test_comments_must_be_made_while_logged_in(): void
    {
        $post = User::factory()->create()->posts()->create(['body' => 'A post']);

        $this->postJson("/api/posts/{$post->id}/comments", ['body' => 'Hi'])->assertUnauthorized();
    }

    public function test_comments_are_listed_for_a_post(): void
    {
        [$post, , , $postOwner] = $this->makeComment();
        Sanctum::actingAs($postOwner);

        $this->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_author_can_update_their_comment(): void
    {
        [, $comment, $commenter] = $this->makeComment();
        Sanctum::actingAs($commenter);

        $this->putJson("/api/comments/{$comment->id}", ['body' => 'Edited'])
            ->assertOk()
            ->assertJsonPath('data.body', 'Edited');
    }

    public function test_other_users_cannot_update_or_delete_a_comment(): void
    {
        [, $comment, , $postOwner] = $this->makeComment();
        Sanctum::actingAs($postOwner);

        $this->putJson("/api/comments/{$comment->id}", ['body' => 'Hacked'])->assertForbidden();
        $this->deleteJson("/api/comments/{$comment->id}")->assertForbidden();
        $this->assertDatabaseHas('comments', ['id' => $comment->id, 'body' => 'Original']);
    }

    public function test_author_can_delete_their_comment(): void
    {
        [, $comment, $commenter] = $this->makeComment();
        Sanctum::actingAs($commenter);

        $this->deleteJson("/api/comments/{$comment->id}")->assertOk();

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }
}
