import React, { useState, useRef, useEffect } from 'react';
import { CONFIG } from '../../game/config.ts';
import { Mondalak } from '../../game/classes/Mondalak.ts';
import { Bullet } from '../../game/classes/Bullet.ts';
import { GameState } from '../../types.ts';
import { Enemy } from '../../game/classes/Enemy.ts';
import { Heart } from '../../game/classes/Heart.ts';
import { Buff } from '../../game/classes/Heart.ts';
import createEnemy from '../../game/createEnemy.ts';
import { loadSounds, playRandomSound, playSound, getLeaderBoard } from '../../game/utils.ts';
import { useFrameMultiplier } from '../../providers/FrameMultiplierProvider.tsx';
import { useTransactions } from '../../hooks/useTransactions.ts';
import LeaderboardPopup from '../LeaderboardPopup/LeaderboardPopup.tsx';
import TransactionsTable from '../TransactionsTable/TransactionsTable.tsx';
import GameUI from '../GameUI/GameUI.tsx';

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const explosions = useRef<{ x: number; y: number; frame: number, width: number, height: number }[]>([]);
  const enemies = useRef<Enemy[]>([]);
  const playerTank = useRef<Mondalak | null>(null);
  const bullets = useRef<Bullet[]>([]);
  const isDead = useRef<boolean>(false);
  const audioPool = useRef<HTMLAudioElement[]>([]);
  const hearts = useRef<Heart[]>([]);
  const buffs = useRef<Buff[]>([]);
  const killCountRef = useRef<number>(0);
  const totalScoreRef = useRef<number>(0);
  const countdownRef = useRef<boolean>(false);
  const isSoundOn = useRef<boolean>(true);
  const buffTimerRef = useRef<NodeJS.Timeout | null>(null);
  const frameMultiplier = useFrameMultiplier(); 
  const { transactions, handleMint, handleTotalScore } = useTransactions();

  type ImageCache = {
    enemies: {
      [key: string]: HTMLImageElement;
    }
    fire: {
      [key: string]: HTMLImageElement;
    }
    player: {
      [key: string]: HTMLImageElement;
    };
  };
  
  const imageCache = {
    enemies: {},  
    fire: {},
    player: {}
  } as ImageCache;

  const imageCacheRef = useRef<ImageCache>({
    enemies: {},
    fire: {},
    player: {},
  });

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [sounds, setSounds] = useState<{ [key: string]: HTMLAudioElement[] } | null>(null);
  const [soundBtnLabelOn, setSoundBtnLabelOn] = useState(true)
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [buffTimerValue, setBuffTimerValue] = useState<number>(0);
  const [isStartButtonDisabled, setIsStartButtonDisabled] = useState(true);
  const [gameStat, setGameStat] = useState({
    totalScore: 0,
    killCount: 0,
    fireMondalakKillKount: 0,
    damageTaken: 0,
    damageGiven: 0,
    healsUsed: 0,
    buffsTaken: 0
  });

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const updateGameStat = (
    key: keyof typeof gameStat,
    value: number | ((prev: number) => number)
  ) => {
    setGameStat(prev => ({
      ...prev,
      [key]: typeof value === "function" ? (value as (prev: number) => number)(prev[key]) : value
    }));
  };

  const [explosionFrames, setExplosionFrames] = useState<HTMLImageElement[]>([]);

  const [isMobile, setIsMobile] = useState(false);

  const bulletPoolRef = useRef<Bullet[]>([]);
  
  const isUnsupportedBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return (
      (ua.includes("firefox")) ||
      (ua.includes("safari") && !ua.includes("chrome")) ||
      (ua.includes("edg/") && !ua.includes("chrome")) ||  
      ua.includes("tor") 
    );
  };

  const startCountdown = () => {
    setGameState('countdown');
    countdownRef.current = true;
    setCountdownValue(3);

    let counter = 3;
    const countdownInterval = setInterval(() => {
      counter--;
      setCountdownValue(counter);

      if (counter <= 0) {
        clearInterval(countdownInterval);
        countdownRef.current = false;
        setGameState('playing');
      }
    }, 1000);
  };

  const startBuffTimer = (number: number, playerTank: React.RefObject<{ isBuffed: boolean }>) => {
    if (!playerTank.current || gameState !== "playing") return;

    setBuffTimerValue(number);
    playerTank.current.isBuffed = true;

    if (buffTimerRef.current) {
      clearInterval(buffTimerRef.current);
    }

    let counter = number;

    const buffCountDown = setInterval(() => {
      counter--;
      setBuffTimerValue(counter);

      if (counter <= 0) {
        clearInterval(buffCountDown);
        buffTimerRef.current = null;
        if (playerTank.current) {
          playerTank.current.isBuffed = false;
        }
      }
    }, 1000);

    buffTimerRef.current = buffCountDown;
  };

  const preloadImages = async () => {
    const imageCacheEnemies = {
      "default": [
        "/chars/10.svg",
        "/chars/11.svg",
        "/chars/12.svg",
        "/chars/13.svg",
        "/chars/14.svg",
      ],
    };
    const imageCacheFire = {
      "fire": ["/chars/8.svg"]
    };
  
    const imageCachePlayer = {
      "main": ["/chars/15.svg"]
    };
  
    const loadImage = (src: string) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      });
    };
  
    const enemyImages = await Promise.all(
      Object.entries(imageCacheEnemies).flatMap(([key, srcList]) =>
        srcList.map(async (src, index) => {
          const img = await loadImage(src);
          imageCache.enemies[index] = img;
        })
      )
    );

    const enemyFireImages = await Promise.all(
      Object.entries(imageCacheFire).flatMap(([key, srcList]) =>
        srcList.map(async (src, index) => {
          const img = await loadImage(src);
          imageCache.fire[index] = img;
        })
      )
    );
  
    const playerImages = await Promise.all(
      Object.entries(imageCachePlayer).flatMap(([key, srcList]) =>
        srcList.map(async (src, index) => {
          const img = await loadImage(src);
          imageCache.player[index] =  img;
        })
      )
    );
  
    const explosionFramesArr = await Promise.all(
      Array.from({ length: 151 - 16 + 1 }, (_, i) => 16 + i).map(async (i) => {
        const img = await loadImage(`/explotion/frame(${i}).png`);
        return img;
      })
    );
  
    setExplosionFrames(explosionFramesArr);
    imageCacheRef.current = imageCache;
  };

  const toggleSound = () => {
    setSoundBtnLabelOn(!isSoundOn.current)
    isSoundOn.current = !isSoundOn.current;
  };

  const resetGameObjects = () => {
    playerTank.current = new Mondalak(
      canvasRef.current!.width / 2,
      canvasRef.current!.width / 2,
      true,
      CONFIG.BULLET_SPEED,
      CONFIG.FIRE_RATE,
      "#c005c7",
      "main",
      imageCacheRef.current.player[0]
    );

    bullets.current = [];
    hearts.current = [];
    buffs.current = [];
    buffTimerRef.current = null;

    updateGameStat("killCount", 0);
    updateGameStat("fireMondalakKillKount", 0);
    updateGameStat("damageTaken", 0);
    updateGameStat("damageGiven", 0);
    updateGameStat("totalScore", 0);
    updateGameStat("healsUsed", 0);
    updateGameStat("buffsTaken", 0);

    setBuffTimerValue(0);
    killCountRef.current = 0;
    totalScoreRef.current = 0;

    isDead.current = false;
    audioPool.current.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioPool.current = [];

    if (gameState === "countdown") {
      enemies.current = [];
      spawnEnemies(0);
    }

    if (bulletPoolRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        bulletPoolRef.current.push(new Bullet(0, 0, 0, 0, '', 0, false, 0, ''));
      }
    }
  };

  const spawnEnemies = (killCount) => {
    if (!killCount) {
      createEnemy(enemies.current, 1, true, "default", frameMultiplier, imageCacheRef.current);
      return;
    }

    const maxEnemiesAllowed = Math.min(CONFIG.MAX_ENEMIES_BEGINNING + Math.floor(killCount / 10), CONFIG.MAX_ENEMIES);

    if (enemies.current.length < maxEnemiesAllowed) {
      const enemiesToSpawn = maxEnemiesAllowed - enemies.current.length;

      for (let i = 0; i < enemiesToSpawn; i++) {
        const spawnDelay = 150 + Math.random() * (430 - 150);
        setTimeout(() => {
          if (enemies.current.length < maxEnemiesAllowed) {
            const enemyType = Math.random() < 0.05 ? "fire" : "default";
            const difficulty = Math.min(Math.floor(killCount / 10), 10);
            const adjustedDifficulty = enemyType === "fire" ? difficulty * 10 : difficulty;
            enemies.current = createEnemy(enemies.current, adjustedDifficulty, false, enemyType, frameMultiplier, imageCacheRef.current);
          }
        }, spawnDelay);
      }
    }
  };

  const handleStopGame = () => {
    const totalScore = totalScoreRef.current;
    handleTotalScore(totalScore, true);
    setGameState("menu");
    resetGameObjects();
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1100px)");

    const handleResize = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleResize);
    console.log(frameMultiplier);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  useEffect(() => {
      loadSounds().then(setSounds);
      preloadImages().then(() => {
        setAssetsLoaded(true);
      });
      
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => {
        setIsStartButtonDisabled(false);
        document.body.style.overflow = 'auto';
      }, 1000);
      
      return () => {
        document.body.style.overflow = 'auto';
      };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'menu') {
      // Preload leaderboard data
      getLeaderBoard().catch(error => console.error('Error getting leaderboard:', error));
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing" || gameState === "countdown") {
      if ( assetsLoaded ) {
        resetGameObjects();
      } else {
        preloadImages().then(() => {
          setAssetsLoaded(true);
          resetGameObjects();
        });
      }

    } else {
      playerTank.current = null;
      enemies.current = [];
      bullets.current = [];
    }

  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = CONFIG.CANVAS_WIDTH;
    canvasRef.current.height = CONFIG.CANVAS_HEIGHT;

    const keys = { w: false, a: false, s: false, d: false };
    const mouse = { x: 0, y: 0, shooting: false };

    const keyHandler = (e: KeyboardEvent, isKeyDown: boolean) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'ц': keys.w = isKeyDown; break;
        case 'a': case 'ф': keys.a = isKeyDown; break;
        case 's': case 'ы': case "і": keys.s = isKeyDown; break;
        case 'd': case 'в': keys.d = isKeyDown; break;
      }
    };

    const getScale = () => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return rect.width / CONFIG.CANVAS_WIDTH;
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      const scale = getScale();

      const rect = canvasRef.current!.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / scale;
      mouse.y = (e.clientY - rect.top) / scale;
    };

    const killEnemy = (enemy, enemyIndex) => {
      explosions.current.push({ x: enemy.x, y: enemy.y, frame: 16, width: 100, height: 96 });
      enemies.current.splice(enemyIndex, 1);

      setGameStat(prev => {
        const newKillCount = prev.killCount + 1;
        killCountRef.current = newKillCount;
        totalScoreRef.current = prev.totalScore + (enemy.type === "fire" ? 3 : 1);
        spawnEnemies(newKillCount);
        
        return {
          ...prev,
          totalScore: prev.totalScore + (enemy.type === "fire" ? 3 : 1),
          killCount: newKillCount,
          fireMondalakKillKount: enemy.type === "fire" ? prev.fireMondalakKillKount + 1 : prev.fireMondalakKillKount
        };
      });

      setTimeout(() => {
        const totalScore = totalScoreRef.current;
        handleTotalScore(totalScore, false);
      }, 0);

      // if (enemy.type === "fire") handleMint(killCountRef.current);

      audioPool.current = playRandomSound(sounds, "kill", isSoundOn.current, audioPool.current);
    };

    const updateGameState = () => {
      if (!playerTank.current || !canvasRef.current) return;

      let newX = playerTank.current.x;
      let newY = playerTank.current.y;

      if (keys.w) newY -= playerTank.current.speed * frameMultiplier;
      if (keys.s) newY += playerTank.current.speed * frameMultiplier;
      if (keys.a) newX -= playerTank.current.speed * frameMultiplier;
      if (keys.d) newX += playerTank.current.speed * frameMultiplier;

      newX = Math.max(45, Math.min(canvasRef.current!.width - 45, newX));
      newY = Math.max(45, Math.min(canvasRef.current!.height - 45, newY));

      playerTank.current.updatePosition(newX, newY);

      const dx = mouse.x - playerTank.current.x;
      const dy = mouse.y - playerTank.current.y;
      playerTank.current.angle = Math.atan2(dy, dx);

      if (mouse.shooting && Date.now() - playerTank.current.lastShot > CONFIG.FIRE_RATE) {

        const barrelEndX = playerTank.current.x + Math.cos(playerTank.current.angle) * playerTank.current.barrelSize;
        const barrelEndY = playerTank.current.y + Math.sin(playerTank.current.angle) * playerTank.current.barrelSize;

        const audioPoolNew: HTMLAudioElement[] = playSound("/sound/shoot/shooooot.mp3", isSoundOn.current, audioPool.current);

        audioPool.current = audioPoolNew;

        const bullet = new Bullet(
          barrelEndX,
          barrelEndY,
          playerTank.current.angle,
          playerTank.current.bulletSpeed * frameMultiplier,
          playerTank.current.bulletColor,
          playerTank.current.isBuffed ? 18 : 7,
          playerTank.current.isPlayer,
          playerTank.current.isBuffed ? 2 : 1,
          "player"
        );
        bullets.current.push(bullet);
        playerTank.current.lastShot = Date.now();
      }

      bullets.current = bullets.current.filter(bullet => !bullet.isExpired);
      bullets.current.forEach(bullet => bullet.update());

      bullets.current.forEach((bullet, bulletIndex) => {
        if (playerTank.current && !bullet.isExpired) {
          const dx = playerTank.current.x - bullet.x;
          const dy = playerTank.current.y - bullet.y;
          if (Math.sqrt(dx * dx + dy * dy) < 35) {
            const dead = playerTank.current.takeDamage(bullet.damage);

            bullets.current.splice(bulletIndex, 1);
            updateGameStat("damageTaken", prev => prev + bullet.damage);
            if (dead && !isDead.current) {
              const totalScore = totalScoreRef.current;
              handleTotalScore(totalScore, true);

              isDead.current = true;
              explosions.current.push({ x: playerTank.current.x, y: playerTank.current.y, frame: 16, width: 400, height: 395 });

              playRandomSound(sounds, "death", isSoundOn.current, audioPool.current);

              
              setTimeout(() => {
                setGameState("gameover");
              }, 1000);
            } else {
              const audioPoolNew: HTMLAudioElement[] = playSound("/sound/applepay.mp3", isSoundOn.current, audioPool.current);
              audioPool.current = audioPoolNew;
            }
          }
        }

        enemies.current.forEach((enemy, enemyIndex) => {
          if (bullet.isPlayer) {
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            if (Math.sqrt(dx * dx + dy * dy) < (enemy.width / 2)) {
              const result = enemy.takeDamage(bullet.damage);
              bullets.current.splice(bulletIndex, 1);
              updateGameStat("damageGiven", prev => prev + bullet.damage);
              
              switch (result) {
                case "drop_heart":
                  hearts.current.push(new Heart(
                    enemy.x,
                    enemy.y
                  ))

                  killEnemy(enemy, enemyIndex);
                  return;
                case "drop_buff":
                  buffs.current.push(new Buff(
                    enemy.x,
                    enemy.y
                  ))

                  killEnemy(enemy, enemyIndex);
                  return;
                case false:
                  const pool = playRandomSound(sounds, "hit", isSoundOn.current, audioPool.current);
                  audioPool.current = pool;
                  return;
              }
            }
          }
        });

      });
      hearts.current.forEach((heart, heartIndex) => {
        if (playerTank.current) {
          const dx = playerTank.current.x - heart.x;
          const dy = playerTank.current.y - heart.y;

          if (Math.sqrt(dx * dx + dy * dy) < (playerTank.current.width / 2) && playerTank.current.health < playerTank.current.maxHealth) {
            hearts.current.splice(heartIndex, 1);
            const audioPoolNew: HTMLAudioElement[] = playSound("/sound/heal.mp3", isSoundOn.current, audioPool.current);

            audioPool.current = audioPoolNew;
            playerTank.current.heal();
            updateGameStat("healsUsed", prev => prev + 1);

          }

          const expired = heart.isExpired();
          if (expired) {
            hearts.current.splice(heartIndex, 1);
          }
        }
      })

      buffs.current.forEach((buff, buffIndex) => {
        if (playerTank.current) {
          const dx = playerTank.current.x - buff.x;
          const dy = playerTank.current.y - buff.y;

          if (Math.sqrt(dx * dx + dy * dy) < (playerTank.current.width / 2)) {
            buffs.current.splice(buffIndex, 1);
            const audioPoolNew: HTMLAudioElement[] = playSound("/sound/heal.mp3", isSoundOn.current, audioPool.current);

            audioPool.current = audioPoolNew;
            playerTank.current.isBuffed = true;
            startBuffTimer(10, playerTank);
            updateGameStat("buffsTaken", prev => prev + 1);

          }

          const expired = buff.isExpired();
          if (expired) {
            buffs.current.splice(buffIndex, 1);
          }
        }
      })

      enemies.current.forEach(enemy => {
        const bullet = enemy.updateAI(playerTank.current!.x, playerTank.current!.y);
        if (bullet) {
          bullets.current.push(bullet);
        }
      });
   

      if (killCountRef.current > 10) {
        playerTank.current.maxHealth = 8
      }
    };

    const gameLoop = () => {
      if (!playerTank.current) return;
      
      ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.fillStyle = '#ffccff';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      
      const drawMap = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#800080';
        for (let y = 0; y < CONFIG.MAP.length; y++) {
          for (let x = 0; x < CONFIG.MAP[y].length; x++) {
            if (CONFIG.MAP[y][x] === 1) {
              ctx.fillRect(
                x * CONFIG.CELL_SIZE,
                y * CONFIG.CELL_SIZE,
                CONFIG.CELL_SIZE - 1,
                CONFIG.CELL_SIZE - 1
              );
            }
          }
        }
      };

      drawMap(ctx);

      if (gameState === "playing") {
        updateGameState();
      }

      playerTank.current.draw(ctx, isDead.current);

      enemies.current.forEach(enemy => enemy.draw(ctx));

      bullets.current.forEach(bullet => bullet.draw(ctx));

      hearts.current.forEach(heart => heart.draw(ctx));
      buffs.current.forEach(buff => buff.drawBuff(ctx));

      explosions.current.forEach((explosion, index) => {
        if (explosion.frame >= explosionFrames.length) {
          explosions.current.splice(index, 1);
          return;
        }
        ctx.drawImage(explosionFrames[explosion.frame], explosion.x - (explosion.width / 2) + (10 / 2),
          explosion.y - (explosion.height / 2) + (20 / 2), explosion.height, explosion.height);
        explosion.frame += Math.ceil(frameMultiplier);
      });

      
    

      requestAnimationFrame(gameLoop);
    };

    window.addEventListener('keydown', (e) => keyHandler(e, true));
    window.addEventListener('keyup', (e) => keyHandler(e, false));
    canvasRef.current.addEventListener('mousemove', mouseMoveHandler);
    canvasRef.current.addEventListener('mousedown', () => mouse.shooting = true);
    canvasRef.current.addEventListener('mouseup', () => mouse.shooting = false);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', (e) => keyHandler(e, true));
      window.removeEventListener('keyup', (e) => keyHandler(e, false));
      canvasRef.current?.removeEventListener('mousemove', mouseMoveHandler);
    };
  }, [gameState]);

  if (isUnsupportedBrowser()) {
    return (
      <div className="bg-mobile bg">
        <div className="mobile-warning">
          <h2>Unsupported browser</h2>
          <p>Please use browser from the list below.</p>
          <ul style={{
            textAlign: "left",
            padding: 0,
            margin: 0
          }}>
            <li>Chrome</li>
            <li>Edge (Chrome based)</li>
            <li>Safari (Chrome based)</li>
          </ul>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="bg-mobile bg">
        <div className="mobile-warning">
          <h2>Desktop version only</h2>
          <p>Please use a larger screen to play the game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div>
        <canvas ref={canvasRef} width={canvasRef.current?.width} height={canvasRef.current?.height}></canvas>
        {
          gameState === "countdown" && (
            <>
              <div className="coundown bg">
                <h1>{countdownValue}</h1>
              </div>
            </>
          )
        }

      <LeaderboardPopup 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
      />

        {gameState === 'playing' && (
          <GameUI
            killCount={gameStat.killCount}
            buffTimerValue={buffTimerValue}
            soundBtnLabelOn={soundBtnLabelOn}
            onSoundToggle={toggleSound}
            onStopGame={handleStopGame}
          />
        )}
        {gameState === 'menu' && (
          <>
            <div className="bg">
              <h1 className='total-score h1'>Kill everyone <br /> Dodge everything</h1>
                <button disabled={isStartButtonDisabled} className="leaderboard-button" onClick={() => setIsLeaderboardOpen(true)}>
                  Leaderboard
                </button>

              <div className="game-menu">
                <button disabled={isStartButtonDisabled} style={{
                  marginRight: "10px"
                }} onClick={toggleSound}>
                  <span className="counter-label">
                    {
                      soundBtnLabelOn ? "Disable sounds" : "Enable sounds"
                    }
                  </span>
                </button>
                <button onClick={startCountdown} disabled={isStartButtonDisabled}>
                  {'Start'}
                </button>
              </div>
            </div>

          </>
        )}

        {gameState === 'gameover' && (
          <>
            <div className="bg">
              <h1 className='total-score h1'>Your total score: {gameStat.totalScore}</h1>
              <button className="leaderboard-button" onClick={() => setIsLeaderboardOpen(true)}>
                  Leaderboard
                </button>
              <div className="game-menu">

                <button onClick={startCountdown}>
                  {'Try again'}
                </button>
              </div>

              <div className="game-stat">

                <div className="row">
                  <div className="col">
                    <span>Total kills: {gameStat.killCount}</span>
                    <span>Bosses killed: {gameStat.fireMondalakKillKount}</span>
                    <span>Damage dealt: {gameStat.damageGiven}</span>
                  </div>
                  <div className="col">
                    <span>Damage taken: {gameStat.damageTaken}</span>
                    <span>Heals used: {gameStat.healsUsed}</span>
                    <span>Buffs taken: {gameStat.buffsTaken}</span>
                  </div>
                </div>
              </div>
            </div>
          </>

        )}
      </div>
      <TransactionsTable transactions={transactions} />
    </div>
  );
};
export default Game;

