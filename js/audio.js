// 壮大なRPGクラシック管弦楽（オーケストラ）シンセサイザー＆アニメ風ポップボイスシステム
// 賢佑くんの聴覚記憶（WMI 126）に心地よく響く、和音ストリングス＋ホルン＋ハープアルペジオの多層編成

const Sound = {
  ctx: null,
  bgmPlaying: false,
  bgmMode: 'title', // 'title' | 'map' | 'battle'
  bgmTimer: null,
  stepIndex: 0,
  voiceEnabled: true,
  preferredJaVoice: null,
  preferredEnVoice: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.initVoices();
  },

  initVoices() {
    if (!('speechSynthesis' in window)) return;
    const pickVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      // 日本語は自然でポップなニューラル音声（Nanami, Kyoko, Google 日本語など）を最優先
      this.preferredJaVoice =
        voices.find(v => v.lang.includes('ja') && (v.name.includes('Nanami') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang.includes('ja') && (v.name.includes('Google') || v.name.includes('Kyoko') || v.name.includes('Haruka'))) ||
        voices.find(v => v.lang.includes('ja'));

      this.preferredEnVoice =
        voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google US') || v.name.includes('Samantha'))) ||
        voices.find(v => v.lang.includes('en'));
    };
    pickVoices();
    window.speechSynthesis.onvoiceschanged = pickVoices;
  },

  toggleBGM() {
    this.init();
    this.bgmPlaying = !this.bgmPlaying;
    const btn = document.getElementById('bgm-toggle-btn');
    if (this.bgmPlaying) {
      if (btn) btn.textContent = '🔊 交響曲ON';
      this.startBGMLoop();
    } else {
      if (btn) btn.textContent = '🔇 音楽OFF';
      this.stopBGMLoop();
    }
  },

  ensureBGM(mode) {
    this.init();
    this.bgmMode = mode || this.bgmMode;
    if (!this.bgmPlaying) {
      this.bgmPlaying = true;
      const btn = document.getElementById('bgm-toggle-btn');
      if (btn) btn.textContent = '🔊 交響曲ON';
    }
    this.startBGMLoop();
  },

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    const btn = document.getElementById('voice-toggle-btn');
    if (btn) btn.textContent = this.voiceEnabled ? '🗣️ ボイスON' : '🔇 ボイスOFF';
  },

  setBGMMode(mode) {
    if (this.bgmMode === mode) return;
    this.bgmMode = mode;
    this.stepIndex = 0;
    if (this.bgmPlaying) {
      this.stopBGMLoop();
      this.startBGMLoop();
    }
  },

  // クラシック管弦楽風の豊かな楽器音色（ストリングス・ホルン・チェロ・ハープ）を合成
  playOrchestraNote(freq, duration, instrument = 'strings', volume = 0.08, delay = 0) {
    if (!freq || freq <= 0) return;
    this.init();
    const now = this.ctx.currentTime + delay;

    if (instrument === 'strings') {
      // 2つのわずかにデチューンしたオシレーター＋ローパスフィルタで温かい弦楽合奏を再現
      [-3.5, 3.5].forEach(detune => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(volume * 0.55, now + Math.min(0.08, duration * 0.3));
        gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
      });
    } else if (instrument === 'brass') {
      // 勇壮なホルン・トランペット系
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(2400, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } else if (instrument === 'harp') {
      // 輝くハープ＆チェレスタ音
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } else if (instrument === 'cello') {
      // 重厚なチェロ・コントラバス低音
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
  },

  startBGMLoop() {
    this.stopBGMLoop();

    // 音階定数 (Hz)
    const N = {
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00
    };

    // ① タイトル＆大航海シンフォニー（ハ長調〜イ短調〜ヘ長調〜ト長調の王道RPGオーケストラ序曲）
    const grandOverture = [
      { mel: N.C5, harm: N.E4, bass: N.C3, arp: N.G4 },
      { mel: N.G4, harm: N.C4, bass: 0,    arp: N.E5 },
      { mel: N.E5, harm: N.G4, bass: N.C3, arp: N.C5 },
      { mel: N.D5, harm: N.F4, bass: 0,    arp: N.G4 },
      { mel: N.C5, harm: N.E4, bass: N.A3, arp: N.E4 },
      { mel: N.A4, harm: N.C4, bass: 0,    arp: N.C5 },
      { mel: N.B4, harm: N.D4, bass: N.G3, arp: N.G4 },
      { mel: N.G4, harm: N.B3, bass: 0,    arp: N.D5 },

      { mel: N.A4, harm: N.C4, bass: N.F3, arp: N.F4 },
      { mel: N.C5, harm: N.F4, bass: 0,    arp: N.A4 },
      { mel: N.F5, harm: N.A4, bass: N.F3, arp: N.C5 },
      { mel: N.E5, harm: N.G4, bass: 0,    arp: N.C5 },
      { mel: N.D5, harm: N.F4, bass: N.G3, arp: N.B4 },
      { mel: N.B4, harm: N.D4, bass: 0,    arp: N.G4 },
      { mel: N.C5, harm: N.E4, bass: N.C3, arp: N.G4 },
      { mel: N.C5, harm: N.G4, bass: N.C3, arp: N.E5 }
    ];

    // ② バトル交響曲（ドヴォルザーク『新世界より』第4楽章＆RPGボス戦風の壮大シンフォニック曲）
    const battleSymphony = [
      { mel: N.E5, harm: N.B4, bass: N.A3, arp: N.E4 },
      { mel: 0,    harm: N.A4, bass: N.A3, arp: N.C5 },
      { mel: N.G5, harm: N.B4, bass: N.E3, arp: N.E5 },
      { mel: N.E5, harm: N.G4, bass: N.A3, arp: N.C5 },
      { mel: N.D5, harm: N.F4, bass: N.D3, arp: N.A4 },
      { mel: N.C5, harm: N.E4, bass: N.E3, arp: N.G4 },
      { mel: N.B4, harm: N.D4, bass: N.E3, arp: N.G4 },
      { mel: N.E5, harm: N.G4, bass: N.A3, arp: N.B4 },

      { mel: N.A4, harm: N.C4, bass: N.F3, arp: N.F4 },
      { mel: N.B4, harm: N.D4, bass: N.G3, arp: N.G4 },
      { mel: N.C5, harm: N.E4, bass: N.A3, arp: N.A4 },
      { mel: N.D5, harm: N.F4, bass: N.D3, arp: N.A4 },
      { mel: N.E5, harm: N.G4, bass: N.E3, arp: N.B4 },
      { mel: N.F5, harm: N.A4, bass: N.F3, arp: N.C5 },
      { mel: N.E5, harm: N.B4, bass: N.E3, arp: N.G4 },
      { mel: N.A4, harm: N.C4, bass: N.A3, arp: N.E4 }
    ];

    const isBattle = this.bgmMode === 'battle';
    const score = isBattle ? battleSymphony : grandOverture;
    const stepMs = isBattle ? 260 : 330;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || !this.ctx) return;
      const bar = score[this.stepIndex % score.length];

      // 主旋律（ストリングス＆ホルン）
      if (bar.mel) {
        this.playOrchestraNote(bar.mel, stepMs / 1000 * 1.4, 'strings', 0.065);
        this.playOrchestraNote(bar.mel, stepMs / 1000 * 1.1, 'brass', 0.05);
      }
      // 内声ハーモニー（ストリングス）
      if (bar.harm) {
        this.playOrchestraNote(bar.harm, stepMs / 1000 * 1.5, 'strings', 0.04);
      }
      // チェロ・コントラバス低音
      if (bar.bass) {
        this.playOrchestraNote(bar.bass, stepMs / 1000 * 1.6, 'cello', 0.075);
      }
      // ハープのきらめくアルペジオ
      if (bar.arp) {
        this.playOrchestraNote(bar.arp, 0.22, 'harp', 0.04, 0.12);
      }

      this.stepIndex++;
    }, stepMs);
  },

  stopBGMLoop() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  },

  // 効果音（SE）
  playSelect() {
    this.playOrchestraNote(587.33, 0.1, 'harp', 0.12);
    this.playOrchestraNote(880.00, 0.14, 'harp', 0.12, 0.04);
  },

  playMove() {
    this.playOrchestraNote(392.00, 0.12, 'brass', 0.14);
    this.playOrchestraNote(523.25, 0.16, 'harp', 0.14, 0.05);
  },

  playCapture() {
    this.playOrchestraNote(196.00, 0.18, 'cello', 0.22);
    this.playOrchestraNote(523.25, 0.2, 'brass', 0.18, 0.04);
    this.playOrchestraNote(783.99, 0.3, 'strings', 0.18, 0.1);
  },

  playGoodMove() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.playOrchestraNote(f, 0.24, 'harp', 0.14, idx * 0.06);
    });
  },

  playCheck() {
    this.playOrchestraNote(440.0, 0.18, 'brass', 0.2);
    this.playOrchestraNote(554.37, 0.18, 'brass', 0.2, 0.12);
    this.playOrchestraNote(659.25, 0.38, 'strings', 0.22, 0.24);
  },

  playVictory() {
    const notes = [
      { f: 523.25, d: 0.15, t: 0.0 },
      { f: 523.25, d: 0.15, t: 0.16 },
      { f: 523.25, d: 0.15, t: 0.32 },
      { f: 523.25, d: 0.4,  t: 0.48 },
      { f: 415.30, d: 0.32, t: 0.9 },
      { f: 466.16, d: 0.32, t: 1.24 },
      { f: 523.25, d: 0.22, t: 1.58 },
      { f: 466.16, d: 0.16, t: 1.82 },
      { f: 523.25, d: 0.75, t: 2.0 }
    ];
    notes.forEach(n => {
      this.playOrchestraNote(n.f, n.d, 'brass', 0.18, n.t);
      this.playOrchestraNote(n.f / 2, n.d, 'strings', 0.1, n.t);
    });
  },

  playLevelUp() {
    [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((f, i) => {
      this.playOrchestraNote(f, 0.26, 'harp', 0.16, i * 0.07);
    });
  },

  // ポップで感情豊かなアニメ風メロディチャイム＋明るい音声読み上げ
  playPopVoiceJingle(mood = 'happy') {
    const sets = {
      happy: [587.33, 783.99, 987.77, 1174.66],
      hero: [523.25, 659.25, 783.99, 1046.50],
      boss: [329.63, 311.13, 293.66, 246.94]
    };
    const notes = sets[mood] || sets.happy;
    notes.forEach((f, idx) => {
      this.playOrchestraNote(f, 0.12, 'harp', 0.1, idx * 0.045);
    });
  },

  // デジタルっぽさをなくすため、括弧や記号を除去して自然な話し言葉に整え、明るくポップなピッチ・テンポで発話
  cleanTextForPopSpeech(text) {
    return text
      .replace(/[「」『』【】（）()!！?？①②③🌟✨⚔️🛡️💡⏳🦅🐙🐍🐲👑🟨🏰⚠️]/g, ' ')
      .replace(/／/g, '、')
      .replace(/\s+/g, ' ')
      .trim();
  },

  speak(textJa, textEn = '', mood = 'happy') {
    if (!this.voiceEnabled) return;
    this.playPopVoiceJingle(mood);
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (textEn) {
      const utEn = new SpeechSynthesisUtterance(textEn);
      if (this.preferredEnVoice) utEn.voice = this.preferredEnVoice;
      utEn.lang = 'en-US';
      utEn.pitch = 1.25;
      utEn.rate = 1.1;
      window.speechSynthesis.speak(utEn);
    }

    if (textJa) {
      const cleanJa = this.cleanTextForPopSpeech(textJa);
      // 句点で区切ってテンポよく抑揚をつける
      const phrases = cleanJa.split(/[。！]/).filter(s => s.trim().length > 0);
      phrases.forEach((phrase, idx) => {
        const utJa = new SpeechSynthesisUtterance(phrase);
        if (this.preferredJaVoice) utJa.voice = this.preferredJaVoice;
        utJa.lang = 'ja-JP';
        // アニメの相棒キャラのような元気でポップな高めのトーン＆軽快なテンポ
        utJa.pitch = mood === 'boss' ? 0.85 : (1.35 + (idx % 2) * 0.08);
        utJa.rate = mood === 'boss' ? 1.05 : 1.18;
        window.speechSynthesis.speak(utJa);
      });
    }
  },

  speakCurrentAdvice() {
    const msg = document.getElementById('advisor-message').textContent;
    this.speak(msg, "Let's check the best logical move!", 'happy');
  }
};
