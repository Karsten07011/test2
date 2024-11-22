let robot;
let wall;
let enemies = [];
let robots = [];
let health = 100;
let maxHealth = 100;
let damage = 20;
let attackSpeed = 20; // frames between attacks
let range = 300;
let lastAttackFrame = 0;
let bossDefeated = false;
let animationFrame = 0;
let cinematicMode = false;
let cameraAngle = 0;
let wallPieces = [];
let wallExploded = false;
let explosionDuration = 180; // Duration of the explosion in frames

let outlineShader;
let stars = [];
let wallTexture;

function preload() {
    outlineShader = loadShader('outline.vert', 'outline.frag');
    wallTexture = loadImage('Wall2.webp');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    wall = new Wall(-20, 0, 0, 80, 200, 500); // Move the wall to the left
    robot = new Robot(0, wall.h - 320, 0); // Place the robot on top of the wall
    robots.push(robot);
    spawnEnemies(); // Spawn initial enemies
    for (let i = 0; i < 1000; i++) {
        stars.push(new Star());
    }
}

function draw() {
    background(0);
    if (!cinematicMode) {
        setCameraPosition();
    } else {
        cinematicCamera();
    }
    applyShader();
    drawStars();
    for (let r of robots) {
        r.show();
    }
    if (!bossDefeated) {
        wall.show();
    } else {
        if (explosionDuration > 0) {
            explodeWall();
            explosionDuration--;
        } else {
            animateWallRebuild();
        }
    }
    for (let enemy of enemies) {
        enemy.move();
        enemy.show();
        if (enemy.x < wall.x + wall.w / 2) {
            if (enemy.isBoss) {
                bossDefeated = true;
                enemies = []; // Clear current enemies
                cinematicMode = true;
                break;
            }
            health -= 1;
            enemies.splice(enemies.indexOf(enemy), 1);
        }
    }
    for (let r of robots) {
        r.autoTarget();
    }
    if (bossDefeated) {
        animateRobotLeaving();
    }
}

function setCameraPosition() {
    let camX = 500 * cos(PI / 4);
    let camY = -300;
    let camZ = 500 * sin(PI / 4);
    camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
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

function spawnEnemies() {
    let enemyCount = 50; // Spawn 50 enemies
    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            enemies.push(new Enemy(400, random(-wall.h / 2, wall.h / 2), random(-wall.d / 2, wall.d / 2), false));
        }, i * 500); // spawn enemies with a delay
    }
    setTimeout(spawnBoss, enemyCount * 500 + 3000); // Spawn boss after all enemies
}

function spawnBoss() {
    enemies.push(new Enemy(400, 0, 0, true)); // Spawn a single big boss
}

function explodeWall() {
    if (wallPieces.length === 0) {
        for (let i = -wall.d / 2; i < wall.d / 2; i += 40) {
            for (let j = -wall.h / 2; j < wall.h / 2; j += 40) {
                wallPieces.push(new WallPiece(wall.x, wall.y + j, wall.z + i, 40, 40, 40));
            }
        }
    }
    for (let piece of wallPieces) {
        piece.move();
        piece.show();
    }
    wallExploded = true;
}

function animateWallRebuild() {
    for (let piece of wallPieces) {
        piece.moveBack();
        piece.show();
    }
    if (wallPieces.every(piece => piece.isBack())) {
        setTimeout(() => {
            window.location.reload(); // Reload the window to reset everything
        }, 2000); // Wait for 2 seconds before reloading
    }
}

function animateRobotLeaving() {
    animationFrame++;
    if (animationFrame < 180) {
        robot.y -= 1; // Robot floats up for 3 seconds
        robot.rotate();
    } else if (animationFrame < 360) {
        robot.x += 2; // Robot moves to the right for 3 seconds
        robot.rotate();
    } else if (animationFrame < 540) {
        robot.y += 1; // Robot falls back down for 3 seconds
        robot.rotate();
    } else {
        wallExploded = false;
        explosionDuration = 180; // Reset explosion duration
        animationFrame = 0;
        resetAnimation(); // Reset the animation loop
    }
}

function cinematicCamera() {
    cameraAngle += 0.01;
    let camX = cos(cameraAngle) * 500;
    let camZ = sin(cameraAngle) * 500;
    camera(camX, -200, camZ, robot.x, robot.y, robot.z, 0, 1, 0);
    if (cameraAngle > PI) {
        cinematicMode = false;
        animationFrame = 0;
    }
}

function resetAnimation() {
    bossDefeated = false;
    health = maxHealth;
    enemies = [];
    wallPieces = [];
    wall = new Wall(-20, 0, 0, 80, 200, 500); // Reset the wall
    robot = new Robot(0, wall.h - 320, 0); // Reset the robot
    robots = [robot];
    spawnEnemies();
}

class Robot {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotation = 0;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        rotateY(this.rotation); // Rotate the robot smoothly
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
                this.shootLaser(closestEnemy);
                closestEnemy.health -= damage;
                if (closestEnemy.health <= 0) {
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

    rotate() {
        this.rotation += 0.05; // Smooth rotation
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

class WallPiece {
    constructor(x, y, z, w, h, d) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        this.h = h;
        this.d = d;
        this.vx = random(-5, 5);
        this.vy = random(-5, 5);
        this.vz = random(-5, 5);
        this.originalX = x;
        this.originalY = y;
        this.originalZ = z;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
    }

    moveBack() {
        this.x = lerp(this.x, this.originalX, 0.05);
        this.y = lerp(this.y, this.originalY, 0.05);
        this.z = lerp(this.z, this.originalZ, 0.05);
    }

    isBack() {
        return dist(this.x, this.y, this.z, this.originalX, this.originalY, this.originalZ) < 1;
    }

    show() {
        push();
        translate(this.x, this.y, this.z);
        texture(wallTexture); // Apply texture to wall pieces
        box(this.w, this.h, this.d);
        pop();
    }
}

class Enemy {
    constructor(x, y, z, isBoss) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.speed = 2;
        this.health = 20;
        this.isBoss = isBoss;
        if (isBoss) {
            this.health = 100000;
            this.speed *= 0.5;
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
            box(60); // Make the boss bigger
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