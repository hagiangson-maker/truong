
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneOsc: OscillatorNode | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2; // Master volume
    masterGain.connect(audioCtx.destination);
    
    // Start dark atmosphere drone
    startDrone();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const startDrone = () => {
    if (!audioCtx || !masterGain || droneOsc) return;
    droneOsc = audioCtx.createOscillator();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(50, audioCtx.currentTime);
    const droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.05;
    
    // Lowpass filter for dark ambience
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    droneOsc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
};

const createNoiseBuffer = () => {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

// --- SFX Functions ---

export const playShoot = (isMagnum: boolean = false) => {
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = isMagnum ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(isMagnum ? 150 : 200, t);
  osc.frequency.exponentialRampToValueAtTime(0.01, t + (isMagnum ? 0.3 : 0.15));
  
  gain.gain.setValueAtTime(isMagnum ? 0.5 : 0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + (isMagnum ? 0.3 : 0.15));
  
  // Noise burst for "pop"
  const noise = audioCtx.createBufferSource();
  noise.buffer = createNoiseBuffer();
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.4, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

  osc.connect(gain);
  gain.connect(masterGain);
  noise.connect(noiseGain);
  noiseGain.connect(masterGain);
  
  osc.start();
  osc.stop(t + 0.3);
  noise.start();
  noise.stop(t + 0.1);
};

export const playZombieHit = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(50, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 0.1);
};

export const playGemPickup = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.1);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 0.1);
};

export const playCoinPickup = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    // Two tones for coin "ching"
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.setValueAtTime(3000, t + 0.05);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 0.2);
};

export const playExplosion = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    const gain = audioCtx.createGain();
    
    // Lowpass filter for "boom"
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(10, t + 1);

    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start();
    noise.stop(t + 1);
};

export const playLevelUp = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    // Major Arpeggio
    [440, 554, 659, 880].forEach((freq, i) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        gain.gain.setValueAtTime(0.2, t + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(masterGain!);
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.5);
    });
};

export const playSkillSound = (type: 'freeze' | 'shock' | 'shield' | 'electric') => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'freeze') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.linearRampToValueAtTime(500, t + 1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 1);
    } else if (type === 'shock') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.linearRampToValueAtTime(300, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
    } else if (type === 'electric') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(1000, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
    } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
    }

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 1);
};

export const playPlayerHit = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 0.2);
};

export const playGameover = () => {
    if (!audioCtx || !masterGain) return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 2);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0, t + 2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(t + 2);
};