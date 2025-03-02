// jenskh 1234
let me;
let guests;
let shared;

let fixedMinimap
let solarSystem;
let selectedPlanet
let backgroundStarsManager;
let flightImages = [];
let minimapImg = []; // jenskh

let imagesLoaded = 0; // Counter to track loaded images
let totalNumberOfPlanets = 5;
let totalImagesPerPlanet = [145, 151, 75, 251, 125]; // Number of frames for each planet

// Add these variables for debugging and tracking
let totalExpectedImages = 0;
let loadedCounts = [0, 0, 0, 0, 0]; // Track loading progress for each planet
let debugFrameCount = 0;

//let totalImages = 778;
//let totalImages = 854; 
//let totalImages = 145; 
let animationReady = false;

const detailsLevel = {
  showStarSystem: true,
  showPlanet: true,
  showBackroundStarts: true,
  showGameAreaImage: true,
  showStarPlanetImages: true
}

const screenLayout = {
  screenWidth: 2400, // 2400
  screenHeight: 1200, // 1200
  startPlanetIndex: 0,
  diameterPlanet: 3500, //3838,  // 1500/3838 Must be the same as the actual size of the background image found in preload()
  cropWidth: 1200, // 1800
  cropHeight: 700, // 1200
  xGameArea: 600,
  yGameArea: 50,
};

const gameConstants = {
  bulletSpeed: 2,
  //canonTowerShootingInterval: 1000,
  diameterFlight: 100, // can be adjusted
  diameterBullet: 15,
  minimapMarkerDiamter: 10,
  shootingIntervals: {
    'Extreem (0.1s)': 100,
    'Very fast (0.3s)': 300,
    'Fast (0.5s)': 500,
    'Normal (1s)': 1000,
    'Slow (2s)': 2000,
    'Very Slow (3s)': 3000
  }
}
let meHost = false;
let counter = 0
let xText = 0;
let gameObjects = []; // Initialize as empty array
//let canonTowerCount = 5; // Store the previous tower count - Declare here
let batchSize = 50; // Number of images to load per batch
let batchIndex = 0; // Keeps track of which batch is loading
let framesLoaded = 0;

