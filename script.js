// Képernyőméret (pl. mobil vagy desktop) detektálása az induláskor
const isMobile = window.innerWidth <= 768;

const config = isMobile ? {
    // Mobil (9:16) konfiguráció
    frameCount: 120, // 86401 -> 86520
    startFrame: 86401,
    framePrefix: 'Untitled000',
    frameExtension: '.webp',
    framesPath: './images916/',
    fps: 30
} : {
    // Asztali (Széles) konfiguráció
    frameCount: 121, // 86400 -> 86520
    startFrame: 86400,
    framePrefix: 'andiesk000',
    frameExtension: '.webp',
    framesPath: './images/',
    fps: 30
};

// Canvas optimalizálás
const canvas = document.getElementById('invite-canvas');
const ctx = canvas.getContext('2d', { alpha: false }); // A true gyorsabb, mert nincs áttetszőség
const images = [];
let loadedImages = 0;
let currentFrame = 0;
let animationReq = null;

// Méretezés biztosítása bármilyen kijelzőn
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Ha már be van töltve kép, akkor újra is rajzoljuk az adott képkockát méretezés után
    if (images[currentFrame]) {
        drawFrame(currentFrame);
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Képek aszinkron és okos betöltése a memóriába
function preloadImages() {
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    for (let i = 0; i < config.frameCount; i++) {
        // Hozzáadjuk a kezdőframe számához (86400) a jelenlegi i (0..104) értéket
        const currentNum = config.startFrame + i;
        const imgPath = `${config.framesPath}${config.framePrefix}${currentNum}${config.frameExtension}`;
        
        const img = new Image();
        img.src = imgPath;
        
        img.onload = () => {
            loadedImages++;
            // Progress bar frissítése
            const progress = (loadedImages / config.frameCount) * 100;
            progressBar.style.width = `${progress}%`;
            
            if (loadedImages === config.frameCount) {
                // Minden betöltött!
                document.getElementById('loading-screen').classList.remove('active');
                document.getElementById('loading-screen').classList.add('hidden');
                
                // Megjelenik a "Kinyitás" Gomb
                document.getElementById('start-screen').classList.remove('hidden');
                document.getElementById('start-screen').classList.add('active');
                
                // Berajzoljuk a legelső képkockát "Háttérnek"
                drawFrame(0);
            }
        };

        img.onerror = () => {
            console.error(`Nem találtam a képet: ${imgPath} - Biztosan így nevezted el őket a mappa alatt?`);
            // Még hiba esetén is léptetjük a loadert, hogy ne akadjon meg az oldal
            loadedImages++;
        }

        images.push(img);
    }
}

// Kép kirajzolása a canvasra (Térkitöltés Object-Fit: Cover logikával)
function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Megpróbáljuk a képet méretarányosan kitölteni a canvas-on (cropping if necessary)
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = canvas.width / 2 - w / 2;
    const y = canvas.height / 2 - h / 2;

    ctx.drawImage(img, x, y, w, h);
}

// Az animáció "Lejátszó" logikája
function playAnimation() {
    const now = Date.now();
    const interval = 1000 / config.fps;
    let then = now;

    function render() {
        animationReq = requestAnimationFrame(render);
        
        const currentTime = Date.now();
        const delta = currentTime - then;
        
        if (delta > interval) {
            then = currentTime - (delta % interval);
            
            if (currentFrame < config.frameCount - 1) {
                currentFrame++;
                drawFrame(currentFrame);
            } else {
                // Elértünk az utolsó képkockához, VÉGE AZ ANIMÁCIÓNAK
                cancelAnimationFrame(animationReq);
                
                // Megjelenítjük a görgetés indikátort
                document.getElementById('scroll-indicator').classList.remove('hidden');
                
                // Amikor az animáció lefutott, visszahozzuk a "final-content" dobozt a gombokkal!
                const finalContent = document.getElementById('final-content');
                finalContent.classList.remove('hidden');
                finalContent.classList.add('visible');
                
                // Engedélyezzük a görgetést (a body default overflow: hidden volt)
                document.body.style.overflow = 'auto';
            }
        }
    }
    
    render();
}

// Gomb Eseménykezelő - Kezdés!
document.getElementById('open-btn').addEventListener('click', () => {
    // Eltüntetjük a kezdőképernyőt
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('hidden');
    
    // Elindítjuk a kinyíló videó képkockákat
    document.getElementById('animation-screen').classList.remove('hidden');
    document.getElementById('animation-screen').classList.add('active');
    
    playAnimation();
});

// Elindítjuk a preloading folyamatot
window.onload = preloadImages;
