<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CharacterStroke extends Model
{
    use HasFactory;

    protected $fillable = [
        'character_id',
        'stroke_order',
        'svg_path',
    ];

    protected $casts = [
        'stroke_order' => 'integer',
    ];

    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class);
    }
}
