import { v4 as uuidv4 } from 'uuid';

export const getOrCreatePlayerId = (): string => {
  let id = localStorage.getItem('playerId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('playerId', id);
  }
  return id;
};

export const playSound = (src: string, isSoundOn: boolean, audioPool: HTMLAudioElement[]) => {
  if (!isSoundOn) return audioPool;
  
  const audio = new Audio(src);
  audio.volume = 0.05;
  audioPool.push(audio); 
  audio.play();

  audio.onended = () => {
    audioPool = audioPool.filter(a => a !== audio);
  };

  return audioPool;
};

export const playRandomSound = (
  sounds,
  category: keyof typeof sounds,
  isSoundOn: boolean,
  audioPool: HTMLAudioElement[]
) => {
  if (!isSoundOn || !sounds || !sounds[category] || sounds[category].length === 0) return audioPool;

  const randomIndex = Math.floor(Math.random() * sounds[category].length);
  const audio = sounds[category][randomIndex];

  audio.volume = 0.3;
  audioPool.push(audio);
  audio.play();

  audio.onended = () => {
    audioPool = audioPool.filter(a => a !== audio);
  };

  return audioPool;
};

export const loadSounds = async () => {
  const soundLibrary: { [key: string]: HTMLAudioElement[] } = {
    kill: [],
    death: [],
    hit: [],
    shoot: []
  };

  for (let i = 1; i <= 9; i++) {
    soundLibrary.kill.push(new Audio(`/sound/kill/kill${i}.mp3`));
  }

  for (let i = 1; i <= 7; i++) {
    soundLibrary.death.push(new Audio(`/sound/death/death${i}.mp3`));
  }

  for (let i = 1; i <= 2; i++) {
    soundLibrary.hit.push(new Audio(`/sound/hit/hit${i}.mp3`));
  }

  soundLibrary.shoot.push(new Audio(`/sound/shoot/shooooot.mp3`));
  soundLibrary.shoot.push(new Audio(`/sound/shoot/shooooot1.mp3`));
  soundLibrary.shoot.push(new Audio(`/sound/shoot/heal.mp3`));

  return soundLibrary;
};

export const sendTransaction = async (score, isDead = false) => {
  try {
    const playerId = getOrCreatePlayerId();

    const reqData = {
      id: playerId,
      score: `${score}`,
      isDead: isDead
    };    

    const response = await fetch("https://gameapi.monadassistant.xyz/set_score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqData) as any
    });

    if (!response.ok) {
      throw new Error(`Err: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Err:", error);
  }
};

export const mint = async () => {
  try {

    const playerId = getOrCreatePlayerId();
    const reqData = { id: playerId };

    const response = await fetch("https://gameapi.monadassistant.xyz/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(reqData)
    });

    if ( !response.ok ) {
      throw new Error(`Error mint: ${response.statusText}` );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Err:", error);
  }
}

export const getLeaderBoard = async () => {
  const response = await fetch("https://gameapi.monadassistant.xyz/get_top_10_scores",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error getting leaderboard: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};