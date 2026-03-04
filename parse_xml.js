const fs = require('fs');

function parseXML(filePath) {
    const xml = fs.readFileSync(filePath, 'utf8');
    const lines = xml.split('\n');
    const sprites = {};
    
    for (const line of lines) {
        if (line.includes('<SubTexture')) {
            const nameMatch = line.match(/name="([^"]+)"/);
            const xMatch = line.match(/x="([^"]+)"/);
            const yMatch = line.match(/y="([^"]+)"/);
            const widthMatch = line.match(/width="([^"]+)"/);
            const heightMatch = line.match(/height="([^"]+)"/);
            
            if (nameMatch && xMatch && yMatch && widthMatch && heightMatch) {
                sprites[nameMatch[1]] = {
                    x: parseInt(xMatch[1]),
                    y: parseInt(yMatch[1]),
                    width: parseInt(widthMatch[1]),
                    height: parseInt(heightMatch[1])
                };
            }
        }
    }
    return sprites;
}

const tiles = parseXML('kenney_assets/Spritesheets/spritesheet-tiles-default.xml');
const bg = parseXML('kenney_assets/Spritesheets/spritesheet-backgrounds-default.xml');
const chars = parseXML('kenney_assets/Spritesheets/spritesheet-characters-default.xml');
const enemies = parseXML('kenney_assets/Spritesheets/spritesheet-enemies-default.xml');

const allSprites = {
    tiles: tiles,
    backgrounds: bg,
    characters: chars,
    enemies: enemies
};

fs.writeFileSync('sprite_data.js', 'const spriteData = ' + JSON.stringify(allSprites, null, 2) + ';\n');
