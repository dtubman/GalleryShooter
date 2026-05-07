class Scene1 extends Phaser.Scene {
    constructor() {
        super("Scene1");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];   
        this.maxBullets = 10;           // Don't create more than this many bullets
        
        this.myScore = 0;       // record a score as a class variable
        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
        this.playerHealth = 3;
        this.gameOver = false;

        this.my.sprite.enemies = [];
        this.my.sprite.tears = [];
        
        this.currentWave = 1;        
        this.maxWaves = 3;
        this.enemiesInWave = 0;
        this.enemiesDestroyed = 0;
    }

    preload() {
        this.load.setPath("./assets/");

        //Player
        this.load.image("plane", "ship_0000.png");
        
        //Projectiles
        this.load.image("giraffe", "giraffe.png");
        this.load.image("monkey", "monkey.png");
        this.load.image("panda", "panda.png");
        this.load.image("penguin", "penguin.png");
        this.load.image("pig", "pig.png");
        this.load.image("rabbit", "rabbit.png");
        this.load.image("parrot", "parrot.png");

        //Aliens
        this.load.image("alienBlue", "alienBlue_hurt.png");
        this.load.image("alienGreen", "alienGreen_hurt.png");
        this.load.image("alienPink", "alienPink_hurt.png");
        this.load.image("alienYellow", "alienYellow_hurt.png");

        //Alien Projectiles
        this.load.image("tear", "slimeBlue_squashed.png");

        // For animation
        this.load.image("whitePuff00", "whitePuff00.png");
        this.load.image("whitePuff01", "whitePuff01.png");
        this.load.image("whitePuff02", "whitePuff02.png");
        this.load.image("whitePuff03", "whitePuff03.png");

        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        this.load.audio("sfx_hit", "jingles_HIT13.ogg");
        this.load.audio("BackgroundMusic", "mondamusic-retro-arcade-game-music-512837.mp3");
        this.load.audio("sfx_player_hit", "impactMetal_light_000.ogg");
    }

    create() {
        let my = this.my;

        my.sprite.plane = this.add.sprite(game.config.width/2, game.config.height - 40, "plane");
        my.sprite.plane.setScale(0.25);

        

        // Notice that in this approach, we don't create any bullet sprites in create(),
        // and instead wait until we need them, based on the number of space bar presses

        // Create white puff animation
        this.anims.create({
            key: "puff",
            frames: [
                { key: "whitePuff00" },
                { key: "whitePuff01" },
                { key: "whitePuff02" },
                { key: "whitePuff03" },
            ],
            frameRate: 20,    // Note: case sensitive (thank you Ivy!)
            repeat: 5,
            hideOnComplete: true
        });

        this.sfx_hit = this.sound.add("sfx_hit", {
            rate: 2.0,
            volume: 0.5
        });

        this.sfx_player_hit = this.sound.add("sfx_player_hit", {
            rate: 1.0,
            volume: 0.8
        });


        this.sound.add("sfx_hit", {
            rate: 2.0,
            volume: 0.5
        });

        // Create key objects
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Set movement speeds (in pixels/tick)
        this.playerSpeed = 300;
        this.bulletSpeed = 300;

        // update HTML description
        document.getElementById('description').innerHTML = '<h2>Pet the Aliens!!!</h2><br>A: left // D: right // Space: fire/emit';

        // Put score on screen
        my.text.score = this.add.bitmapText(580, 0, "rocketSquare", "Score " + this.myScore);

       this.backgroundMusic = this.sound.add('BackgroundMusic', {
            loop: true,
            volume: 1.0
        });
        this.backgroundMusic.play();

        this.createGameOverScreen();
        this.initGame();
    }

    // ============================================
