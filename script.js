let robot;
let wall;
let enemies = [];
let robots = [];
let health = 100;
let maxHealth = 100;
let healthRegen = 0;
let damage = 20;
let attackSpeed = 30; // frames between attacks
let range = 1000;
let lastAttackFrame = 0;
let wave = 1;
let coins = 0;
let multiShotChance = 0.03; // 3% chance for multishot
let maxRobots = 1; // Start with one robot
let upgradeCosts = {
    damage: 10,
    attackSpeed: 20,
    range: 10,
    health: 5,
    healthRegen: 15,
    multiShot: 50,
    moreRobots: 100
};

let outlineShader;
let stars = [];
let wallTexture;

function preload() {
    outlineShader = loadShader('outline.vert', 'outline.frag');
    wallTexture = loadImage('Wall2.webp');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    loadProfile(); // Load player profile
    wall = new Wall(-20, 0, 0, 80, 200, 500); // Move the wall to the left
    robot = new Robot(0, wall.h - 320, 0); // Place the robot on top of the wall
    robots.push(robot);
    if (wave === 1) wave = 0; // Start on wave 0 if it's the first load
    spawnEnemies(false); // Do not increment wave on initial load
    for (let i = 0; i < 1000; i++) {
        stars.push(new Star());
    }
}

function draw() {
    background(0);
    orbitControl();
    applyShader();
    drawStars();
    for (let r of robots) {
        r.show();
    }
    wall.show();
    let bossAlive = false;
    for (let enemy of enemies) {
        enemy.move();
        enemy.show();
        if (enemy.isBoss) {
            bossAlive = true;
        }
        if (enemy.x < wall.x + wall.w / 2) {
            if (enemy.isBoss) {
                wave = max(1, wave - 5); // Go back 5 waves if hit by a boss
                enemies = []; // Clear current enemies
                spawnEnemies(false); // Reset and start the current wave
                break;
            }
            health -= 1;
            enemies.splice(enemies.indexOf(enemy), 1);
        }
    }
    if (!bossAlive && enemies.length === 0) {
        spawnEnemies(true); // Increment wave only if enemies are spawned
    }
    for (let r of robots) {
        r.autoTarget();
    }
    updateStats();
    regenerateHealth();
    draw3DText();
    saveProfile(); // Save player profile
}

function applyShader() {
    shader(outlineShader);
    outlineShader.setUniform('outlineColor', [1, 1, 1]);
}

function drawStars() {
    for (let star of stars) {
        star.show();
    }
}

function spawnEnemies(incrementWave) {
    let isBossWave = wave % 5 === 0;
    let enemyCount = isBossWave ? 1 : wave * 5; // Only spawn one enemy if it's a boss wave
    let bossCount = isBossWave ? 1 : Math.floor(wave / 5); // Ensure only one boss spawns during a boss wave
    for (let i = 0; i < enemyCount; i++) {
        let isBoss = bossCount > 0 && i < bossCount;
        setTimeout(() => {
            enemies.push(new Enemy(400, random(-wall.h / 2, wall.h / 2), random(-wall.d / 2, wall.d / 2), wave, isBoss));
        }, i * 500); // spawn enemies with a delay
    }
    if (incrementWave && enemyCount > 0) wave++; // Increment wave only if enemies are spawned and incrementWave is true
}

function updateStats() {
    const healthBar = document.getElementById('health-bar');
    const coinsElement = document.getElementById('coins');
    const waveElement = document.getElementById('wave');
    const damageCost = document.getElementById('damage-cost');
    const attackSpeedCost = document.getElementById('attackSpeed-cost');
    const rangeCost = document.getElementById('range-cost');
    const healthCost = document.getElementById('health-cost');
    const healthRegenCost = document.getElementById('healthRegen-cost');
    const multiShotCost = document.getElementById('multiShot-cost');
    const moreRobotsCost = document.getElementById('moreRobots-cost');

    if (healthBar) healthBar.style.width = `${(health / maxHealth) * 100}%`;
    if (coinsElement) coinsElement.innerText = `Coins: ${coins}`;
    if (waveElement) waveElement.innerText = `Wave: ${wave}`;
    if (damageCost) damageCost.innerText = upgradeCosts.damage;
    if (attackSpeedCost) attackSpeedCost.innerText = upgradeCosts.attackSpeed;
    if (rangeCost) rangeCost.innerText = upgradeCosts.range;
    if (healthCost) healthCost.innerText = upgradeCosts.health;
    if (healthRegenCost) healthRegenCost.innerText = upgradeCosts.healthRegen;
    if (multiShotCost) multiShotCost.innerText = upgradeCosts.multiShot;
    if (moreRobotsCost) moreRobotsCost.innerText = upgradeCosts.moreRobots;
}

