<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Character extends Model
{
    use HasFactory;

    protected $fillable = [
        'character',
        'type',
        'strokes_count',
        'jlpt_level',
    ];

    protected $casts = [
        'strokes_count' => 'integer',
    ];

    public function readings(): HasMany
    {
        return $this->hasMany(CharacterReading::class);
    }

    public function strokes(): HasMany
    {
        return $this->hasMany(CharacterStroke::class)->orderBy('stroke_order', 'asc');
    }
}