initGame() {
    let my = this.my;

    // Reset game state variables
    this.myScore = 0;
    this.playerHealth = 3;
    this.gameOver = false;
    this.currentWave = 1;
    this.enemiesInWave = 0;
    this.enemiesDestroyed = 0;
 
    // Clear existing bullets
    if (my.sprite.bullet && my.sprite.bullet.length > 0) {
        for (let bullet of my.sprite.bullet) {
            bullet.destroy();
        }
        my.sprite.bullet = [];
    }
    
    // Clear existing enemies
    if (my.sprite.enemies && my.sprite.enemies.length > 0) {
        for (let enemy of my.sprite.enemies) {
            enemy.destroy();
        }
        my.sprite.enemies = [];
    }
    
    // Clear existing tears
    if (my.sprite.tears && my.sprite.tears.length > 0) {
        for (let tear of my.sprite.tears) {
            tear.destroy();
        }
        my.sprite.tears = [];
    }
 
    // Destroy and recreate player sprite
    if (my.sprite.plane) {
        my.sprite.plane.destroy();
    }
    my.sprite.plane = this.add.sprite(game.config.width/2, game.config.height - 40, "plane");
    my.sprite.plane.setScale(1.0);

    // Destroy and recreate UI text
    if (my.text.score) {
        my.text.score.destroy();
    }
    my.text.score = this.add.bitmapText(580, 0, "rocketSquare", "Score " + this.myScore);
 
    if (my.text.health) {
        my.text.health.destroy();
    }
    my.text.health = this.add.bitmapText(10, 30, "rocketSquare", "Health: " + this.playerHealth);
    
    // Wave display
    if (my.text.wave) {
        my.text.wave.destroy();
    }
    my.text.wave = this.add.bitmapText(10, 55, "rocketSquare", "Wave: " + this.currentWave);
 
    // Hide game over screen
    if (this.gameOverContainer) {
        this.gameOverContainer.setVisible(false);
    }
    
    if (!this.backgroundMusic.isPlaying) {
    this.backgroundMusic.play();
    }

    // Start first wave
    this.spawnWave(this.currentWave);
    }

    spawnWave(waveNumber) {
    let my = this.my;
    
    // Wave patterns - each wave has different enemy layouts
    if (waveNumber === 1) {
        // Wave 1: Simple row of 5 normal aliens
        this.enemiesInWave = 5;
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy(100 + i * 120, 50, "normal");
        }
    } 
    else if (waveNumber === 2) {
        // Wave 2: 3 normal aliens + 2 rushing aliens
        this.enemiesInWave = 5;
        // Normal aliens in a row
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy(150 + i * 120, 50, "normal");
        }
        // Rushing aliens on the sides
        this.spawnEnemy(50, 100, "rushing");
        this.spawnEnemy(550, 100, "rushing");
    }
    else if (waveNumber === 3) {
        // Wave 3: 4 normal + 3 rushing in a V pattern
        this.enemiesInWave = 7;
        // Top row normal
        for (let i = 0; i < 4; i++) {
            this.spawnEnemy(100 + i * 120, 30, "normal");
        }
        // V pattern rushing
        this.spawnEnemy(200, 80, "rushing");
        this.spawnEnemy(300, 100, "rushing");
        this.spawnEnemy(400, 80, "rushing");
    }
    
    // Reset destroyed counter
    this.enemiesDestroyed = 0;
    }
 
    spawnEnemy(x, y, type) {
    let my = this.my;
    let enemy;
    
    if (type === "normal") {
        // Randomly pick blue or green alien
        let sprite = Math.random() > 0.5 ? "alienBlue" : "alienGreen";
        enemy = this.add.sprite(x, y, sprite);
        enemy.setScale(0.8);  // Adjust scale as needed

        enemy.enemyType = "normal";
        enemy.speed = 50;
        enemy.scorePoints = 100;
        enemy.shootTimer = 0;
        enemy.shootInterval = 2000;
    } 
    else if (type === "rushing") {
        // Pink or yellow aliens for rushing
        let sprite = Math.random() > 0.5 ? "alienPink" : "alienYellow";
        enemy = this.add.sprite(x, y, sprite);
        enemy.setScale(0.5);
        
        enemy.enemyType = "rushing";
        enemy.speed = 200;
        enemy.scorePoints = 500;
        enemy.rushAngle = 0;
        enemy.isRushing = false;
        enemy.rushTimer = 0;
        enemy.rushDelay = 3000;
    }

    if (enemy) {
        my.sprite.enemies.push(enemy);
    }
    
    my.sprite.enemies.push(enemy);
    }

    enemyShootTear(enemy) {
    let my = this.my;
    
    // Create tear using slimeBlue sprite
    let tear = this.add.sprite(enemy.x, enemy.y + 20, "tear");
    tear.setScale(0.4);  // Adjust scale
    
    // Calculate direction toward PLANE (not elephant)
    let dx = my.sprite.plane.x - enemy.x;
    let dy = my.sprite.plane.y - enemy.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    tear.vx = (dx / distance) * 150;
    tear.vy = (dy / distance) * 150;
    
    my.sprite.tears.push(tear);
    }

    checkWaveComplete() {
    if (this.enemiesDestroyed >= this.enemiesInWave) {
        this.currentWave++;
        
        if (this.currentWave > this.maxWaves) {
            // Player won! All waves complete
            this.winGame();
        } else {
            // Start next wave
            this.my.text.wave.setText("Wave: " + this.currentWave);
            this.time.delayedCall(2000, () => {
                this.spawnWave(this.currentWave);
            });
        }
    }
    }

    winGame() {
    this.gameOver = true;
    this.finalScoreText.setText(`Victory! Score: ${this.myScore}`);
    this.gameOverContainer.setVisible(true);
    }

    createGameOverScreen() {
    this.gameOverContainer = this.add.container(0, 0);

    let overlay = this.add.rectangle(
        game.config.width / 2,
        game.config.height / 2,
        game.config.width,
        game.config.height,
        0x000000, 0.7
    );

    this.finalScoreText = this.add.bitmapText(
        game.config.width / 2,
        game.config.height / 2 - 60,
        "rocketSquare",
        "Game Over!\nScore: 0",
        32
    ).setOrigin(0.5);

    let restartText = this.add.bitmapText(
        game.config.width / 2,
        game.config.height / 2 + 40,
        "rocketSquare",
        "Press R to Restart",
        24
    ).setOrigin(0.5);

    this.gameOverContainer.add([overlay, this.finalScoreText, restartText]);
    this.gameOverContainer.setVisible(false);

    this.input.keyboard.addKey('R').on('down', () => {
        if (this.gameOver) {
            this.initGame();
        }
    });
}

