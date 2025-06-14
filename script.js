document.addEventListener('DOMContentLoaded', () => {
    
    // --- ОБЩИЕ ПЕРЕМЕННЫЕ ---
    const body = document.body;
    // const bgSound = document.getElementById('bg-sound');
    // const splashSound = document.getElementById('splash-sound');
    // const bubbleSound = document.getElementById('bubble-sound');

    // --- ЭКРАН 1: ПОВЕРХНОСТЬ ВОДЫ ---
    const surface = document.getElementById('surface');
    const lightOrb = document.getElementById('light-orb');
    const entrySymbol = document.getElementById('entry-symbol');

    function handleMouseMove(e) {
        lightOrb.style.left = `${e.clientX}px`;
        lightOrb.style.top = `${e.clientY}px`;
    }

    function diveIn() {
        // splashSound.play();
        body.classList.add('dived');
        body.style.overflowY = 'auto'; // Включаем скролл
        
        // bgSound.play();

        surface.addEventListener('transitionend', () => {
            surface.style.display = 'none';
        }, { once: true });

        // Отключаем слушатели первого экрана для производительности
        window.removeEventListener('mousemove', handleMouseMove);
        entrySymbol.removeEventListener('click', diveIn);
        window.removeEventListener('wheel', diveInOnce);
    }
    
    // Погружение по клику или по первому скроллу
    entrySymbol.addEventListener('click', diveIn);
    const diveInOnce = () => diveIn();
    window.addEventListener('wheel', diveInOnce, { once: true });
    window.addEventListener('mousemove', handleMouseMove);

    // --- ЭКРАН 2: ПАРАЛЛАКС И КОНТЕНТ ---
    const bubblesLayer = document.getElementById('bubbles-layer');
    const particlesLayer = document.getElementById('particles-layer');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Разная скорость для слоев создает глубину
        bubblesLayer.style.transform = `translateY(${scrollY * 0.5}px)`;
        particlesLayer.style.transform = `translateY(${scrollY * 0.8}px)`;
    });

    // Анимация "кристаллизации" контента при появлении
    const contentBlocks = document.querySelectorAll('.content-block');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Раскомментируйте, чтобы блоки "растворялись" при уходе с экрана
                // entry.target.classList.remove('visible');
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.2 // Блок станет видимым, когда 20% его высоты видно
    });

    contentBlocks.forEach(block => observer.observe(block));

    // --- ЭЛЕМЕНТЫ: МЕНЮ-ПЕЩЕРА И ВСПЛЕСКИ ---
    const menuTrigger = document.getElementById('menu-trigger-zone');
    const waterfall = document.getElementById('waterfall');

    menuTrigger.addEventListener('click', () => {
        body.classList.toggle('menu-open');
    });
    
    // Эффект всплеска на клик
    document.addEventListener('click', function (e) {
        // Не создаем всплеск на триггере меню или внутри самого меню
        if(e.target.closest('#menu-trigger-zone') || e.target.closest('#cave-menu')) return;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        document.body.appendChild(ripple);

        ripple.style.left = `${e.clientX - ripple.offsetWidth / 2}px`;
        ripple.style.top = `${e.clientY - ripple.offsetHeight / 2}px`;

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    });

    // --- МИНИ-ИГРА "ГОНКА СВЕТЛЯЧКА" ---
    const gameBubbles = document.querySelectorAll('.game-bubble');
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('game-score');

    let bubbleClickCount = 0;
    let gameActive = false;

    gameBubbles.forEach(bubble => {
        bubble.addEventListener('click', (e) => {
            e.stopPropagation(); // Предотвращаем всплеск от общего клика
            // bubbleSound.play();
            bubble.style.transform = 'scale(0)';
            bubble.style.opacity = '0';
            
            bubbleClickCount++;
            if (bubbleClickCount >= 3) {
                startGame();
            }
        });
    });

    function startGame() {
        gameContainer.style.display = 'flex';
        body.style.overflow = 'hidden';
        gameActive = true;
        // Здесь начинается логика игры
        setupGame();
        gameLoop();
    }

    // Параметры игры
    let player, obstacles, pearls, score, frame;
    const playerRadius = 15;
    const playerColor = 'var(--cyan-glow)';

    function setupGame() {
        canvas.width = Math.min(window.innerWidth * 0.8, 600);
        canvas.height = Math.min(window.innerHeight * 0.8, 800);
        
        player = {
            x: canvas.width / 4,
            y: canvas.height / 2,
            vy: 0, // vertical velocity
            gravity: 0.3,
            lift: -7
        };
        obstacles = [];
        pearls = [];
        score = 0;
        frame = 0;
        scoreEl.textContent = 'Очки: 0';
    }

    function gameLoop() {
        if (!gameActive) return;

        // Обновление
        player.vy += player.gravity;
        player.y += player.vy;

        // Генерация препятствий и жемчужин
        if (frame % 100 === 0) {
            const gapHeight = 200;
            const gapY = Math.random() * (canvas.height - gapHeight);
            obstacles.push({ x: canvas.width, y: 0, width: 40, height: gapY });
            obstacles.push({ x: canvas.width, y: gapY + gapHeight, width: 40, height: canvas.height });
        }
        if (frame % 150 === 0) {
            pearls.push({x: canvas.width, y: Math.random() * canvas.height, radius: 8});
        }
        
        // Отрисовка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Игрок
        ctx.beginPath();
        ctx.arc(player.x, player.y, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
        ctx.shadowColor = playerColor;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Препятствия
        ctx.fillStyle = '#1a1a2e';
        obstacles.forEach(obs => {
            obs.x -= 3;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // Проверка столкновения
            if (player.x + playerRadius > obs.x && player.x - playerRadius < obs.x + obs.width &&
                player.y + playerRadius > obs.y && player.y - playerRadius < obs.y + obs.height) {
                endGame();
            }
        });

        // Жемчужины
        ctx.fillStyle = 'var(--silver-white)';
        pearls.forEach((pearl, index) => {
            pearl.x -= 2;
            ctx.beginPath();
            ctx.arc(pearl.x, pearl.y, pearl.radius, 0, Math.PI * 2);
            ctx.fill();
            // Сбор жемчужин
            const dist = Math.hypot(player.x - pearl.x, player.y - pearl.y);
            if (dist - pearl.radius - playerRadius < 1) {
                score++;
                scoreEl.textContent = `Очки: ${score}`;
                pearls.splice(index, 1);
            }
        });
        
        // Убираем старые элементы
        obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
        pearls = pearls.filter(p => p.x + p.radius > 0);

        // Проверка границ
        if (player.y > canvas.height || player.y < 0) {
            endGame();
        }

        frame++;
        requestAnimationFrame(gameLoop);
    }
    
    function playerJump() {
        if(gameActive) player.vy = player.lift;
    }
    
    canvas.addEventListener('click', playerJump);

    function endGame() {
        gameActive = false;
        alert(`Игра окончена! Ваш счет: ${score}. Вы вернетесь в поток.`);
        gameContainer.style.display = 'none';
        body.style.overflowY = 'auto';
        
        // Сброс счетчика кликов для повторной игры
        bubbleClickCount = 0;
        gameBubbles.forEach(bubble => {
            bubble.style.transform = 'scale(1)';
            bubble.style.opacity = '1';
        });
    }

});