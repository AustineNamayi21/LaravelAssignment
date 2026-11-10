<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SocialTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_like_and_unlike_a_post_once(): void
    {
        $post = User::factory()->create()->posts()->create(['body' => 'Like me']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/posts/{$post->id}/like")->assertOk()->assertJsonPath('likes_count', 1);
        $this->postJson("/api/posts/{$post->id}/like")->assertOk()->assertJsonPath('likes_count', 1);
        $this->deleteJson("/api/posts/{$post->id}/like")->assertOk()->assertJsonPath('likes_count', 0);
    }

    public function test_user_can_follow_and_unfollow_another_user(): void
    {
        $target = User::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/users/{$target->id}/follow")->assertOk()->assertJsonPath('followers_count', 1);
        $this->getJson("/api/users/{$target->id}")->assertJsonPath('data.followers_count', 1);
        $this->deleteJson("/api/users/{$target->id}/follow")->assertOk()->assertJsonPath('followers_count', 0);
    }

    public function test_user_cannot_follow_themselves(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/users/{$user->id}/follow")->assertUnprocessable();
    }

    public function test_global_feed_and_following_feed(): void
    {
        $me = User::factory()->create();
        $followed = User::factory()->create();
        $stranger = User::factory()->create();
        $followed->posts()->create(['body' => 'from followed']);
        $stranger->posts()->create(['body' => 'from stranger']);
        Sanctum::actingAs($me);

        $this->postJson("/api/users/{$followed->id}/follow")->assertOk();

        $this->getJson('/api/posts')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/posts?following=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'from followed');
    }
}
