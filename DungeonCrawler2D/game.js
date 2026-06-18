const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const GRID_SIZE = 10;

const player = {
    x: 0,
    y: 0,
    hp: 30,
    attack: 5,
    loot: 0
};

function randomPos() {
    return Math.floor(Math.random() * GRID_SIZE);
}

const monsters = [];
const items = [];
for (let i = 0; i < 5; i++) {
    monsters.push({ x: randomPos(), y: randomPos(), hp: 10, attack: 3 });
}
for (let i = 0; i < 5; i++) {
    items.push({ x: randomPos(), y: randomPos(), bonus: 1 });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#444';
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    // draw items
    items.forEach(item => {
        ctx.fillStyle = 'gold';
        ctx.fillRect(item.x * TILE_SIZE + 10, item.y * TILE_SIZE + 10, 20, 20);
    });
    // draw monsters
    monsters.forEach(m => {
        ctx.fillStyle = 'red';
        ctx.fillRect(m.x * TILE_SIZE + 5, m.y * TILE_SIZE + 5, 30, 30);
    });
    // draw player
    ctx.fillStyle = 'cyan';
    ctx.fillRect(player.x * TILE_SIZE + 5, player.y * TILE_SIZE + 5, 30, 30);
}

function updateHUD() {
    document.getElementById('health').textContent = `HP: ${player.hp}`;
    document.getElementById('attack').textContent = `ATK: ${player.attack}`;
    document.getElementById('inventory').textContent = `Loot: ${player.loot}`;
}

function fight(monster) {
    monster.hp -= player.attack;
    if (monster.hp <= 0) {
        const index = monsters.indexOf(monster);
        monsters.splice(index, 1);
        player.loot += 1;
    } else {
        player.hp -= monster.attack;
        if (player.hp <= 0) {
            alert('You died! Game over.');
            document.removeEventListener('keydown', handleInput);
        }
    }
    updateHUD();
}

function handleInput(e) {
    const key = e.key;
    if (key === 'ArrowUp' && player.y > 0) player.y--;
    if (key === 'ArrowDown' && player.y < GRID_SIZE - 1) player.y++;
    if (key === 'ArrowLeft' && player.x > 0) player.x--;
    if (key === 'ArrowRight' && player.x < GRID_SIZE - 1) player.x++;

    // check for monster encounter
    monsters.forEach(m => {
        if (m.x === player.x && m.y === player.y) {
            fight(m);
        }
    });

    // check for item pick up
    items.forEach((item, idx) => {
        if (item.x === player.x && item.y === player.y) {
            player.attack += item.bonus;
            items.splice(idx, 1);
            updateHUD();
        }
    });

    draw();
}

document.addEventListener('keydown', handleInput);

draw();
updateHUD();
