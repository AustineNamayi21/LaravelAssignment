<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_text_post(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/posts', ['body' => 'My first post'])
            ->assertCreated()
            ->assertJsonPath('data.body', 'My first post')
            ->assertJsonPath('data.author.id', $user->id);

        $this->assertDatabaseHas('posts', ['user_id' => $user->id, 'body' => 'My first post']);
    }

    public function test_user_can_create_a_photo_post(): void
    {
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/posts', [
            'body' => 'With a photo',
            'image' => UploadedFile::fake()->image('photo.png'),
        ])->assertCreated();

        $this->assertNotNull($response->json('data.image_url'));
        Storage::disk('public')->assertExists(Post::first()->image_path);
    }

    public function test_post_needs_text_or_an_image(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/posts', [])->assertUnprocessable();
    }

    public function test_post_text_is_limited_to_280_characters(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/posts', ['body' => str_repeat('a', 281)])->assertUnprocessable();
    }

    public function test_owner_can_update_their_post(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['body' => 'Original']);
        Sanctum::actingAs($user);

        $this->putJson("/api/posts/{$post->id}", ['body' => 'Edited'])
            ->assertOk()
            ->assertJsonPath('data.body', 'Edited');
    }

    public function test_update_cannot_leave_a_post_empty(): void
    {
        $user = User::factory()->create();
        $post = $user->posts()->create(['body' => 'Original']);
        Sanctum::actingAs($user);

        $this->putJson("/api/posts/{$post->id}", ['body' => null])->assertUnprocessable();
    }

    public function test_other_users_cannot_update_or_delete_a_post(): void
    {
        $owner = User::factory()->create();
        $post = $owner->posts()->create(['body' => 'Mine']);
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/posts/{$post->id}", ['body' => 'Hacked'])->assertForbidden();
        $this->deleteJson("/api/posts/{$post->id}")->assertForbidden();
        $this->assertDatabaseHas('posts', ['id' => $post->id, 'body' => 'Mine']);
    }

    public function test_deleting_a_post_removes_its_comments_and_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $commenter = User::factory()->create();
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/posts', [
            'body' => 'To be deleted',
            'image' => UploadedFile::fake()->image('pic.png'),
        ])->assertCreated()->json('data.id');

        $path = Post::find($id)->image_path;
        Comment::forceCreate(['user_id' => $commenter->id, 'post_id' => $id, 'body' => 'A comment']);
        Storage::disk('public')->assertExists($path);

        $this->deleteJson("/api/posts/{$id}")->assertOk();

        $this->assertDatabaseMissing('posts', ['id' => $id]);
        $this->assertDatabaseMissing('comments', ['post_id' => $id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_post_is_returned_with_comments_and_commenters(): void
    {
        $author = User::factory()->create(['name' => 'Author']);
        $commenter = User::factory()->create(['name' => 'Commenter']);
        $post = $author->posts()->create(['body' => 'Hello']);
        Comment::forceCreate(['user_id' => $commenter->id, 'post_id' => $post->id, 'body' => 'Nice one']);
        Sanctum::actingAs($author);

        $this->getJson("/api/posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('data.body', 'Hello')
            ->assertJsonPath('comments.data.0.body', 'Nice one')
            ->assertJsonPath('comments.data.0.commenter.name', 'Commenter');
    }

    public function test_user_is_returned_with_their_posts(): void
    {
        $user = User::factory()->create(['name' => 'Poster']);
        $user->posts()->create(['body' => 'First']);
        $user->posts()->create(['body' => 'Second']);
        Sanctum::actingAs($user);

        $this->getJson("/api/users/{$user->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Poster')
            ->assertJsonCount(2, 'posts.data');
    }
}
