/**
 * Advanced Sound System - BGM, Effects & Notifications
 * Uses Web Audio API to generate music and sound effects
 */

const SoundSystem = {
    audioContext: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    currentBgm: null,
    tickInterval: null,
    isPlaying: false,

    // Volume settings
    volumes: {
        master: 0.7,
        bgm: 0.3,
        sfx: 0.5
    },

    // BGM configurations - Extended
    bgmConfigs: {
        lofi: {
            name: 'Lo-Fi Beats',
            tempo: 75,
            chords: ['Dm7', 'G7', 'Cmaj7', 'Am7'],
            style: 'lofi'
        },
        ambient: {
            name: 'アンビエント',
            tempo: 60,
            chords: ['Cmaj7', 'Fmaj7', 'Am7', 'Em7'],
            style: 'ambient'
        },
        jazz: {
            name: 'ジャズピアノ',
            tempo: 85,
            chords: ['Dm7', 'G7', 'Cmaj7', 'Fmaj7'],
            style: 'jazz'
        },
        piano: {
            name: 'クラシックピアノ',
            tempo: 70,
            chords: ['C', 'Am', 'F', 'G'],
            style: 'piano'
        },
        nature: {
            name: '自然音',
            tempo: 0,
            style: 'nature'
        },
        rain: {
            name: '雨の音',
            tempo: 0,
            style: 'rain'
        },
        cafe: {
            name: 'カフェ',
            tempo: 0,
            style: 'cafe'
        },
        whitenoise: {
            name: 'ホワイトノイズ',
            tempo: 0,
            style: 'whitenoise'
        },
        ocean: {
            name: '波の音',
            tempo: 0,
            style: 'ocean'
        },
        fireplace: {
            name: '焚き火',
            tempo: 0,
            style: 'fireplace'
        }
    },

    breakBgmConfigs: {
        calm: {
            name: 'リラックス',
            tempo: 55,
            style: 'calm'
        },
        forest: {
            name: '森の音',
            style: 'forest'
        },
        ocean: {
            name: '波の音',
            style: 'ocean'
        }
    },

    // Note frequencies
    notes: {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
    },

    // Chord definitions
    chords: {
        'C': ['C4', 'E4', 'G4'],
        'Dm': ['D4', 'F4', 'A4'],
        'Em': ['E4', 'G4', 'B4'],
        'F': ['F4', 'A4', 'C5'],
        'G': ['G4', 'B4', 'D5'],
        'Am': ['A3', 'C4', 'E4'],
        'Cmaj7': ['C4', 'E4', 'G4', 'B4'],
        'Dm7': ['D4', 'F4', 'A4', 'C5'],
        'Em7': ['E4', 'G4', 'B4', 'D5'],
        'Fmaj7': ['F4', 'A4', 'C5', 'E5'],
        'G7': ['G3', 'B3', 'D4', 'F4'],
        'Am7': ['A3', 'C4', 'E4', 'G4']
    },

    // Initialize audio context
    init() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volumes.master;
            this.masterGain.connect(this.audioContext.destination);

            // Create BGM gain
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = this.volumes.bgm;
            this.bgmGain.connect(this.masterGain);

            // Create SFX gain
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.volumes.sfx;
            this.sfxGain.connect(this.masterGain);

            // Load saved volumes
            this.loadVolumes();

            console.log('Sound system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    },

    // Resume audio context (required after user interaction)
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    },

    // Load saved volumes
    loadVolumes() {
        const saved = Storage.get('soundVolumes');
        if (saved) {
            this.volumes = { ...this.volumes, ...saved };
            this.masterGain.gain.value = this.volumes.master;
            this.bgmGain.gain.value = this.volumes.bgm;
            this.sfxGain.gain.value = this.volumes.sfx;
        }
    },

    // Save volumes
    saveVolumes() {
        Storage.set('soundVolumes', this.volumes);
    },

    // Set volume
    setVolume(type, value) {
        this.volumes[type] = value;

        switch (type) {
            case 'master':
                if (this.masterGain) this.masterGain.gain.value = value;
                break;
            case 'bgm':
                if (this.bgmGain) this.bgmGain.gain.value = value;
                break;
            case 'sfx':
                if (this.sfxGain) this.sfxGain.gain.value = value;
                break;
        }

        this.saveVolumes();
    },

    // Create oscillator with envelope
    createTone(frequency, startTime, duration, type = 'sine', gainNode = this.sfxGain) {
        const osc = this.audioContext.createOscillator();
        const envGain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        osc.connect(envGain);
        envGain.connect(gainNode);

        // ADSR envelope
        const attack = 0.02;
        const decay = 0.1;
        const sustain = 0.3;
        const release = 0.3;

        envGain.gain.setValueAtTime(0, startTime);
        envGain.gain.linearRampToValueAtTime(0.5, startTime + attack);
        envGain.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
        envGain.gain.setValueAtTime(sustain, startTime + duration - release);
        envGain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);

        return osc;
    },

    // Play a chord
    playChord(chordName, startTime, duration) {
        const notes = this.chords[chordName];
        if (!notes) return;

        notes.forEach((note, i) => {
            const freq = this.notes[note];
            if (freq) {
                this.createTone(freq, startTime + (i * 0.01), duration, 'sine', this.bgmGain);
            }
        });
    },

    // === SOUND EFFECTS ===

    // Tick tock sound (for countdown)
    playTick() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        // Create tick sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    },

    // Tock sound (alternate tick)
    playTock() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.08);
    },

    // Start countdown ticking
    startCountdownTick(callback) {
        if (this.tickInterval) return;

        let isTick = true;
        this.tickInterval = setInterval(() => {
            if (isTick) {
                this.playTick();
            } else {
                this.playTock();
            }
            isTick = !isTick;
            if (callback) callback(isTick);
        }, 500);
    },

    // Stop countdown ticking
    stopCountdownTick() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    },

    // Session complete sound (work done)
    playWorkComplete() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.12);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    },

    // Break complete sound
    playBreakComplete() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const notes = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5

        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.15);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    },

    // Start session sound
    playSessionStart() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;

        [261.63, 329.63, 392.00].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            const startTime = now + (i * 0.08);
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    },

    // Button click sound
    playClick() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 1000;

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    },

    // Success/achievement sound
    playSuccess() {
        this.init();
        this.resume();

        const now = this.audioContext.currentTime;
        const melody = [
            { freq: 523.25, time: 0, dur: 0.15 },
            { freq: 659.25, time: 0.12, dur: 0.15 },
            { freq: 783.99, time: 0.24, dur: 0.15 },
            { freq: 1046.50, time: 0.36, dur: 0.4 }
        ];

        melody.forEach(note => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = note.freq;

            const startTime = now + note.time;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
            gain.gain.setValueAtTime(0.4, startTime + note.dur - 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + note.dur);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + note.dur);
        });
    },

    // === BGM GENERATION ===

    // Generate Lo-Fi BGM
    generateLoFiBGM() {
        if (!this.audioContext) return;

        const chordProgression = ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Fmaj7', 'Dm7', 'Em7', 'Am7'];
        const tempo = 72;
        const beatDuration = 60 / tempo;
        const measureDuration = beatDuration * 4;

        let currentTime = this.audioContext.currentTime;
        const loopLength = measureDuration * 8; // 8 measures = ~26 seconds

        // Schedule chords with vinyl warmth
        chordProgression.forEach((chord, i) => {
            const chordTime = currentTime + (i * measureDuration);
            const notes = this.chords[chord];

            if (notes) {
                notes.forEach((note, j) => {
                    const freq = this.notes[note];
                    if (!freq) return;

                    const noteTime = chordTime + (j * 0.05);

                    const osc = this.audioContext.createOscillator();
                    const filter = this.audioContext.createBiquadFilter();
                    const gain = this.audioContext.createGain();

                    // Warm triangle wave
                    osc.type = 'triangle';
                    osc.frequency.value = freq;

                    // Vinyl warmth - muffled low pass
                    filter.type = 'lowpass';
                    filter.frequency.value = 600 + Math.random() * 200;
                    filter.Q.value = 0.5;

                    // Soft envelope with swing feel
                    const swing = (j % 2) * 0.02;
                    gain.gain.setValueAtTime(0, noteTime + swing);
                    gain.gain.linearRampToValueAtTime(0.12, noteTime + swing + 0.08);
                    gain.gain.setValueAtTime(0.1, noteTime + measureDuration - 0.4);
                    gain.gain.linearRampToValueAtTime(0, noteTime + measureDuration);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.bgmGain);

                    osc.start(noteTime + swing);
                    osc.stop(noteTime + measureDuration);
                });
            }

            // Add subtle bass line
            const bassNotes = { 'Dm7': 'D3', 'G7': 'G3', 'Cmaj7': 'C3', 'Am7': 'A3', 'Fmaj7': 'F3', 'Em7': 'E3' };
            const bassNote = bassNotes[chord];
            if (bassNote && this.notes[bassNote]) {
                for (let beat = 0; beat < 4; beat++) {
                    if (beat === 0 || beat === 2) {
                        const bassTime = chordTime + (beat * beatDuration);
                        const bassOsc = this.audioContext.createOscillator();
                        const bassFilter = this.audioContext.createBiquadFilter();
                        const bassGain = this.audioContext.createGain();

                        bassOsc.type = 'sine';
                        bassOsc.frequency.value = this.notes[bassNote] / 2;

                        bassFilter.type = 'lowpass';
                        bassFilter.frequency.value = 200;

                        bassGain.gain.setValueAtTime(0, bassTime);
                        bassGain.gain.linearRampToValueAtTime(0.2, bassTime + 0.05);
                        bassGain.gain.exponentialRampToValueAtTime(0.01, bassTime + beatDuration * 1.5);

                        bassOsc.connect(bassFilter);
                        bassFilter.connect(bassGain);
                        bassGain.connect(this.bgmGain);

                        bassOsc.start(bassTime);
                        bassOsc.stop(bassTime + beatDuration * 2);
                    }
                }
            }

            // Add lo-fi drum pattern
            for (let beat = 0; beat < 4; beat++) {
                const beatTime = chordTime + (beat * beatDuration);

                // Kick on 1 and 3
                if (beat === 0 || beat === 2) {
                    this.scheduleKick(beatTime);
                }

                // Snare/rim on 2 and 4
                if (beat === 1 || beat === 3) {
                    this.scheduleSnare(beatTime);
                }

                // Hi-hat on every beat with swing
                const swing = (beat % 2) * 0.03;
                this.scheduleHiHat(beatTime + swing, beat % 2 === 1);
                this.scheduleHiHat(beatTime + beatDuration / 2 + swing, true);
            }
        });

        return loopLength;
    },

    // Schedule kick drum
    scheduleKick(time) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + 0.15);
    },

    // Schedule snare/rim
    scheduleSnare(time) {
        // Noise burst
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.1);
    },

    // Schedule hi-hat
    scheduleHiHat(time, soft = false) {
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(soft ? 0.05 : 0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.05);
    },

    // Generate ambient BGM
    generateAmbientBGM() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 16; // 16 seconds loop

        // Create ambient pad
        ['C4', 'E4', 'G4', 'B4'].forEach((note, i) => {
            const freq = this.notes[note];

            const osc = this.audioContext.createOscillator();
            const filter = this.audioContext.createBiquadFilter();
            const gain = this.audioContext.createGain();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            // LFO for subtle vibrato
            lfo.type = 'sine';
            lfo.frequency.value = 0.5 + (i * 0.1);
            lfoGain.gain.value = 3;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            filter.type = 'lowpass';
            filter.frequency.value = 500;

            // Very slow fade in/out
            const offset = i * 2;
            gain.gain.setValueAtTime(0, now + offset);
            gain.gain.linearRampToValueAtTime(0.08, now + offset + 4);
            gain.gain.setValueAtTime(0.08, now + duration - 4);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            lfo.start(now);
            osc.start(now + offset);
            osc.stop(now + duration);
            lfo.stop(now + duration);
        });

        return duration;
    },

    // Generate nature/white noise
    generateNatureSound() {
        if (!this.audioContext) return;

        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Generate pink noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
            b6 = white * 0.115926;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.3;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate rain sound
    generateRainSound() {
        if (!this.audioContext) return;

        const bufferSize = 4 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

        // Stereo rain effect
        for (let channel = 0; channel < 2; channel++) {
            const output = noiseBuffer.getChannelData(channel);
            for (let i = 0; i < bufferSize; i++) {
                // Random raindrops with varying intensity
                const rain = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.8 : 0;
                const ambientRain = (Math.random() * 2 - 1) * 0.02;
                output[i] = rain + ambientRain;
            }
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000;

        const convolver = this.audioContext.createConvolver();

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate cafe ambient sound
    generateCafeSound() {
        if (!this.audioContext) return;

        const bufferSize = 4 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const output = noiseBuffer.getChannelData(channel);
            let b0 = 0, b1 = 0, b2 = 0;

            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                // Brownian noise for low rumble
                b0 = 0.99765 * b0 + white * 0.0990460;
                b1 = 0.96300 * b1 + white * 0.2965164;
                b2 = 0.57000 * b2 + white * 1.0526913;
                output[i] = (b0 + b1 + b2) * 0.02;

                // Occasional clinking sounds
                if (Math.random() < 0.00005) {
                    output[i] += (Math.random() * 2 - 1) * 0.3;
                }
            }
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.35;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate fireplace crackling sound
    generateFireplaceSound() {
        if (!this.audioContext) return;

        const bufferSize = 4 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const output = noiseBuffer.getChannelData(channel);

            for (let i = 0; i < bufferSize; i++) {
                // Base crackle
                let sample = (Math.random() * 2 - 1) * 0.01;

                // Random pops and crackles
                if (Math.random() < 0.001) {
                    sample += (Math.random() * 2 - 1) * 0.5 * Math.exp(-Math.random() * 5);
                }
                if (Math.random() < 0.0005) {
                    sample += (Math.random() * 2 - 1) * 0.8;
                }

                output[i] = sample;
            }
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        // Two filters for warm sound
        const lowpass = this.audioContext.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 1500;

        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 200;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.5;

        noise.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate ocean waves
    generateOceanSound() {
        if (!this.audioContext) return;

        const bufferSize = 6 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
        const waveLength = Math.floor(this.audioContext.sampleRate * 4); // 4 second waves

        for (let channel = 0; channel < 2; channel++) {
            const output = noiseBuffer.getChannelData(channel);

            for (let i = 0; i < bufferSize; i++) {
                // Wave envelope
                const wavePos = (i % waveLength) / waveLength;
                const waveEnvelope = Math.sin(wavePos * Math.PI) * 0.5 + 0.3;

                // White noise modulated by wave
                const white = Math.random() * 2 - 1;
                output[i] = white * waveEnvelope * 0.15;
            }
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.4;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate white noise
    generateWhiteNoise() {
        if (!this.audioContext) return;

        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 8000;

        const gain = this.audioContext.createGain();
        gain.gain.value = 0.15;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start();

        return { source: noise, gain: gain };
    },

    // Generate jazz piano - longer loop
    generateJazzBGM() {
        if (!this.audioContext) return;

        const chordProgression = ['Dm7', 'G7', 'Cmaj7', 'Am7', 'Fmaj7', 'Dm7', 'G7', 'Cmaj7'];
        const tempo = 85;
        const beatDuration = 60 / tempo;
        const measureDuration = beatDuration * 4;

        let currentTime = this.audioContext.currentTime;
        const loopLength = measureDuration * 8; // 8 measures = ~22 seconds

        chordProgression.forEach((chord, i) => {
            const chordTime = currentTime + (i * measureDuration);
            const notes = this.chords[chord];

            if (notes) {
                // Arpeggiated jazz style
                notes.forEach((note, j) => {
                    const freq = this.notes[note];
                    const noteTime = chordTime + (j * 0.1);

                    const osc = this.audioContext.createOscillator();
                    const filter = this.audioContext.createBiquadFilter();
                    const gain = this.audioContext.createGain();

                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    filter.type = 'lowpass';
                    filter.frequency.value = 1200;

                    gain.gain.setValueAtTime(0, noteTime);
                    gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.05);
                    gain.gain.setValueAtTime(0.12, noteTime + measureDuration - 0.5);
                    gain.gain.linearRampToValueAtTime(0, noteTime + measureDuration);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.bgmGain);

                    osc.start(noteTime);
                    osc.stop(noteTime + measureDuration);
                });
            }
        });

        return loopLength;
    },

    // Generate piano - longer loop
    generatePianoBGM() {
        if (!this.audioContext) return;

        const chordProgression = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'];
        const tempo = 70;
        const beatDuration = 60 / tempo;
        const measureDuration = beatDuration * 4;

        let currentTime = this.audioContext.currentTime;
        const loopLength = measureDuration * 8; // ~27 seconds

        chordProgression.forEach((chord, i) => {
            const chordTime = currentTime + (i * measureDuration);
            const notes = this.chords[chord];

            if (notes) {
                notes.forEach((note, j) => {
                    const freq = this.notes[note];
                    const noteTime = chordTime + (j * 0.08);

                    const osc = this.audioContext.createOscillator();
                    const filter = this.audioContext.createBiquadFilter();
                    const gain = this.audioContext.createGain();

                    osc.type = 'triangle';
                    osc.frequency.value = freq;

                    filter.type = 'lowpass';
                    filter.frequency.value = 1000;

                    gain.gain.setValueAtTime(0, noteTime);
                    gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.08, noteTime + 1);
                    gain.gain.linearRampToValueAtTime(0, noteTime + measureDuration);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.bgmGain);

                    osc.start(noteTime);
                    osc.stop(noteTime + measureDuration);
                });
            }
        });

        return loopLength;
    },

    // Start BGM - Extended support
    startBGM(type = 'lofi', isBreak = false) {
        this.init();
        this.resume();
        this.stopBGM();

        this.isPlaying = true;

        // Continuous noise-based BGMs
        const continuousTypes = ['nature', 'rain', 'cafe', 'whitenoise', 'ocean', 'fireplace'];

        if (continuousTypes.includes(type)) {
            switch (type) {
                case 'nature':
                    this.currentBgm = this.generateNatureSound();
                    break;
                case 'rain':
                    this.currentBgm = this.generateRainSound();
                    break;
                case 'cafe':
                    this.currentBgm = this.generateCafeSound();
                    break;
                case 'whitenoise':
                    this.currentBgm = this.generateWhiteNoise();
                    break;
                case 'ocean':
                    this.currentBgm = this.generateOceanSound();
                    break;
                case 'fireplace':
                    this.currentBgm = this.generateFireplaceSound();
                    break;
            }
            return; // Continuous sounds don't need looping
        }

        // Looping music BGMs - with seamless overlap
        const playLoop = () => {
            if (!this.isPlaying) return;

            let loopDuration;

            if (isBreak) {
                loopDuration = this.generateAmbientBGM();
            } else {
                switch (type) {
                    case 'lofi':
                        loopDuration = this.generateLoFiBGM();
                        break;
                    case 'ambient':
                        loopDuration = this.generateAmbientBGM();
                        break;
                    case 'jazz':
                        loopDuration = this.generateJazzBGM();
                        break;
                    case 'piano':
                        loopDuration = this.generatePianoBGM();
                        break;
                    default:
                        loopDuration = this.generateLoFiBGM();
                }
            }

            // Schedule next loop well before current ends for seamless playback
            // Start next loop 3 seconds before current ends
            const overlapTime = Math.min(3, loopDuration * 0.15);
            this.bgmTimeout = setTimeout(playLoop, (loopDuration - overlapTime) * 1000);
        };

        playLoop();
    },

    // Stop BGM
    stopBGM() {
        this.isPlaying = false;

        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }

        if (this.currentBgm) {
            try {
                this.currentBgm.source.stop();
            } catch (e) { }
            this.currentBgm = null;
        }
    },

    // Fade out BGM
    fadeOutBGM(duration = 2) {
        if (this.bgmGain) {
            const now = this.audioContext.currentTime;
            this.bgmGain.gain.linearRampToValueAtTime(0, now + duration);

            setTimeout(() => {
                this.stopBGM();
                this.bgmGain.gain.value = this.volumes.bgm;
            }, duration * 1000);
        }
    }
};

// Initialize on first user interaction
document.addEventListener('click', () => {
    SoundSystem.init();
}, { once: true });

document.addEventListener('keydown', () => {
    SoundSystem.init();
}, { once: true });
