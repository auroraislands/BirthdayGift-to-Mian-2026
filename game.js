(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const shell = $("#game-shell");
  const cover = $("#cover");
  const enterButton = $("#enter-button");
  const walkHint = $("#walk-hint");
  const dialogueBox = $("#dialogue");
  const dialogueText = $("#dialogue-text");
  const memoryGallery = $("#memory-gallery");
  const galleryImage = $("#gallery-image");
  const galleryVideo = $("#gallery-video");
  const galleryCaption = $("#gallery-caption");
  const galleryPrev = $("#gallery-prev");
  const galleryNext = $("#gallery-next");
  const galleryClose = $("#gallery-close");
  const galleryDots = $("#gallery-dots");
  const birthdayReveal = $("#birthday-reveal");
  const endingMenu = $("#ending-menu");
  const audioToggle = $("#audio-toggle");
  const audioPanel = $("#audio-panel");
  const musicToggle = $("#music-toggle");
  const ambientToggle = $("#ambient-toggle");
  const bgm = $("#bgm");
  const forestAudio = $("#forest-audio");

  const WORLD_WIDTH = 6400;
  const PROP_SIZE = {
    sign: { halfWidth: 78, halfHeight: 116 },
    postcard: { halfWidth: 76, halfHeight: 88 },
    flowers: { halfWidth: 92, halfHeight: 112 },
    bench: { halfWidth: 142, halfHeight: 104 },
    rabbit: { halfWidth: 88, halfHeight: 118 },
    lantern: { halfWidth: 76, halfHeight: 144 },
  };
  const GameState = { mode: "cover", pendingInteraction: null, started: false, endingPlayed: false };

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  const sprites = {
    friend: loadImage("assets/characters/friend.png"),
    creator: loadImage("assets/characters/creator.png"),
    forestBack: loadImage("assets/forest/back.png"),
    forestMiddle: loadImage("assets/forest/middle.png"),
    pathTile: loadImage("assets/forest/path-tile.png"),
    earthTile: loadImage("assets/forest/earth-tile.png"),
    sign: loadImage("assets/props/sign.png"),
    bench: loadImage("assets/props/bench.png"),
    lantern: loadImage("assets/props/lantern.png"),
    rabbit: loadImage("assets/props/rabbit-sheet.png"),
    morningGlory: loadImage("assets/props/morning-glory.png"),
    caladium: loadImage("assets/props/caladium.png"),
  };

  // 之后只需替换这些图片路径，不需要改画廊逻辑。
  const gallerySets = {
    postcard: [
      { src: "assets/gallery/postcard-01.png", caption: "每年的信，分享不完的日常 · 01" },
      { src: "assets/gallery/postcard-02.png", caption: "精妙绝伦的画（痴） · 02" },
      { src: "assets/gallery/postcard-03.png", caption: "好多好多特别的礼物 · 03" },
      { src: "assets/gallery/postcard-04.png", caption: "夜眠99 · 04" },
    ],
    lantern: [{ type: "video", src: "assets/gallery/lantern.mp4", caption: "被小灯照亮的一页" }],
  };

  const player = { x: 380, targetX: 380, direction: 1, speed: 178, sitting: false };
  let width = innerWidth;
  let height = innerHeight;
  let dpr = 1;
  let groundY = height * 0.79;
  let cameraX = 0;
  let targetCameraX = 0;
  let lastTime = performance.now();
  let pointer = { x: -999, y: -999 };
  let hoveredMemory = null;
  let firstMoveMade = false;
  let rabbitReacted = false;
  let rabbitReactionStart = 0;
  let lanternLit = false;
  let finalBrightness = 0;
  const clickRings = [];

  const memories = [
    { id: "sign", x: 790, type: "sign", interactionDistance: 118, visited: false, dialogue: ["木牌上写着一行小字。", "“沿着这条路走吧。”", "“也许会遇见一些被好好保存下来的回忆。”"] },
    { id: "postcard", x: 1510, type: "postcard", interactionDistance: 124, visited: false, dialogue: ["草地上放着几张明信片。", "想起那些只能靠明信片互相分享的日子，\n连时间都好像慢了下来，\n反复回味明信片还能窥见当时的稚嫩与天真。", "还有当时聊不完的各种动漫，\n自己动手做的oc故事，\n现在还在坑的APH、罗小黑和各自玩的游戏。", "即使已经记不得具体剧情和人物，\n却仍然能感受到当年大聊特聊的快乐。"] },
    { id: "flowers", x: 2360, type: "flowers", interactionDistance: 130, visited: false, dialogue: ["路边开着牵牛花，\n旁边长着一簇彩叶芋。", "还记得被科普的牵牛花类型，彩叶芋的价值，\n还有花花们在相机里被记录的一生。", "但他们和我们一样，\n一直在安静认真地生长。"] },
    { id: "bench", x: 3260, type: "bench", interactionDistance: 165, visited: false, dialogue: ["林间放着一张长椅。", "想起那些一起旅行、说话、发呆，\n或者只是安静待着的时刻。", "原来有些回忆不需要多热闹，\n也会让人记很久。"] },
    { id: "rabbit", x: 4180, type: "rabbit", interactionDistance: 138, visited: false, dialogue: ["草丛里藏着一只灰色的兔子，毛茸茸的。", "它好像在这里等了很久。", "你靠近的时候，它没有跑。", "只是轻轻动了动耳朵。"] },
    { id: "lantern", x: 5040, type: "lantern", interactionDistance: 130, visited: false, dialogue: ["前面亮着一盏小灯。", "今年收集素材的时候，找到了这个手书，\n当时真的是超级感动！！（对于这样的手书谁能不心动呢！！）", "当时以一个渣渣水准做了pv剪辑，\n现在看来剪辑水平也是非常之粗糙简陋（乐）", "时隔多年再回看真的是有很多感慨，\n感慨我们成长之快，感慨当时天真与无措", "也感慨我们现在还能有机会一起回顾这些时光，\n然后相视一笑"] },
  ];

  const countedMemories = memories.filter((memory) => memory.id !== "sign");
  const fireflies = Array.from({ length: 22 }, (_, index) => ({ x: 240 + (index * 347) % (WORLD_WIDTH - 400), y: 120 + (index * 83) % 410, phase: index * 0.73, radius: index % 3 === 0 ? 2 : 1.3 }));
  const leaves = Array.from({ length: 8 }, (_, index) => ({ x: 500 + index * 760, speed: 7 + (index % 4) * 2, phase: index * 1.7 }));

  class DialogueManager {
    constructor() {
      this.lines = [];
      this.index = 0;
      this.charIndex = 0;
      this.timer = 0;
      this.typing = false;
      this.onComplete = null;
      dialogueBox.addEventListener("pointerdown", (event) => { event.stopPropagation(); this.advance(); });
    }
    start(lines, onComplete) {
      this.lines = lines;
      this.index = 0;
      this.onComplete = onComplete || null;
      GameState.mode = "dialogue";
      dialogueBox.hidden = false;
      this.typeCurrent();
    }
    typeCurrent() {
      clearInterval(this.timer);
      const line = this.lines[this.index];
      this.charIndex = 0;
      this.typing = true;
      dialogueText.textContent = "";
      this.timer = setInterval(() => {
        this.charIndex += 1;
        dialogueText.textContent = line.slice(0, this.charIndex);
        if (this.charIndex >= line.length) { clearInterval(this.timer); this.typing = false; }
      }, 42);
    }
    advance() {
      if (this.typing) {
        clearInterval(this.timer);
        dialogueText.textContent = this.lines[this.index];
        this.typing = false;
        return;
      }
      if (this.index < this.lines.length - 1) { this.index += 1; this.typeCurrent(); return; }
      this.close();
      const done = this.onComplete;
      this.onComplete = null;
      if (done) done();
    }
    close() { clearInterval(this.timer); dialogueBox.hidden = true; this.typing = false; }
  }
  const dialogue = new DialogueManager();

  class GalleryManager {
    constructor() {
      this.items = [];
      this.index = 0;
      this.onClose = null;
      this.resumeBgmAfterVideo = false;
      galleryPrev.addEventListener("click", (event) => { event.stopPropagation(); this.step(-1); });
      galleryNext.addEventListener("click", (event) => { event.stopPropagation(); this.step(1); });
      galleryClose.addEventListener("click", (event) => { event.stopPropagation(); this.close(); });
      memoryGallery.addEventListener("pointerdown", (event) => { if (event.target === memoryGallery) this.close(); });
      galleryVideo.addEventListener("play", () => {
        if (!bgm.paused) {
          this.resumeBgmAfterVideo = true;
          bgm.pause();
        }
      });
      galleryVideo.addEventListener("pause", () => this.restoreBgm());
      galleryVideo.addEventListener("ended", () => this.restoreBgm());
      addEventListener("keydown", (event) => {
        if (memoryGallery.hidden) return;
        if (event.key === "Escape") this.close();
        if (event.key === "ArrowLeft") this.step(-1);
        if (event.key === "ArrowRight") this.step(1);
      });
    }
    open(items, onClose) {
      this.items = items;
      this.index = 0;
      this.onClose = onClose || null;
      GameState.mode = "interacting";
      memoryGallery.hidden = false;
      this.render();
      galleryClose.focus();
    }
    step(direction) {
      if (this.items.length < 2) return;
      this.index = (this.index + direction + this.items.length) % this.items.length;
      this.render();
    }
    render() {
      const item = this.items[this.index];
      const isVideo = item.type === "video";
      if (isVideo) {
        galleryImage.hidden = true;
        galleryVideo.hidden = false;
        galleryVideo.src = item.src;
        galleryVideo.setAttribute("aria-label", item.caption);
        galleryVideo.load();
      } else {
        this.stopVideo();
        galleryVideo.hidden = true;
        galleryImage.hidden = false;
        galleryImage.src = item.src;
        galleryImage.alt = item.caption;
      }
      galleryCaption.textContent = item.caption;
      const hasSeveral = this.items.length > 1;
      galleryPrev.hidden = !hasSeveral;
      galleryNext.hidden = !hasSeveral;
      galleryDots.replaceChildren();
      this.items.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = index === this.index ? "active" : "";
        dot.setAttribute("aria-label", `第 ${index + 1} 张`);
        dot.addEventListener("click", () => { this.index = index; this.render(); });
        galleryDots.append(dot);
      });
    }
    restoreBgm() {
      if (!this.resumeBgmAfterVideo) return;
      this.resumeBgmAfterVideo = false;
      if (GameState.started) bgm.play().catch(() => {});
    }
    stopVideo() {
      if (!galleryVideo.paused) galleryVideo.pause();
      galleryVideo.removeAttribute("src");
      galleryVideo.load();
      this.restoreBgm();
    }
    close() {
      if (memoryGallery.hidden) return;
      this.stopVideo();
      memoryGallery.hidden = true;
      const done = this.onClose;
      this.onClose = null;
      if (done) done(); else GameState.mode = "idle";
    }
  }
  const gallery = new GalleryManager();

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function mix(a, b, amount) { return Math.round(a + (b - a) * amount); }
  function mixedColor(from, to, amount, alpha = 1) { return `rgba(${mix(from[0], to[0], amount)}, ${mix(from[1], to[1], amount)}, ${mix(from[2], to[2], amount)}, ${alpha})`; }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
  function imageReady(image) { return image.complete && image.naturalWidth > 0; }

  function resize() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    groundY = height * (height < 600 ? 0.82 : 0.79);
    cameraX = clamp(cameraX, 0, Math.max(0, WORLD_WIDTH - width));
  }

  function drawSky(progress) {
    const warmth = clamp(progress * 0.65 + finalBrightness * 0.35, 0, 1);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, mixedColor([5, 24, 35], [25, 37, 48], warmth));
    gradient.addColorStop(0.63, mixedColor([11, 46, 51], [58, 68, 60], warmth));
    gradient.addColorStop(1, mixedColor([19, 50, 43], [94, 81, 51], warmth));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const moonX = 5560 - cameraX * 0.045;
    const moonY = Math.max(70, height * 0.11);
    if (moonX > -100 && moonX < width + 100) {
      ctx.save(); ctx.shadowColor = "rgba(241,239,193,.48)"; ctx.shadowBlur = 30;
      rect(moonX - 22, moonY - 30, 44, 60, "#e8e5bd"); rect(moonX - 30, moonY - 22, 60, 44, "#e8e5bd"); ctx.restore();
    }
    for (let i = 0; i < 36; i += 1) {
      const x = ((i * 211 - cameraX * 0.045) % (width + 360) + width + 360) % (width + 360) - 180;
      const y = 40 + (i * 67) % Math.max(90, height * 0.34);
      rect(x, y, 2, 2, `rgba(228,232,188,${0.15 + (i % 3) * 0.08})`);
    }
  }

  function drawTiledLayer(image, parallax, scale, bottom, alpha = 1) {
    if (!imageReady(image)) return;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offset = -((cameraX * parallax) % drawWidth);
    ctx.save(); ctx.globalAlpha = alpha;
    for (let x = offset - drawWidth; x < width + drawWidth; x += drawWidth) ctx.drawImage(image, Math.floor(x), Math.floor(bottom - drawHeight), Math.ceil(drawWidth), Math.ceil(drawHeight));
    ctx.restore();
  }

  function drawForestLayers(progress) {
    const scale = clamp(height / 250, 2.7, 4.45);
    drawTiledLayer(sprites.forestBack, 0.1, scale, groundY + 115, 0.96);
    ctx.fillStyle = `rgba(5,27,29,${0.36 - progress * 0.12})`;
    ctx.fillRect(0, 0, width, groundY + 80);
    drawTiledLayer(sprites.forestMiddle, 0.34, scale, groundY + 112, 0.93);
  }

  function drawGround(progress) {
    rect(0, groundY - 42, width, height - groundY + 42, mixedColor([19, 44, 34], [56, 59, 37], progress * 0.62));
    if (imageReady(sprites.pathTile)) {
      const scale = 3.2;
      const tileWidth = sprites.pathTile.naturalWidth * scale;
      const tileHeight = sprites.pathTile.naturalHeight * scale;
      const offset = -(cameraX % tileWidth);
      ctx.save(); ctx.globalAlpha = 0.82;
      for (let x = offset - tileWidth; x < width + tileWidth; x += tileWidth) ctx.drawImage(sprites.pathTile, Math.floor(x), Math.floor(groundY - 66), Math.ceil(tileWidth), Math.ceil(tileHeight));
      ctx.restore();
    }
    if (imageReady(sprites.earthTile)) {
      const scale = 3.2;
      const tileWidth = sprites.earthTile.naturalWidth * scale;
      const tileHeight = sprites.earthTile.naturalHeight * scale;
      const offset = -((cameraX * 0.94) % tileWidth);
      for (let row = 0, y = groundY + 10; y < height + tileHeight; row += 1, y += tileHeight) {
        const stagger = row % 2 ? tileWidth * 0.5 : 0;
        for (let x = offset - tileWidth - stagger; x < width + tileWidth; x += tileWidth) {
          ctx.drawImage(sprites.earthTile, Math.floor(x), Math.floor(y), Math.ceil(tileWidth), Math.ceil(tileHeight));
        }
      }
    }
    const earthDepth = ctx.createLinearGradient(0, groundY + 22, 0, height);
    earthDepth.addColorStop(0, "rgba(5,22,20,0)"); earthDepth.addColorStop(1, "rgba(5,22,20,.56)");
    ctx.fillStyle = earthDepth; ctx.fillRect(0, groundY + 22, width, height - groundY);
  }

  function hitBox(memory) { return PROP_SIZE[memory.type] || { halfWidth: 74, halfHeight: 105 }; }
  function drawImageBottom(image, centerX, bottomY, targetWidth, flip = false) {
    if (!imageReady(image)) return;
    const targetHeight = targetWidth * image.naturalHeight / image.naturalWidth;
    ctx.save(); ctx.translate(Math.round(centerX), 0); ctx.scale(flip ? -1 : 1, 1);
    ctx.drawImage(image, Math.round(-targetWidth / 2), Math.round(bottomY - targetHeight), Math.round(targetWidth), Math.round(targetHeight)); ctx.restore();
  }

  function drawProps(time) {
    hoveredMemory = null;
    for (const memory of memories) {
      const sx = memory.x - cameraX;
      const box = hitBox(memory);
      if (sx < -box.halfWidth - 40 || sx > width + box.halfWidth + 40) continue;
      const hover = Math.abs(pointer.x - sx) < box.halfWidth && Math.abs(pointer.y - (groundY - box.halfHeight / 2)) < box.halfHeight;
      if (hover && !["dialogue", "interacting", "ending"].includes(GameState.mode)) hoveredMemory = memory;
      const lift = hover ? -5 : 0;
      const glow = hover || (memory.flashUntil && memory.flashUntil > time);
      ctx.save();
      if (glow) { ctx.shadowColor = "rgba(245,215,117,.72)"; ctx.shadowBlur = 17; ctx.filter = "brightness(1.14)"; }
      drawProp(memory, sx, groundY + lift, time); ctx.restore();
      if (hover) {
        ctx.font = "700 16px 'Courier New', monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(248,235,183,.92)";
        ctx.fillText(memory.type === "lantern" ? "点亮" : "看看", Math.round(sx), Math.round(groundY - box.halfHeight - 24));
      }
    }
    shell.style.cursor = hoveredMemory || isCreatorHovered() ? "pointer" : "default";
  }

  function drawRabbitFrame(x, y, time) {
    if (!imageReady(sprites.rabbit)) return;
    let frame = Math.floor(time / 700) % 3;
    let hop = Math.sin(time * 0.0022) * 2;
    let scaleX = 1;
    let scaleY = 1 + Math.sin(time * 0.0022) * 0.015;
    if (rabbitReacted) {
      const elapsed = time - rabbitReactionStart;
      if (elapsed < 1900) {
        frame = 3 + Math.floor(elapsed / 220) % 6;
        const jumpPhase = (elapsed % 620) / 620;
        hop = -Math.sin(jumpPhase * Math.PI) * 30;
        scaleX = 1 + Math.sin(jumpPhase * Math.PI) * 0.08;
        scaleY = 1 - Math.sin(jumpPhase * Math.PI) * 0.06;
      } else {
        frame = Math.floor(time / 620) % 3;
      }
    }
    const size = 144;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + hop));
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(sprites.rabbit, (frame % 3) * 32, Math.floor(frame / 3) * 32, 32, 32, Math.round(-size / 2), Math.round(-size), size, size);
    ctx.restore();
    if (rabbitReacted) { ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.fillStyle = "#f2d88d"; ctx.fillText("♡", x + 4, y - 116 + Math.sin(time * 0.003) * 3); }
  }

  function drawProp(memory, x, y, time) {
    switch (memory.type) {
      case "sign": drawImageBottom(sprites.sign, x, y + 2, 142); break;
      case "postcard": {
        const float = Math.sin(time * 0.0022) * 4;
        ctx.save(); ctx.translate(x, y - 62 + float); ctx.rotate(-0.07);
        rect(-55, -35, 110, 70, "#e5d4a3"); rect(-48, -28, 96, 51, "#759578"); rect(-43, -23, 42, 6, "#a9c29b");
        rect(25, -24, 16, 15, "#e6b870"); rect(-17, -2, 52, 4, "rgba(240,225,178,.62)"); rect(-17, 8, 42, 4, "rgba(240,225,178,.5)"); ctx.restore(); break;
      }
      case "flowers": drawImageBottom(sprites.morningGlory, x - 39, y + 1, 116); drawImageBottom(sprites.caladium, x + 43, y + 2, 126); break;
      case "bench": drawImageBottom(sprites.bench, x, y + 2, 252); break;
      case "rabbit": drawRabbitFrame(x, y + 3, time); break;
      case "lantern": {
        if (lanternLit || memory.visited) {
          const pulse = 0.88 + Math.sin(time * 0.004) * 0.08;
          const glow = ctx.createRadialGradient(x, y - 168, 6, x, y - 168, 92);
          glow.addColorStop(0, `rgba(255,225,135,${0.48 * pulse})`); glow.addColorStop(0.45, `rgba(245,188,83,${0.18 * pulse})`); glow.addColorStop(1, "rgba(245,188,83,0)");
          ctx.fillStyle = glow; ctx.fillRect(x - 98, y - 266, 196, 196);
        }
        drawImageBottom(sprites.lantern, x, y + 3, 78); break;
      }
    }
  }

  function drawPlayer(time) {
    if (!imageReady(sprites.friend)) return;
    const x = player.x - cameraX;
    const moving = GameState.mode === "walking";
    const bob = moving ? Math.sin(time * 0.022) * 3 : Math.sin(time * 0.0018);
    const sway = moving ? Math.sin(time * 0.019) * 0.022 : 0;
    const spriteHeight = Math.min(190, height * 0.25);
    const spriteWidth = spriteHeight * sprites.friend.naturalWidth / sprites.friend.naturalHeight;
    ctx.save(); ctx.translate(Math.round(x), Math.round(groundY - spriteHeight + bob + (player.sitting ? 23 : 0))); ctx.scale(player.direction, 1); ctx.rotate(sway * player.direction);
    ctx.drawImage(sprites.friend, Math.round(-spriteWidth / 2), 0, Math.round(spriteWidth), Math.round(spriteHeight)); ctx.restore();
  }

  function creatorVisible() { return player.x > 5160 || GameState.endingPlayed; }
  function isCreatorHovered() {
    if (!creatorVisible() || ["dialogue", "interacting", "ending"].includes(GameState.mode)) return false;
    const sx = 5840 - cameraX;
    return Math.abs(pointer.x - sx) < 82 && Math.abs(pointer.y - (groundY - 98)) < 118;
  }
  function drawCreator(time) {
    if (!creatorVisible() || !imageReady(sprites.creator)) return;
    const x = 5840 - cameraX;
    if (x < -130 || x > width + 130) return;
    const spriteHeight = Math.min(194, height * 0.255);
    const spriteWidth = spriteHeight * sprites.creator.naturalWidth / sprites.creator.naturalHeight;
    ctx.save();
    if (isCreatorHovered()) { ctx.shadowColor = "rgba(252,224,136,.58)"; ctx.shadowBlur = 18; ctx.filter = "brightness(1.1)"; }
    ctx.translate(Math.round(x), Math.round(groundY - spriteHeight + Math.sin(time * 0.0016 + 1))); ctx.scale(-1, 1);
    ctx.drawImage(sprites.creator, Math.round(-spriteWidth / 2), 0, Math.round(spriteWidth), Math.round(spriteHeight)); ctx.restore();
    if (isCreatorHovered()) {
      ctx.font = "700 16px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(248,235,183,.94)";
      ctx.fillText("走近一点吧，", x, groundY - spriteHeight - 37);
      ctx.fillText("有人在那里等着你", x, groundY - spriteHeight - 17);
    }
  }

  function drawAtmosphere(time) {
    for (const fly of fireflies) {
      const x = fly.x - cameraX + Math.sin(time * 0.0007 + fly.phase) * 26;
      const y = groundY - fly.y + Math.cos(time * 0.0009 + fly.phase) * 18;
      if (x < -20 || x > width + 20) continue;
      const nearLamp = lanternLit && Math.abs(fly.x - 5040) < 560;
      const pulse = (nearLamp ? 0.52 : 0.28) + (Math.sin(time * 0.002 + fly.phase) + 1) * 0.23;
      ctx.save(); ctx.shadowColor = "rgba(255,225,118,.92)"; ctx.shadowBlur = nearLamp ? 13 : 9;
      rect(x, y, fly.radius * 2, fly.radius * 2, `rgba(255,229,130,${pulse})`); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = 0.045;
    for (let i = 0; i < 3; i += 1) { const mistX = ((time * 0.012 + i * 520 - cameraX * 0.08) % (width + 700)) - 350; rect(mistX, groundY - 145 - i * 33, 460, 50, "#dbe4cf"); }
    ctx.restore();
    for (const leaf of leaves) {
      const fall = (time * 0.001 * leaf.speed + leaf.phase * 40) % (height * 0.64);
      const x = leaf.x - cameraX * 0.82 + Math.sin(time * 0.001 + leaf.phase) * 34;
      if (x > -20 && x < width + 20) rect(x, 50 + fall, 6, 4, "rgba(164,137,69,.48)");
    }
  }

  function drawClickRings(now) {
    for (let i = clickRings.length - 1; i >= 0; i -= 1) {
      const ring = clickRings[i];
      const age = now - ring.createdAt;
      if (age > 440) { clickRings.splice(i, 1); continue; }
      const progress = age / 440;
      const x = ring.worldX - cameraX;
      const size = 6 + progress * 20;
      ctx.strokeStyle = `rgba(249,220,121,${(1 - progress) * 0.7})`; ctx.lineWidth = 3;
      ctx.strokeRect(Math.round(x - size), Math.round(ring.y - size * 0.35), Math.round(size * 2), Math.round(size * 0.7));
    }
  }

  function render(time) {
    const progress = clamp(player.x / WORLD_WIDTH, 0, 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = false;
    drawSky(progress); drawForestLayers(progress); drawGround(progress); drawProps(time); drawCreator(time); drawPlayer(time); drawAtmosphere(time); drawClickRings(time);
    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.55, height * 0.2, width * 0.5, height * 0.55, Math.max(width, height) * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, `rgba(0,8,7,${Math.max(0.26 - progress * 0.12 - finalBrightness * 0.08, 0.05)})`);
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  }

  function update(delta) {
    if (GameState.mode === "walking") {
      const distance = player.targetX - player.x;
      const step = player.speed * delta;
      if (Math.abs(distance) <= step) {
        player.x = player.targetX;
        if (GameState.pendingInteraction) { const interaction = GameState.pendingInteraction; GameState.pendingInteraction = null; beginInteraction(interaction); }
        else GameState.mode = "idle";
      } else { player.direction = distance > 0 ? 1 : -1; player.x += Math.sign(distance) * step; }
    }
    const screenX = player.x - cameraX;
    if (screenX < width * 0.35) targetCameraX = player.x - width * 0.35;
    if (screenX > width * 0.6) targetCameraX = player.x - width * 0.6;
    if (player.x > 5340 && !GameState.endingPlayed) targetCameraX = Math.max(targetCameraX, 5360 - width * 0.48);
    targetCameraX = clamp(targetCameraX, 0, Math.max(0, WORLD_WIDTH - width));
    cameraX += (targetCameraX - cameraX) * 0.08;
  }
  function frame(now) { const delta = Math.min((now - lastTime) / 1000, 0.05); lastTime = now; update(delta); render(now); requestAnimationFrame(frame); }

  function moveTo(worldX, pendingInteraction = null) {
    player.targetX = clamp(worldX, 90, WORLD_WIDTH - 180);
    player.direction = player.targetX >= player.x ? 1 : -1;
    player.sitting = false;
    GameState.pendingInteraction = pendingInteraction;
    GameState.mode = "walking";
    if (!firstMoveMade) { firstMoveMade = true; walkHint.classList.remove("visible"); }
  }
  function requestMemory(memory) {
    const direction = memory.x >= player.x ? 1 : -1;
    const stopX = memory.x - direction * memory.interactionDistance;
    if (Math.abs(player.x - memory.x) <= memory.interactionDistance) beginInteraction(memory); else moveTo(stopX, memory);
  }
  function finishMemoryDialogue(memory) { dialogue.start(memory.dialogue, () => { player.sitting = false; GameState.mode = "idle"; }); }
  function beginInteraction(interaction) {
    if (interaction.type === "creator") { startEnding(); return; }
    const memory = interaction;
    GameState.mode = "interacting";
    memory.flashUntil = performance.now() + 700;
    memory.visited = true;
    updateMemoryLights();
    if (memory.type === "bench") player.sitting = true;
    if (memory.type === "rabbit") { rabbitReacted = true; rabbitReactionStart = performance.now(); }
    if (memory.type === "lantern") lanternLit = true;
    if (memory.type === "postcard" || memory.type === "lantern") {
      setTimeout(() => gallery.open(gallerySets[memory.type], () => finishMemoryDialogue(memory)), 320);
      return;
    }
    setTimeout(() => finishMemoryDialogue(memory), 430);
  }
  function updateMemoryLights() {
    const lights = [...document.querySelectorAll("#memory-lights i")];
    countedMemories.forEach((memory, index) => lights[index].classList.toggle("lit", memory.visited));
  }

  function requestCreator() { const stopX = 5734; if (Math.abs(player.x - stopX) < 16) startEnding(); else moveTo(stopX, { type: "creator" }); }
  function startEnding() {
    GameState.mode = "ending";
    player.x = 5734; player.targetX = 5734; player.direction = 1;
    targetCameraX = clamp(5480 - width * 0.42, 0, WORLD_WIDTH - width);
    const opening = [];
    if (countedMemories.filter((memory) => memory.visited).length === 0) opening.push("你好像走得有点快。", "森林里还有一些东西没被你看到。", "不过，先到这里也没关系。");
    opening.push("你来啦。", "一路上的东西你都看完啦。\n其实也没有准备什么特别厉害的东西。", "只是想把一些我们之间的故事，\n放在这里。", "然后等你走到这里。", "所以——");
    setTimeout(() => dialogue.start(opening, revealBirthday), 950);
  }
  function revealBirthday() {
    GameState.mode = "ending"; finalBrightness = 1; bgm.volume = 0.4; birthdayReveal.hidden = false;
    setTimeout(() => { birthdayReveal.hidden = true; dialogue.start(["愿你新的一岁，\n依然有喜欢的事情，\n愿意去种不同的植物，看感兴趣的漫画，产喜欢cp的粮。", "愿你有值得期待的日子，\n也有很多被温柔对待的时刻。", "也希望你继续按照自己喜欢的方式，", "慢慢长成自己想成为的人。", "很高兴与你相识这么多年。\n也想和你继续走下去，去积攒更多的回忆与故事。", "生日快乐！身体健康！自由与快乐地再涨一岁！\n2026.10.8 肖"], finishEnding); }, 2600);
  }
  function finishEnding() { GameState.mode = "ending"; GameState.endingPlayed = true; endingMenu.hidden = false; }
  function replayEnding() { endingMenu.hidden = true; birthdayReveal.hidden = true; startEnding(); }
  function keepWalking() { endingMenu.hidden = true; finalBrightness = 0.45; bgm.volume = 0.32; GameState.mode = "idle"; }

  function pointerPosition(event) { const bounds = canvas.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; }
  function memoryAtPoint(point) {
    return memories.find((memory) => {
      const sx = memory.x - cameraX;
      const box = hitBox(memory);
      return Math.abs(point.x - sx) < box.halfWidth && Math.abs(point.y - (groundY - box.halfHeight / 2)) < box.halfHeight;
    }) || null;
  }
  function handlePointerDown(event) {
    if (!GameState.started || ["dialogue", "interacting", "ending", "cover"].includes(GameState.mode)) return;
    const point = pointerPosition(event);
    pointer = point;
    if (isCreatorHovered()) { requestCreator(); return; }
    const touchedMemory = memoryAtPoint(point);
    if (touchedMemory) { requestMemory(touchedMemory); return; }
    if (point.y < height * 0.38) return;
    const worldX = point.x + cameraX;
    clickRings.push({ worldX, y: clamp(point.y, groundY - 28, groundY + 45), createdAt: performance.now() });
    moveTo(worldX);
  }

  async function enterForest() {
    if (GameState.started) return;
    GameState.started = true; GameState.mode = "idle"; bgm.volume = 0.32; forestAudio.volume = 0.14;
    try { await Promise.all([bgm.play(), forestAudio.play()]); } catch (error) { console.info("声音等待浏览器许可或素材替换：", error); }
    cover.classList.add("leaving");
    setTimeout(() => { cover.hidden = true; walkHint.classList.add("visible"); setTimeout(() => walkHint.classList.remove("visible"), 5200); }, 1100);
  }
  function setAudioButton(button, enabled) { button.setAttribute("aria-pressed", String(enabled)); button.querySelector("span").textContent = enabled ? "开" : "关"; }

  enterButton.addEventListener("click", enterForest);
  canvas.addEventListener("pointermove", (event) => { pointer = pointerPosition(event); });
  canvas.addEventListener("pointerleave", () => { pointer = { x: -999, y: -999 }; });
  canvas.addEventListener("pointerdown", handlePointerDown);
  audioToggle.addEventListener("click", (event) => { event.stopPropagation(); audioPanel.hidden = !audioPanel.hidden; audioToggle.setAttribute("aria-expanded", String(!audioPanel.hidden)); });
  musicToggle.addEventListener("click", () => { bgm.muted = !bgm.muted; setAudioButton(musicToggle, !bgm.muted); });
  ambientToggle.addEventListener("click", () => { forestAudio.muted = !forestAudio.muted; setAudioButton(ambientToggle, !forestAudio.muted); });
  $("#keep-walking").addEventListener("click", keepWalking);
  $("#replay-ending").addEventListener("click", replayEnding);
  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
