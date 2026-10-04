<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Character;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CharacterController extends Controller
{
    /**
     * Get all characters with optional filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Character::with(['readings', 'strokes']);

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('jlpt_level')) {
            $query->where('jlpt_level', $request->query('jlpt_level'));
        }

        $characters = $query->get();

        return response()->json([
            'status' => 'success',
            'count' => $characters->count(),
            'data' => $characters,
        ]);
    }

    /**
     * Get all hiragana characters with readings and strokes.
     */
    public function hiragana(): JsonResponse
    {
        $characters = Character::with(['readings', 'strokes'])
            ->where('type', 'hiragana')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'type' => 'hiragana',
            'count' => $characters->count(),
            'data' => $characters,
        ]);
    }

    /**
     * Get single character detail.
     */
    public function show(string $idOrChar): JsonResponse
    {
        $character = Character::with(['readings', 'strokes'])
            ->where('id', $idOrChar)
            ->orWhere('character', $idOrChar)
            ->first();

        if (!$character) {
            return response()->json([
                'status' => 'error',
                'message' => 'Karakter tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $character,
        ]);
    }
}
