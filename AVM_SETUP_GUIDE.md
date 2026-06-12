# AVM Section Setup Guide

## Current Status
✅ All songs in `songs.json` now have the `"avm": false` field by default.

## How to Add Songs to AVM Section

To add songs to the AVM section, simply change `"avm": false` to `"avm": true` for those specific songs in `songs.json`.

### Example:

**Song with AVM disabled (default):**
```json
{
  "id": 1,
  "title": "KAMALI",
  "artist": "Seedhe Maut",
  "cover": "https://example.com/cover.jpg",
  "src": "https://example.com/song.mp3",
  "avm": false
}
```

**Song with AVM enabled:**
```json
{
  "id": 1,
  "title": "KAMALI",
  "artist": "Seedhe Maut",
  "cover": "https://example.com/cover.jpg",
  "src": "https://example.com/song.mp3",
  "avm": true
}
```

## Section Order on Homepage

The sections appear in this order:
1. Recent Row
2. Recommended for today
3. **AVM** (appears only when at least one song has `"avm": true`)
4. Trending Hindi Songs

## Important Notes

- The AVM section will **automatically appear** when you set `"avm": true` for at least one song
- The section will **automatically hide** if no songs have `"avm": true`
- No code changes needed - just update the JSON file!

## How to Edit songs.json

1. Open `songs.json` in your code editor
2. Find the song you want to add to AVM section
3. Change `"avm": false` to `"avm": true`
4. Save the file
5. Refresh your browser

That's it! The AVM section will show all songs marked with `"avm": true`.
