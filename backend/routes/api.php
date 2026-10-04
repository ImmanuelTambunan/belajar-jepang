<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Nihongo Sora API is running smoothly',
        'timestamp' => now()->toIso8601String(),
    ]);
});