function regenerateHealth() {
    if (health < maxHealth) {
        health += healthRegen / 60; // regenerate health per second
        health = min(health, maxHealth);
    }
}

function upgradeDamage() {
    if (coins >= upgradeCosts.damage) {
        coins -= upgradeCosts.damage;
        damage += 5;
        upgradeCosts.damage += 20;
    }
}

function upgradeAttackSpeed() {
    if (coins >= upgradeCosts.attackSpeed) {
        coins -= upgradeCosts.attackSpeed;
        attackSpeed = max(10, attackSpeed - 5);
        upgradeCosts.attackSpeed += 20;
    }
}

function upgradeRange() {
    if (coins >= upgradeCosts.range) {
        coins -= upgradeCosts.range;
        range += 20;
        upgradeCosts.range += 20;
    }
}

function upgradeHealth() {
    if (coins >= upgradeCosts.health) {
        coins -= upgradeCosts.health;
        maxHealth += 20;
        health += 20;
        upgradeCosts.health += 20;
    }
}

function upgradeHealthRegen() {
    if (coins >= upgradeCosts.healthRegen) {
        coins -= upgradeCosts.healthRegen;
        healthRegen += 1;
        upgradeCosts.healthRegen += 10;
    }
}

function upgradeMultiShot() {
    if (coins >= upgradeCosts.multiShot) {
        coins -= upgradeCosts.multiShot;
        multiShotChance += 0.02; // Increase chance by 2%
        upgradeCosts.multiShot += 50;
        updateStats();
    }
}

function upgradeMoreRobots() {
    if (coins >= upgradeCosts.moreRobots && robots.length < 5) {
        coins -= upgradeCosts.moreRobots;
        let newRobot;
        if (robots.length % 2 === 0) {
            newRobot = new Robot(robots.length * 40, wall.h - 320, -40); // Position new robot to the left
        } else {
            newRobot = new Robot(robots.length * 40, wall.h - 320, 40); // Position new robot to the right
        }
        robots.push(newRobot);
        upgradeCosts.moreRobots += 100;
        updateStats();
    }
}

function resetPlayerData() {
    health = 100;
    maxHealth = 100;
    healthRegen = 0;
    damage = 20;
    attackSpeed = 30;
    range = 1000;
    wave = 1;
    coins = 0;
    multiShotChance = 0.03;
    maxRobots = 1;
    upgradeCosts = {
        damage: 10,
        attackSpeed: 20,
        range: 10,
        health: 5,
        healthRegen: 15,
        multiShot: 50,
        moreRobots: 100
    };
    robots = [new Robot(0, wall.h - 320, 0)];
    localStorage.removeItem('playerProfile');
    updateStats();
    spawnEnemies(false);
}

class Robot {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        rotateY(HALF_PI); // Rotate the robot 90 degrees
        shader(outlineShader);
        outlineShader.setUniform('outlineColor', [0, 1, 0]);
        fill(255, 255, 255);

        // Draw robot body
        push();
        translate(0, 0, 0);
        box(20, 40, 20);
        pop();

        // Draw robot head
        push();
        translate(0, -35, 0);
        box(20);
        pop();

        // Draw robot eyes
        push();
        translate(-5, -40, 10);
        fill(255, 0, 0); // Red color for laser eyes
        sphere(3);
        translate(10, 0, 0);
        sphere(3);
        pop();

        // Draw robot arms
        push();
        translate(-15, -10, 0);
        fill(255, 255, 255);
        box(10, 30, 10);
        translate(30, 0, 0);
        box(10, 30, 10);
        pop();

        // Draw robot legs
        push();
        translate(-5, 30, 0);
        box(10, 30, 10);
        translate(10, 0, 0);
        box(10, 30, 10);
        pop();

        // Draw robot antennas
        push();
        translate(-5, -50, 0);
        box(2, 10, 2);
        translate(10, 0, 0);
        box(2, 10, 2);
        pop();

