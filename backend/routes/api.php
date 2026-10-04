<?php

use App\Http\Controllers\Api\CharacterController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Nihongo Sora API is running smoothly',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Character routes
Route::prefix('characters')->group(function () {
    Route::get('/hiragana', [CharacterController::class, 'hiragana']);
    Route::get('/', [CharacterController::class, 'index']);
    Route::get('/{idOrChar}', [CharacterController::class, 'show']);
});