takeDamage() {
    this.sfx_player_hit.play();
    this.playerHealth--;
    this.my.text.health.setText("Health: " + this.playerHealth);

    this.tweens.add({
        targets: this.my.sprite.plane,
        alpha: 0,
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
            this.my.sprite.plane.alpha = 1;
        }
    });

    if (this.playerHealth <= 0) {
        this.gameOver = true;
        this.finalScoreText.setText("Game Over!\nScore: " + this.myScore);
        this.gameOverContainer.setVisible(true);
        this.backgroundMusic.stop();
    }
    }

update(time, delta) {

    if (this.gameOver) {
        return;
    }
 
    let my = this.my;
    let dt = delta / 1000;
 
    // Moving left
    if (this.left.isDown) {
        if (my.sprite.plane.x > (my.sprite.plane.displayWidth/2)) {
            my.sprite.plane.x -= this.playerSpeed * dt;
        }
    }
 
    // Moving right
    if (this.right.isDown) {
        if (my.sprite.plane.x < (game.config.width - (my.sprite.plane.displayWidth/2))) {
            my.sprite.plane.x += this.playerSpeed * dt;
        }
    }
 
    // Check for bullet being fired
    if (Phaser.Input.Keyboard.JustDown(this.space)) {
        if (my.sprite.bullet.length < this.maxBullets) {
            const pets = ["giraffe", "monkey", "panda", "penguin", "pig", "rabbit", "parrot"];
            const randomPet = pets[Math.floor(Math.random() * pets.length)];
            let bullet = this.add.sprite(
                my.sprite.plane.x, my.sprite.plane.y-(my.sprite.plane.displayHeight/2), randomPet
            );
            bullet.setScale(0.08);
            my.sprite.bullet.push(bullet);
        }
    }
 
    // Remove offscreen bullets
    my.sprite.bullet = my.sprite.bullet.filter((bullet) => bullet.y > -(bullet.displayHeight/2));
 
    // Update enemies
    for (let enemy of my.sprite.enemies) {
        if (enemy.enemyType === "normal") {
            // Normal aliens: move down slowly
            enemy.y += enemy.speed * dt;
            
            // Shoot tears periodically
            enemy.shootTimer += delta;
            if (enemy.shootTimer >= enemy.shootInterval) {
                this.enemyShootTear(enemy);
                enemy.shootTimer = 0;
            }
        } 
        else if (enemy.enemyType === "rushing") {
            // Rushing aliens: wait, then rush at player
            if (!enemy.isRushing) {
                // Move down slowly at first
                enemy.y += 30 * dt;
                
                // Check if time to start rushing
                enemy.rushTimer += delta;
                if (enemy.rushTimer >= enemy.rushDelay) {
                    enemy.isRushing = true;
                    // Calculate angle to player
                    let dx = my.sprite.plane.x - enemy.x;
                    let dy = my.sprite.plane.y - enemy.y;
                    enemy.rushAngle = Math.atan2(dy, dx);
                    enemy.setRotation(enemy.rushAngle + Math.PI/2);
                }
            } else {
                // Rush toward player
                enemy.x += Math.cos(enemy.rushAngle) * enemy.speed * dt;
                enemy.y += Math.sin(enemy.rushAngle) * enemy.speed * dt;
            }
        }
    }
    
    // Update tears
    for (let tear of my.sprite.tears) {
        tear.x += tear.vx * dt;
        tear.y += tear.vy * dt;
    }
    
    // Remove offscreen tears
    my.sprite.tears = my.sprite.tears.filter((tear) => {
        if (tear.y > game.config.height + 50 || tear.y < -50 || 
            tear.x < -50 || tear.x > game.config.width + 50) {
            tear.destroy();
            return false;
        }
        return true;
    });
    
    // Remove offscreen enemies
    my.sprite.enemies = my.sprite.enemies.filter((enemy) => {
        if (enemy.y > game.config.height + 50) {
            enemy.destroy();
            this.enemiesDestroyed++;  // Count as destroyed to prevent wave from stalling
            this.checkWaveComplete();
            return false;
        }
        return true;
    });
 
    // Check for bullet vs enemy collisions
    for (let bullet of my.sprite.bullet) {
        for (let enemy of my.sprite.enemies) {
            if (this.collides(enemy, bullet)) {
                // Hit! Create puff animation
                this.puff = this.add.sprite(enemy.x, enemy.y, "whitePuff03")
                    .setScale(0.25)
                    .play("puff");
                
                // Remove bullet
                bullet.y = -100;
                
                // Update score
                this.myScore += enemy.scorePoints;
                this.updateScore();
                
                // Play sound
                this.sound.play("sfx_hit");
                
                // Remove enemy
                enemy.destroy();
                my.sprite.enemies = my.sprite.enemies.filter(e => e !== enemy);
                
                // Track destroyed count
                this.enemiesDestroyed++;
                this.checkWaveComplete();
                
                break; // Exit inner loop
            }
        }
    }
    
    // Check enemy vs player collisions
    for (let enemy of my.sprite.enemies) {
        if (this.collides(enemy, my.sprite.plane)) {
            // Player hit by enemy!
            this.takeDamage();
            
            // Remove enemy
            enemy.destroy();
            my.sprite.enemies = my.sprite.enemies.filter(e => e !== enemy);
            
            break; // Only one hit per frame
        }
    }
    
    // Check tear vs player collisions
    for (let tear of my.sprite.tears) {
        if (this.collides(tear, my.sprite.plane)) {
            // Player hit by tear!
            this.takeDamage();
            
            // Remove tear
            tear.destroy();
            my.sprite.tears = my.sprite.tears.filter(t => t !== tear);
            
            break; // Only one hit per frame
        }
    }
 
    // Make all bullets move
    for (let bullet of my.sprite.bullet) {
        bullet.y -= this.bulletSpeed * dt;
    }
    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score " + this.myScore);
    }

}