        resetShader();
        pop();
    }

    autoTarget() {
        if (frameCount - lastAttackFrame >= attackSpeed) {
            let closestEnemy = null;
            let closestDist = range;
            for (let enemy of enemies) {
                let d = dist(this.x, this.y, this.z, enemy.x, enemy.y, enemy.z);
                if (d < closestDist && enemy.x > this.x) {
                    closestDist = d;
                    closestEnemy = enemy;
                }
            }
            if (closestEnemy) {
                if (random() < multiShotChance) {
                    this.shootMultiShot(closestEnemy);
                } else {
                    this.shootLaser(closestEnemy);
                }
                closestEnemy.health -= damage;
                if (closestEnemy.health <= 0) {
                    coins += closestEnemy.isBoss ? 50 : 10;
                    enemies.splice(enemies.indexOf(closestEnemy), 1);
                }
                lastAttackFrame = frameCount;
            }
        }
    }

    shootLaser(target) {
        push();
        stroke(255, 0, 0);
        strokeWeight(2);
        line(this.x, this.y, this.z, target.x, target.y, target.z);
        pop();
    }

    shootMultiShot(target) {
        let targets = enemies.filter(e => e !== target).slice(0, 2);
        targets.unshift(target);
        for (let i = 0; i < targets.length; i++) {
            setTimeout(() => {
                this.shootLaser(targets[i]);
                targets[i].health -= damage;
                if (targets[i].health <= 0) {
                    coins += targets[i].isBoss ? 50 : 10;
                    enemies.splice(enemies.indexOf(targets[i]), 1);
                }
            }, i * 100); // Delay each shot by 0.1 seconds
        }
    }
}

class Wall {
    constructor(x, y, z, w, h, d) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.d = d;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        rotateX(PI); // Flip the wall upside down
        shader(outlineShader);
        outlineShader.setUniform('outlineColor', [1, 1, 1]);
        texture(wallTexture);
        // Create a castle wall effect with battlements and holes
        for (let i = -this.d / 2; i < this.d / 2; i += 40) {
            for (let j = -this.h / 2; j < this.h / 2; j += 40) {
                push();
                translate(0, j, i);
                box(this.w, 40, 40);
                pop();
            }
        }
        // Add battlements on the sides with holes
        for (let i = -this.d / 2; i < this.d / 2; i += 80) {
            push();
            translate(-this.w / 2 - 20, this.h / 2, i);
            box(40, 40, 40);
            pop();
            push();
            translate(this.w / 2 + 20, this.h / 2, i);
            box(40, 40, 40);
            pop();
        }
        resetShader();
        pop();
    }
}

class Enemy {
    constructor(x, y, z, wave, isBoss) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.speed = 2 + wave * 0.1;
        this.health = 20 + wave * 5;
        this.isBoss = isBoss;
        if (isBoss) {
            this.health *= 5;
            this.speed *= 0.5;
            if (wave >= 10) {
                this.health *= 2;
                this.speed *= 0.5;
            }
        }
    }

    move() {
        this.x -= this.speed;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        shader(outlineShader);
        if (this.isBoss) {
            outlineShader.setUniform('outlineColor', [1, 1, 1]);
            fill(0, 0, 0);
            box(30);
        } else {
            outlineShader.setUniform('outlineColor', [1, 0, 0]);
            fill(255, 255, 255);
            box(20);
        }
        resetShader();
        pop();
    }
}

class Star {
    constructor() {
        this.x = random(-width, width);
        this.y = random(-height, height);
        this.z = random(-1000, 1000);
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        noStroke();
        fill(255);
        sphere(2);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw3DText() {
    push();
    translate(-width / 2 + 20, -height / 2 + 20, 0);
    fill(255, 215, 0); // Gold color for coins
    textSize(32);
    text(`Coins: ${coins}`, 0, 0);
    translate(0, 40, 0);
    fill(0, 255, 0); // Green color for wave
    text(`Wave: ${wave}`, 0, 0);
    pop();
}

function saveProfile() {
    const profile = {
        health,
        maxHealth,
        healthRegen,
        damage,
        attackSpeed,
        range,
        wave,
        coins,
        upgradeCosts,
        multiShotChance,
        maxRobots
    };
    localStorage.setItem('playerProfile', JSON.stringify(profile));
}

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('playerProfile'));
    if (profile) {
        health = profile.health;
        maxHealth = profile.maxHealth;
        healthRegen = profile.healthRegen;
        damage = profile.damage;
        attackSpeed = profile.attackSpeed;
        range = profile.range;
        wave = profile.wave;
        coins = profile.coins;
        upgradeCosts = profile.upgradeCosts;
        multiShotChance = profile.multiShotChance;
        maxRobots = profile.maxRobots;
        for (let i = 1; i < maxRobots; i++) {
            robots.push(new Robot(i * 40, wall.h - 320, 0));
        }
    }
}