let flights = [];
let activeFlights = [];
const playerColors = ['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'teal', 'lavender', 'maroon', 'olive']

function loadFrames() {
  // Reset counters before loading
  imagesLoaded = 0;
  loadedCounts = [0, 0, 0, 0, 0];
  
  for (let planetIndex = 0; planetIndex < totalNumberOfPlanets; planetIndex++) {
    loadFramesForPlanet(planetIndex);
  }
}

function loadFramesForPlanet(planetIndex) {
  let batchIndex = 0; // Reset batchIndex for each planet
  loadNextBatchForPlanet(planetIndex, batchIndex);
}

function loadNextBatchForPlanet(planetIndex, batchIndex) {
  let totalFrames = totalImagesPerPlanet[planetIndex];
  let start = batchIndex * batchSize;
  let end = Math.min(start + batchSize, totalFrames);

  // Only proceed if we have more frames to load
  if (start < totalFrames) {
    console.log(`Loading frames ${start} to ${end - 1} for planet ${planetIndex}`);

    for (let i = start; i < end; i++) {
      minimapImg[planetIndex][i] = loadImage(
        `images/planet${planetIndex}/minimap/planetA_${i}.png`, 
        () => imageLoaded(planetIndex)
      );
    }

    // Schedule next batch only if there are more frames to load
    if (end < totalFrames) {
      setTimeout(() => loadNextBatchForPlanet(planetIndex, batchIndex + 1), 300);
    }
  }
}

// Track loaded images per planet
function imageLoaded(planetIndex) {
  imagesLoaded++;
  loadedCounts[planetIndex]++;
  
  // Log progress every 20 images
  if (imagesLoaded % 20 === 0) {
    console.log(`Loading progress: ${imagesLoaded}/${totalExpectedImages} images loaded`);
    console.log(`Planet progress: [${loadedCounts.join(', ')}]`);
  }
  
  // Check if all images are loaded
  if (imagesLoaded >= totalExpectedImages) {
    animationReady = true;
    console.log("All images loaded! Starting animation...");
  }
}

function setup() {
  createCanvas(screenLayout.screenWidth, screenLayout.screenHeight);
  
  // Initialize the 2D array for minimapImg
  minimapImg = Array(totalNumberOfPlanets).fill().map(() => []);
  
  // Calculate total expected images
  totalExpectedImages = totalImagesPerPlanet.reduce((sum, count) => sum + count, 0);
  console.log(`Total expected images: ${totalExpectedImages}`);
  
  loadFrames()
/*
  for (let i = 0; i < totalImages; i++) {

        minimapImg[i] = loadImage(`images/planetA/planetAminimap2/planetA_${i}.png`, imageLoaded);
    //    minimapImg[i] = loadImage(`images/planetA/planetAminimap/planetA_${i}.png`, imageLoaded);
      }*/
    
  fixedMinimap = new BasicMinimap(x = 250, y = 250, diameter = 300, color = 'grey', diameterPlanet = screenLayout.diameterPlanet);

  solarSystem = new SolarSystem(xSolarSystemCenter = 1250, ySolarSystemCenter = 900);

  backgroundStarsManager = new BackgroundStarManager(numberOfBackgroundStarts = 300, screenLayout.screenWidth, screenLayout.screenHeight);

  createFlights();

  if (partyIsHost()) {
    meHost = true;
    updateTowerCount();
  }

  if (me.playerName === "observer") {
    joinGame();
    return;
  }
}

function onLocalScreenArea(xLocal, yLocal) {
  return xLocal >= 0 && xLocal <= screenLayout.cropWidth && yLocal >= 0 && yLocal <= screenLayout.cropHeight;
}

function updateTowerCount() {
  gameObjects = generateTowers(shared.canonTowerCount);
  shared.gameObjects = gameObjects.map(tower => ({
    xGlobal: tower.xGlobal,
    yGlobal: tower.yGlobal,
    diameter: tower.diameter,
    color: tower.color,
    bullets: [],
    angle: 0,
    hits: Array(15).fill(0),
    planetIndex: 0,
    lastShotTime: 0,
  }));
}

function generateTowers(count) {
  const towers = [];
  const radius = screenLayout.diameterPlanet / 12; // Distance from center 
  const angleStep = (2 * PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const x = screenLayout.diameterPlanet / 2 + radius * cos(angle);
    const y = screenLayout.diameterPlanet / 2 + radius * sin(angle);

    towers.push(new Canon({
      objectNumber: i,
      objectName: `canon${i}`,
      xGlobal: x,
      yGlobal: y,
      diameter: 60,
      xSpawnGlobal: x,
      ySpawnGlobal: y,
      color: 'red',
    }));
  }
  return towers;
}
//s
function preload() {
  partyConnect("wss://p5js-spaceman-server-29f6636dfb6c.herokuapp.com", "jkv-spaceSV10Lv2");

  shared = partyLoadShared("shared", {
    gameObjects: [],  // Start with empty array
    canonTowerHits: Array(15).fill(0),
    canonTowerCount: 3,
    canonTowerShootingInterval: 1000,
  });
  me = partyLoadMyShared({ playerName: "observer" });
  guests = partyLoadGuestShareds();

  for (let i = 0; i < 13; i++) {
    flightImages[i] = loadImage(`images/flight/flight${i}.png`);
    //    flightImages[i] = loadImage(`images/boss1.png`);
  }
  /*
  for (let i = 0; i < totalImages; i++) {
    minimapImg[i] = loadImage(`images/planetA/planetAminimap2/planetA_${i}.png`, imageLoaded);
    //minimapImg[i] = loadImage(`images/planetA/planetAminimap/planetA_${i}.png`, imageLoaded);
  }*/
 
  /*
  for (let i = 0; i < 778; i++) {

    minimapImg[i] = loadImage(`images/planetA/planetAminimap/planetA_${i}.png`);
  }*/
//    minimapImageA = loadImage(`images/planet0/minimap/planetA_624.png`);
    minimapImageA = loadImage(`images/planet0/planet0minimapWithWarpGate.png`);

    minimapImage = loadImage(`images/planet0/planet0minimapWithWarpGate.png`);
  //  minimapNightImage = loadImage(`images/background/bgMinimapNight.png`);
  //  minimapHotImage = loadImage(`images/background/bgMinimapHot.png`);
  //  backgroundImage = loadImage("images/background/bgLava3500.png");
  //  backgroundImage = loadImage("images/bgLava1500.png");
  //backgroundImage = loadImage("images/planet0/planet0withWarpGate.png"); // Circle 3000
  //  backgroundImage = loadImage("images/planetA/planetAGlowingV1.png");// Circle 3838, Image 4000
  //  backgroundImage = loadImage("images/background/bgLava.png");
  //  backgroundNightImage = loadImage("images/background/bgNight.png");
  //  backgroundHotImage = loadImage("images/background/bgHot.png");

  // Load background images for each planet
  planetBackgroundImages = [];
  planetBackgroundImages[0] = loadImage("images/planet0/planet0withWarpGate.png");
  planetBackgroundImages[1] = loadImage("images/planet1/planet1withWarpGate.png"); // You should replace these with
  planetBackgroundImages[2] = loadImage("images/planet2/planet2withWarpGate.png"); // actual images for each planet
  planetBackgroundImages[3] = loadImage("images/planet3/planet3withWarpGate.png"); // when you have them
  planetBackgroundImages[4] = loadImage("images/planet4/planet4withWarpGate.png");
}

function draw() {

  // Debug loading status every 60 frames
  debugFrameCount++;
  if (debugFrameCount >= 60) {
    debugFrameCount = 0;
    if (!animationReady) {
      console.log(`Still loading: ${imagesLoaded}/${totalExpectedImages} (${Math.floor(imagesLoaded/totalExpectedImages*100)}%)`);
    }
  }
  
  if (!meHost && partyIsHost()) {
    meHost = true;
    updateTowerCount();
  }

  selectedPlanet = solarSystem.planets[me.planetIndex];
  activeFlights = flights.filter(f => f.planetIndex >= 0); // Only target visible flights - changed filter

  // Handle updates
  stepLocal();

  if (partyIsHost()) {
    performHostAction()
  } else {
    receiveNewDataFromHost()
  }

  if (detailsLevel.showBackroundStarts) {
    backgroundStarsManager.move();
  }

  if (me.playerName != "observer") {
    moveMe();
    checkCollisionsWithWarpGate()
    checkCollisions();
  }


  // Draw screen
  background(0);

  if (detailsLevel.showBackroundStarts) {
    backgroundStarsManager.show();
  }

  if (detailsLevel.showStarSystem) {
    push();
    angleMode(DEGREES);

    solarSystem.update();
    solarSystem.draw();
    pop()
    activeFlights.forEach((flight) => {
      if (flight.planetIndex >= 0) {
        selectedPlanet.drawFlight(flight);
      }
    });
  }
  angleMode(RADIANS);

  drawGameArea()

  if (detailsLevel.showPlanet) {
    fixedMinimap.draw();

    activeFlights.forEach((flight) => {
      if (flight.planetIndex >= 0) {
        fixedMinimap.drawObject(flight.xGlobal + flight.xLocal, flight.yGlobal + flight.yLocal, gameConstants.minimapMarkerDiamter, flight.color);
      }
    });
  }
    

  // Draw Canon Towers for all players
  gameObjects.forEach(canon => {
    canon.drawCanonTower();
    canon.drawBullets();
    canon.drawScore();
  });

  let offSetY = 500;
  if (partyIsHost()) {
    fill('gray')
    text("Host", 20, offSetY);
    offSetY += 20
  }
  textSize(18);
  let numberOfBullets = 0;
  let numberOfVisualBullets = 0;

  // Count visible bullets from flights
  activeFlights.forEach((flight) => {
    if (flight.planetIndex >= 0) {
      flight.drawScore(offSetY);
      offSetY += 20;
      numberOfBullets += flight.bullets.length;
      // Count visible bullets
      flight.bullets.forEach(bullet => {
        let xLocal = bullet.xLocal - (me.xGlobal - bullet.xGlobal);
        let yLocal = bullet.yLocal - (me.yGlobal - bullet.yGlobal);
        if (onLocalScreenArea(xLocal, yLocal)) {
          numberOfVisualBullets++;
        }
      });
    }
  });

  // Count visible bullets from canons
  gameObjects.forEach(canon => {
    numberOfBullets += canon.bullets.length;
    // Count visible bullets
    canon.bullets.forEach(bullet => {
      let xLocal = bullet.xGlobal - me.xGlobal;
      let yLocal = bullet.yGlobal - me.yGlobal;
      if (onLocalScreenArea(xLocal, yLocal)) {
        numberOfVisualBullets++;
      }
    });
  });

  fill('gray');
  text("Total number of bullets: " + numberOfBullets, 20, offSetY);
  offSetY += 20;
  text("Number of visible bullets: " + numberOfVisualBullets, 20, offSetY);
  offSetY += 40;
  text("Performance controls:", 20, offSetY);
  offSetY += 20;
  text("Key p: show star system ", 20, offSetY);
  offSetY += 20;
  text("Key o: show detailed minimap ", 20, offSetY);
  offSetY += 20;
  text("Key i: show background starts ", 20, offSetY);
  offSetY += 20;
  text("Key m: Expand game area right ", 20, offSetY);
  offSetY += 20;
  text("Key n: Expand game area down ", 20, offSetY);
  offSetY += 20;
  if (partyIsHost()) {
    text("Key 9, 8, 7, 6: NoOfCanons 18, 9, 3, 0 ", 20, offSetY);
    offSetY += 20;
    text("Key l, k, j: Shooting interval 500, 1000, 2000", 20, offSetY);
    offSetY += 20;
  }
}

function keyPressed() {

  if (keyCode === 49) { // 1
    me.planetIndex = 0;
   // me.xGlobal = star
  } else if (keyCode === 50) { // 2
    me.planetIndex = 1;
  } else if (keyCode === 51) { // 3
    me.planetIndex = 2;
  } else if (keyCode === 52) { // 4
    me.planetIndex = 3;
  } else if (keyCode === 53) { // 5
    me.planetIndex = 4;
  }

  if (keyCode === 80) { // p 
    detailsLevel.showStarSystem = !detailsLevel.showStarSystem;
  }
  if (keyCode === 79) { // o
    detailsLevel.showPlanet = !detailsLevel.showPlanet;
  }
  if (keyCode === 73) { // i
    detailsLevel.showBackroundStarts = !detailsLevel.showBackroundStarts;
  }
  if (keyCode === 85) { // u
    detailsLevel.showGameAreaImage = !detailsLevel.showGameAreaImage;
  }
  if (keyCode === 89) { // y
    detailsLevel.showStarPlanetImages = !detailsLevel.showStarPlanetImages;
  }
  if (partyIsHost() && keyCode === 57) { // 9
    shared.canonTowerCount = 18;
    updateTowerCount();
  }
  if (partyIsHost() && keyCode === 56) { // 8
    shared.canonTowerCount = 9;
    updateTowerCount();
  }
  if (partyIsHost() && keyCode === 55) { // 7
    shared.canonTowerCount = 3;
    updateTowerCount();
  }
  if (partyIsHost() && keyCode === 54) { // 6
    shared.canonTowerCount = 0;
    updateTowerCount();
  }
  if (partyIsHost() && keyCode === 76) { // l
    shared.canonTowerShootingInterval = 500;
  }
  if (partyIsHost() && keyCode === 75) { // k
    shared.canonTowerShootingInterval = 1000;
  }
  if (partyIsHost() && keyCode === 74) { // j
    shared.canonTowerShootingInterval = 2000;
  }
  if (keyCode === 77) { // m
    if (screenLayout.cropWidth === 1200) {
      screenLayout.cropWidth = 1600;
    } else {
      screenLayout.cropWidth = 1200;
    }
  }
  if (keyCode === 78) { // n
    if (screenLayout.cropHeight === 700) {
      screenLayout.cropHeight = 1100;
      showStarSystem = false
    } else {
      screenLayout.cropHeight = 700;
      showStarSystem = true
    }
  }
}

function performHostAction() {
  gameObjects.forEach((canon, index) => {

    canon.move();

    const currentTime = millis();
    //        const selectedInterval = gameConstants.shootingIntervals[shootingIntervalSelect.value()];
    const selectedInterval = shared.canonTowerShootingInterval;
    // Check if selectedInterval is a valid number
    if (typeof selectedInterval === 'number') {
      if (currentTime - canon.lastShotTime > selectedInterval) {
        if (activeFlights.length > 0) {
          const nearestFlight = canon.findNearestFlight();

          if (nearestFlight) {
            canon.shoot(nearestFlight);
            canon.lastShotTime = currentTime;
          }
        }
      }
    } else {
      console.warn("Invalid shooting interval:", shootingIntervalSelect.value());
    }

    canon.moveBullets(); // Move bullets before drawing
    canon.checkCollisionsWithFlights();  // Add this line

    // Sync to shared state
    shared.gameObjects[index] = {
      ...shared.gameObjects[index],
      xGlobal: canon.xGlobal,
      yGlobal: canon.yGlobal,
      //          buls: JSON.parse(JSON.stringify(canon.buls)), // Deep copy
      bullets: canon.bullets, // Deep copyfhg
      angle: canon.angle,
      lastShotTime: canon.lastShotTime,
      hits: canon.hits, // Update shared state to include hits
    };
  });

  // Calculate total hits from canon towers for each player
  let totalCanonHits = Array(15).fill(0);
  gameObjects.forEach(canon => {
    for (let i = 0; i < totalCanonHits.length; i++) {
      totalCanonHits[i] += canon.hits[i];
    }
  });
  shared.canonTowerHits = totalCanonHits;
}

function receiveNewDataFromHost() {

  // Ensure client has same number of towers as host
  while (gameObjects.length < shared.gameObjects.length) {
    const i = gameObjects.length;
    gameObjects.push(new Canon({
      objectNumber: i,
      objectName: `canon${i}`,
      xGlobal: shared.gameObjects[i].xGlobal,
      yGlobal: shared.gameObjects[i].yGlobal,
      diamter: 60,
      color: 'grey',
      xSpawnGlobal: shared.gameObjects[i].xSpawnGlobal,
      ySpawnGlobal: shared.gameObjects[i].ySpawnGlobal
    }));
  }
  // Remove extra towers if host has fewer
  while (gameObjects.length > shared.gameObjects.length) {
    gameObjects.pop();
  }
  // Update existing towers
  gameObjects.forEach((canon, index) => {
    canon.diameter = shared.gameObjects[index].diameter;
    canon.color = shared.gameObjects[index].color;

    canon.xGlobal = shared.gameObjects[index].xGlobal;
    canon.yGlobal = shared.gameObjects[index].yGlobal;
    canon.bullets = shared.gameObjects[index].bullets;
    canon.angle = shared.gameObjects[index].angle;
    canon.lastShotTime = shared.gameObjects[index].lastShotTime; // Sync lastShotTime
    canon.hits = shared.gameObjects[index].hits || Array(15).fill(0);
  });
}

function drawGameArea() {
  if (detailsLevel.showGameAreaImage) {
    let cropX = me.xGlobal;
    let cropY = me.yGlobal;
    
    // Use the planet background image that corresponds to the current planet index
    let currentBackgroundImage = planetBackgroundImages[me.planetIndex];
    
    // Scale the background image to match planet size
    image(currentBackgroundImage,
      screenLayout.xGameArea,
      screenLayout.yGameArea,
      screenLayout.cropWidth,
      screenLayout.cropHeight,
      cropX,
      cropY,
      screenLayout.cropWidth,
      screenLayout.cropHeight
    );
    
    // Draw the warp gates on top of the background
    drawWarpGatesOnGameArea();
  } else {
    // ...existing non-image mode code...
    fill('grey')
    circle(screenLayout.xGameArea - me.xGlobal + selectedPlanet.diameterPlanet / 2, screenLayout.yGameArea - me.yGlobal + selectedPlanet.diameterPlanet / 2, selectedPlanet.diameterPlanet);
    fill('black')
    rect(0, 0, screenLayout.xGameArea, screenLayout.screenHeight);
    rect(screenLayout.xGameArea + screenLayout.cropWidth, 0, screenLayout.screenWidth, screenLayout.screenHeight);
    rect(0, screenLayout.yGameArea + screenLayout.cropHeight, screenLayout.screenWidth, screenLayout.screenWidth);
    
    // Also draw warp gates in non-image mode
    drawWarpGatesOnGameArea();
  }
  
  // Draw flights and bullets on top
  activeFlights.forEach((flight) => {
    if (flight.planetIndex >= 0) {
      flight.drawFlight();
      flight.drawBullets()
    }
  });
}

// Draw warp gates on the game area
function drawWarpGatesOnGameArea() {
  const gates = warpGates[me.planetIndex];
  
  // Draw up gate (cyan)
  let upGateX = screenLayout.xGameArea + (gates.up.x - me.xGlobal);
  let upGateY = screenLayout.yGameArea + (gates.up.y - me.yGlobal);
  
  if (onLocalScreenArea(gates.up.x - me.xGlobal, gates.up.y - me.yGlobal)) {
    push();
    fill('cyan');
    stroke('white');
    strokeWeight(2);
    circle(upGateX, upGateY, gates.up.radius * 2);
    
    // Draw arrow indicator
    fill('white');
    noStroke();
    triangle(
      upGateX, upGateY - gates.up.radius/2,
      upGateX - 10, upGateY - gates.up.radius/2 + 15,
      upGateX + 10, upGateY - gates.up.radius/2 + 15
    );
    
    // Text indicating next planet
    let nextPlanet = me.planetIndex === 4 ? 0 : me.planetIndex + 1;
    textAlign(CENTER);
    text("To Planet " + nextPlanet, upGateX, upGateY + 5);
    pop();
  }
  
  // Draw down gate (magenta)
  let downGateX = screenLayout.xGameArea + (gates.down.x - me.xGlobal);
  let downGateY = screenLayout.yGameArea + (gates.down.y - me.yGlobal);
  
  if (onLocalScreenArea(gates.down.x - me.xGlobal, gates.down.y - me.yGlobal)) {
    push();
    fill('magenta');
    stroke('white');
    strokeWeight(2);
    circle(downGateX, downGateY, gates.down.radius * 2);
    
    // Draw arrow indicator
    fill('white');
    noStroke();
    triangle(
      downGateX, downGateY + gates.down.radius/2,
      downGateX - 10, downGateY + gates.down.radius/2 - 15,
      downGateX + 10, downGateY + gates.down.radius/2 - 15
    );
    
    // Text indicating previous planet
    let prevPlanet = me.planetIndex === 0 ? 4 : me.planetIndex - 1;
    textAlign(CENTER);
    text("To Planet " + prevPlanet, downGateX, downGateY - 5);
    pop();
  }
  
  textAlign(LEFT);
}

// Add warp gate coordinates for each planet - already defined, just need to ensure they're correctly set
const warpGates = [
  // Planet 0
  { 
    up: { x: 1500, y: 500, radius: 75 },    // Warp to planet 1
    down: { x: 1500, y: 2500, radius: 75 }  // Warp to planet 4
  },
  // Planet 1
  { 
    up: { x: 1700, y: 600, radius: 75 },    // Warp to planet 2
    down: { x: 1300, y: 2400, radius: 75 }  // Warp to planet 0
  },
  // Planet 2
  { 
    up: { x: 1600, y: 700, radius: 75 },    // Warp to planet 3
    down: { x: 1400, y: 2300, radius: 75 }  // Warp to planet 1
  },
  // Planet 3
  { 
    up: { x: 1500, y: 800, radius: 75 },    // Warp to planet 4
    down: { x: 1500, y: 2200, radius: 75 }  // Warp to planet 2
  },
  // Planet 4
  { 
    up: { x: 1400, y: 900, radius: 75 },    // Warp to planet 0
    down: { x: 1600, y: 2100, radius: 75 }  // Warp to planet 3
  }
];

function moveMe() {

  // Local movement (game area)
  let localOffX = 0;
  let localOffY = 0;
  const localSpeed = 3;
  if (keyIsDown(70)) { localOffX = -localSpeed } // F
  if (keyIsDown(72)) { localOffX = localSpeed }  // H
  if (keyIsDown(84)) { localOffY = -localSpeed } // T
  if (keyIsDown(71)) { localOffY = localSpeed }  // G

  // Global movement (planet)
  const globalSpeed = 6;
  let gOffX = 0, gOffY = 0;
  if (keyIsDown(65)) { gOffX = -globalSpeed } // A
  if (keyIsDown(68)) { gOffX = globalSpeed }  // D
  if (keyIsDown(87)) { gOffY = -globalSpeed } // W
  if (keyIsDown(83)) { gOffY = globalSpeed }  // S

  let xTemp = me.xLocal + localOffX;
  let yTemp = me.yLocal + localOffY;
  let newxGlobal = me.xGlobal + gOffX;
  let newyGlobal = me.yGlobal + gOffY;

  // Keep local position within screen bounds
  xTemp = constrain(xTemp, 0, screenLayout.cropWidth);
  yTemp = constrain(yTemp, 0, screenLayout.cropHeight);

  // Keep global position within planet bounds
  newxGlobal = constrain(newxGlobal, 0, selectedPlanet.diameterPlanet);
  newyGlobal = constrain(newyGlobal, 0, selectedPlanet.diameterPlanet);

  if (selectedPlanet.onPlanet(xTemp + newxGlobal, yTemp + newyGlobal)) {
    me.xGlobal = newxGlobal;
    me.yGlobal = newyGlobal;
    me.xLocal = xTemp;
    me.yLocal = yTemp;
  }
  /*
    if (planet.isOnPlanet(xTemp + newxGlobal, yTemp + newyGlobal)) {
      me.xGlobal = newxGlobal;
      me.yGlobal = newyGlobal;
      me.xLocal = xTemp;
      me.yLocal = yTemp;
    }
      */

  me.xMouse = mouseX - screenLayout.xGameArea;
  me.yMouse = mouseY - screenLayout.yGameArea;


  for (let i = me.bullets.length - 1; i >= 0; i--) {
    let bullet = me.bullets[i];
    let bulletVector = createVector(
      int(bullet.xMouseStart) - bullet.xStart,
      int(bullet.yMouseStart) - bullet.yStart,
    ).normalize();
    bullet.xLocal += bulletVector.x * parseInt(gameConstants.bulletSpeed);
    bullet.yLocal += bulletVector.y * parseInt(gameConstants.bulletSpeed);

    // Update global coordinates
    bullet.xGlobal += bulletVector.x * parseInt(gameConstants.bulletSpeed);
    bullet.yGlobal += bulletVector.y * parseInt(gameConstants.bulletSpeed);

    let xLocalTemp = bullet.xLocal - (me.xGlobal - bullet.xGlobal);
    let yLocalTemp = bullet.yLocal - (me.yGlobal - bullet.yGlobal);

    // Remove bullet if it's not on the screen seen from the flight shooting it
    if (!selectedPlanet.onPlanet(bullet.xLocal + bullet.xGlobal, bullet.yLocal + bullet.yGlobal)

      || !onLocalScreenArea(xLocalTemp, yLocalTemp)) {
      me.bullets.splice(i, 1);
    }
  }

  // Check for warp gates
  checkForWarpGateCollision();
}

// Function to check and handle warp gate collisions
function checkForWarpGateCollision() {
  const currentPlanet = me.planetIndex;
  const gates = warpGates[currentPlanet];
  
  // Distance to up gate
  const distToUpGate = dist(me.xGlobal, me.yGlobal, gates.up.x, gates.up.y);
  if (distToUpGate < gates.up.radius) {
    // Warp up to next planet (special case for last planet)
    const nextPlanet = currentPlanet === 4 ? 0 : currentPlanet + 1;
    console.log(`Warping from planet ${currentPlanet} to planet ${nextPlanet}`);
    me.planetIndex = nextPlanet;
    
    // Position player at the bottom gate of the new planet
    const newGates = warpGates[nextPlanet];
    me.xGlobal = newGates.down.x;
    me.yGlobal = newGates.down.y - newGates.down.radius * 2; // Position above the down gate
    
    return; // Exit to prevent checking both gates
  }
  
  // Distance to down gate
  const distToDownGate = dist(me.xGlobal, me.yGlobal, gates.down.x, gates.down.y);
  if (distToDownGate < gates.down.radius) {
    // Warp down to previous planet (special case for first planet)
    const prevPlanet = currentPlanet === 0 ? 4 : currentPlanet - 1;
    console.log(`Warping from planet ${currentPlanet} to planet ${prevPlanet}`);
    me.planetIndex = prevPlanet;
    
    // Position player at the top gate of the new planet
    const newGates = warpGates[prevPlanet];
    me.xGlobal = newGates.up.x;
    me.yGlobal = newGates.up.y + newGates.up.radius * 2; // Position below the up gate
  }
}

function checkCollisions() {

  activeFlights.forEach((flight) => {
    if (flight.playerName != me.playerName) {
      checkCollisionsWithFlight(flight);
    }
  });
}

function checkCollisionsWithFlight(flight) {
  for (let i = me.bullets.length - 1; i >= 0; i--) {
    let bullet = me.bullets[i];

    // Calculate bullet's position relative to the flight
    let bulletPosX = bullet.xLocal - (me.xGlobal - bullet.xGlobal);
    let bulletPosY = bullet.yLocal - (me.yGlobal - bullet.yGlobal);

    // Calculate flight's position relative to the bullet
    let flightPosX = flight.xLocal - (me.xGlobal - flight.xGlobal);
    let flightPosY = flight.yLocal - (me.yGlobal - flight.yGlobal);

    let d = dist(flightPosX, flightPosY, bulletPosX, bulletPosY);

    if (d < (flight.diameter + gameConstants.diameterBullet) / 2) {
      me.hits[flight.playerNumber]++;
      me.bullets.splice(i, 1);
    }
  }
}

function checkCollisionsWithWarpGate() {

//  console.log({selectedPlanet})
  let di = dist(me.xGlobal + me.xLocal, me.yGlobal + me.yLocal, selectedPlanet.xWarpGateUp, selectedPlanet.yWarpGateUp);

  if (di < selectedPlanet.diameterWarpGate / 2) {
    if (me.planetIndex === 4) {
      me.planetIndex = 0;
    } else {
      me.planetIndex++;
    }
     console.log("Warping up")

     return;
  } 
  di = dist(me.xGlobal + me.xLocal, me.yGlobal + me.yLocal, selectedPlanet.xWarpGateDown, selectedPlanet.yWarpGateDown);

  if (di < selectedPlanet.diameterWarpGate / 2) {
    if (me.planetIndex === 0) {
      me.planetIndex = 4;
    } else {
      me.planetIndex--;
    }
     console.log("Warping down")  
     return;
  } 
}

function stepLocal() {

  flights.forEach(flight => {
    const guest = guests.find((p) => p.playerName === flight.playerName);
    if (guest) {
      flight.syncFromShared(guest);
    } else {
      flight.planetIndex = -1;
    }
  });

}

function mousePressed() {

  if (me.playerName === "observer" || me.bullets.length > 5)
    return

  let bullet = {
    xLocal: me.xLocal,
    yLocal: me.yLocal,
    xStart: me.xLocal,
    yStart: me.yLocal,
    xMouseStart: me.xMouse,
    yMouseStart: me.yMouse,
    xGlobal: me.xGlobal,
    yGlobal: me.yGlobal,
  };
  me.bullets.push(bullet);
}


function createFlights() {
  for (let i = 0; i < 2; i++) {
    flights.push(new Flight({
      playerNumber: i,
      playerName: "player" + i,
      teamNumber: 0,
      xLocal: screenLayout.cropWidth / 2 + 100,
      yLocal: screenLayout.cropHeight / 2,
      xGlobal: screenLayout.diameterPlanet / 2 - screenLayout.cropWidth / 2 + 400,
      yGlobal: screenLayout.diameterPlanet / 2 - screenLayout.cropHeight / 2,
      diameter: gameConstants.diameterFlight,
      xMouse: 0,
      yMouse: 0,
      color: playerColors[i % playerColors.length],
      bullets: [],
      hits: Array(15).fill(0),
      planetIndex: -1,
    }));
  }
}

function joinGame() {

  // don't let current players double join
  if (me.playerName.startsWith("player")) return;

  for (let flight of flights) {
    if (!guests.find((p) => p.playerName === flight.playerName)) {
      spawn(flight);
      return;
    }
  }
}

function watchGame() {
  me.playerName = "observer";
}

function spawn(flight) {
  me.playerNumber = flight.playerNumber;
  me.playerName = flight.playerName;
  me.xLocal = flight.xLocal;
  me.yLocal = flight.yLocal;
  me.xGlobal = flight.xGlobal;
  me.yGlobal = flight.yGlobal;
  me.diameter = flight.diameter;
  me.color = flight.color;
  me.bullets = [];
  me.hits = Array(15).fill(0)
  me.planetIndex = screenLayout.startPlanetIndex;
}