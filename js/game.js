// ゲームメインコントローラー（タイトル画面・オープニング物語・VSバトル導入・段階的章解放・途中セーブ完全対応）

const SAVE_KEY = 'kensuke_chess_odyssey_v2';

function getDefaultState() {
  return {
    hasStarted: false,
    level: 1,
    exp: 0,
    totalExp: 0,
    gold: 200,
    wins: 0,
    goodMovesCount: 0,
    puzzlesCleared: [],
    clearedStages: [],
    currentStageId: 1,
    unlockedCrew: ['tako', 'washi'],
    currentAdvisorIndex: 0,
    items: {
      undo: 5,
      eye: 3
    },
    ownedThemes: ['default'],
    activeTheme: 'default',
    redeemedTickets: [],
    customRewards: [],
    // 物語・バトルの途中セーブデータ
    savedMatch: null,
    lastSavedAt: null
  };
}

let State = getDefaultState();

function hasExistingSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed && parsed.hasStarted === true;
  } catch (e) {
    return false;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      State = Object.assign(getDefaultState(), parsed);
    }
  } catch (e) {
    console.warn('Save load failed', e);
  }
}

function saveState(recordMatchSnapshot = false) {
  try {
    State.hasStarted = true;
    const now = new Date();
    State.lastSavedAt = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (recordMatchSnapshot && Game && Game.engine) {
      State.savedMatch = {
        mode: Game.mode,
        stageId: Game.currentStage ? Game.currentStage.id : 1,
        puzzleId: Game.currentPuzzle ? Game.currentPuzzle.id : null,
        board: Game.engine.cloneBoard(),
        turn: Game.engine.turn,
        castling: { ...Game.engine.castling },
        capturedByPlayer: [...Game.capturedByPlayer],
        capturedByEnemy: [...Game.capturedByEnemy],
        comboCount: Game.comboCount
      };
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(State));
    UI.refreshTitleContinueButton();
  } catch (e) {
    console.warn('Save failed', e);
  }
}

function getTitleForLevel(lv) {
  if (lv >= 15) return '👑 グランド・チェス・海賊王';
  if (lv >= 10) return '🦁 新世界の四皇タクティシャン';
  if (lv >= 7)  return '🦅 蒼天の論理マスター';
  if (lv >= 4)  return '🐙 深思考のキャプテン航海士';
  return '🏴‍☠️ 見習いチェス航海士';
}

function getExpNeeded(lv) {
  return lv * 100;
}

// パーティクル演出システム
const FX = {
  canvas: null,
  ctx: null,
  particles: [],

  init() {
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(() => this.loop());
  },

  burst(x, y, color = '#f59e0b', count = 36) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 5 + Math.random() * 6,
        color,
        alpha: 1,
        life: 40 + Math.random() * 25
      });
    }
  },

  confetti() {
    const colors = ['#f59e0b', '#22c55e', '#38bdf8', '#ef4444', '#a855f7', '#fef08a'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: 3 + Math.random() * 5,
        size: 7 + Math.random() * 6,
        color: colors[i % colors.length],
        alpha: 1,
        life: 90 + Math.random() * 40
      });
    }
  },

  showCutin(icon, sub, main) {
    const el = document.getElementById('cutin-overlay');
    document.getElementById('cutin-icon').textContent = icon;
    document.getElementById('cutin-sub').textContent = sub;
    document.getElementById('cutin-main').textContent = main;
    el.classList.remove('hidden');
    void el.offsetWidth;
    setTimeout(() => {
      el.classList.add('hidden');
    }, 1650);
  },

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      p.alpha = Math.max(0, p.life / 50);

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (p.life <= 0) this.particles.splice(i, 1);
    }
    requestAnimationFrame(() => this.loop());
  }
};

// UI制御
const UI = {
  initTitleVisuals() {
    // タイトル画面の3Dチェス駒＆キャラクターアニメーション配置
    const f1 = document.getElementById('title-float-1');
    const f2 = document.getElementById('title-float-2');
    const f3 = document.getElementById('title-float-3');
    if (f1) f1.innerHTML = Sprites.getPiece3DSVG('n', 'w');
    if (f2) f2.innerHTML = Sprites.getPiece3DSVG('k', 'w');
    if (f3) f3.innerHTML = Sprites.getPiece3DSVG('q', 'b');

    const stage = document.getElementById('title-chars-stage');
    if (stage) {
      stage.innerHTML = `
        <div class="title-char-unit">${Sprites.getCharacterAvatarSVG('tako')}<span>参謀タコ</span></div>
        <div class="title-char-unit main-hero">${Sprites.getCharacterAvatarSVG('kensuke')}<span>キャプテン賢佑</span></div>
        <div class="title-char-unit">${Sprites.getCharacterAvatarSVG('washi')}<span>蒼天のワシ</span></div>
        <div class="title-char-unit">${Sprites.getPiece3DSVG('n', 'w')}<span>3Dナイト(馬)</span></div>
      `;
    }

    const topAv = document.getElementById('top-player-avatar');
    if (topAv) topAv.innerHTML = Sprites.getCharacterAvatarSVG('kensuke');

    this.refreshTitleContinueButton();
  },

  refreshTitleContinueButton() {
    const btn = document.getElementById('btn-continue-game');
    const summary = document.getElementById('continue-save-summary');
    if (!btn || !summary) return;

    if (hasExistingSave()) {
      loadState();
      btn.disabled = false;
      btn.classList.remove('disabled');
      const maxUnlocked = Math.min(STAGES_DATA.length, State.clearedStages.length + 1);
      const stTitle = STAGES_DATA[maxUnlocked - 1].title.split('：')[0];
      const matchNote = State.savedMatch ? '（対局途中データあり）' : '';
      summary.textContent = `Lv.${State.level} ／ ${stTitle}まで解放 ／ ${State.gold}G ${matchNote}`;
    } else {
      btn.disabled = true;
      btn.classList.add('disabled');
      summary.textContent = 'まだセーブデータがありません（「最初から」を選んでね）';
    }
  },

  switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === screenId);
    });

    if (screenId === 'battle') {
      Sound.setBGMMode('battle');
    } else {
      Sound.setBGMMode('map');
    }

    if (screenId === 'map') this.renderMap();
    if (screenId === 'puzzle') this.renderPuzzles();
    if (screenId === 'shop') this.renderShop();
    this.updateTopBar();
  },

  openModal(id) {
    if (id === 'status-modal') this.renderStatusModal();
    if (id === 'guide-modal') this.renderGuideModal();
    document.getElementById(id).classList.remove('hidden');
  },

  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },

  updateTopBar() {
    const needed = getExpNeeded(State.level);
    const pct = Math.min(100, Math.round((State.exp / needed) * 100));
    document.getElementById('top-title').textContent = getTitleForLevel(State.level);
    document.getElementById('top-lv').textContent = `Lv.${State.level}`;
    document.getElementById('top-exp-bar').style.width = `${pct}%`;
    document.getElementById('top-exp-text').textContent = `EXP ${State.exp} / ${needed}`;
    document.getElementById('top-gold').textContent = State.gold.toLocaleString();

    document.getElementById('item-count-undo').textContent = State.items.undo;
    document.getElementById('item-count-eye').textContent = State.items.eye;
  },

  // ★重要：前章をクリアして初めて次の章（次の目的・課題）が分かる段階表示システム
  renderMap() {
    const crewWrap = document.getElementById('map-crew-list');
    crewWrap.innerHTML = CREW_DATA.filter(c => State.unlockedCrew.includes(c.id))
      .map(c => `<div class="crew-mini-badge"><div class="mini-svg-icon">${Sprites.getCharacterAvatarSVG(c.id)}</div><span>${c.name}</span></div>`)
      .join('');

    // 解放されている最大章番号を計算（最初は第1章のみ！第1章をクリアすると第2章が出現）
    const maxUnlockedStageId = Math.min(
      STAGES_DATA.length,
      (State.clearedStages.length > 0 ? Math.max(...State.clearedStages) + 1 : 1)
    );

    const currentGoalStage = STAGES_DATA.find(s => s.id === maxUnlockedStageId) || STAGES_DATA[0];
    const bannerEl = document.getElementById('map-current-goal-banner');
    if (State.clearedStages.includes(STAGES_DATA.length)) {
      bannerEl.innerHTML = `👑 <strong>全6章完全制覇おめでとう！！</strong> いつでも好きな章のボスと再戦してゴールドやEXPを稼げるぞ！`;
    } else {
      bannerEl.innerHTML = `🧭 <strong>現在の目的地：${currentGoalStage.title}</strong><br>${currentGoalStage.missionGoal}`;
    }

    // まだ解放されていない未来の章（第2章〜第6章）は最初から掲載せず、解放済みの章だけを順番に表示！
    const visibleStages = STAGES_DATA.filter(st => st.id <= maxUnlockedStageId);

    const grid = document.getElementById('stage-grid');
    let html = visibleStages.map(st => {
      const isCleared = State.clearedStages.includes(st.id);
      const isCurrentTarget = st.id === maxUnlockedStageId && !isCleared;
      const crewReward = st.unlockCrewId ? CREW_DATA.find(c => c.id === st.unlockCrewId) : null;

      return `
        <div class="stage-card unlocked ${isCleared ? 'cleared' : ''} ${isCurrentTarget ? 'current-target-stage' : ''}">
          <div>
            <div class="stage-top">
              <div class="stage-boss-icon">${Sprites.getCharacterAvatarSVG(st.bossKey)}</div>
              <div>
                <div class="stage-num">
                  CHAPTER ${st.id}
                  ${isCleared ? '<span class="cleared-pill">✅ 攻略完了！</span>' : '<span class="now-pill">🔥 現在の挑戦課題！</span>'}
                </div>
                <div class="stage-title">${st.title}</div>
                <div class="stage-boss-name">敵ボス: ${st.bossName}（${st.bossTitle}）</div>
              </div>
            </div>
            <div class="stage-mission-box">${st.missionGoal}</div>
            <p class="stage-desc">${st.desc}</p>
          </div>
          <div>
            <div class="stage-rewards">
              <div>🎁 突破報酬: <strong>+${st.rewardExp} EXP / +${st.rewardGold} G</strong></div>
              ${crewReward ? `<div>🤝 仲間解放: <strong>${crewReward.icon} ${crewReward.name}</strong></div>` : ''}
            </div>
            <button class="stage-play-btn" style="margin-top:10px;" onclick="Game.launchStageBattleIntro(${st.id})">
              ⚔️ ${isCleared ? 'もう一度この章で戦う！' : 'この章のバトルへ出撃する！'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 次の章がまだ未解放の場合、「この章をクリアすると次の未知の海域が解放！」というミステリー案内カードを1つだけ添える
    if (maxUnlockedStageId < STAGES_DATA.length) {
      html += `
        <div class="stage-card mystery-next-card">
          <div class="mystery-Compass">🧭</div>
          <h3>🔒 次の海域（第${maxUnlockedStageId + 1}章）は霧の中…！</h3>
          <p>まずは現在挑戦中の<strong>「第${maxUnlockedStageId}章」</strong>のボスをチェックメイトで突破しよう！<br>勝利すると羅針盤が輝き、次の章の物語と新たな課題が明らかになるぞ！</p>
        </div>
      `;
    }

    grid.innerHTML = html;
  },

  renderPuzzles() {
    const grid = document.getElementById('puzzle-grid');
    grid.innerHTML = PUZZLES_DATA.map(pz => {
      const done = State.puzzlesCleared.includes(pz.id);
      return `
        <div class="puzzle-card">
          <div>
            <div style="color:#a855f7; font-weight:900; font-size:0.82rem;">${pz.difficulty} ${done ? '✅ 突破済！' : ''}</div>
            <h3 style="margin:6px 0; font-size:1.05rem;">${pz.title}</h3>
            <p style="font-size:0.84rem; color:#cbd5e1;">${pz.hintText}</p>
          </div>
          <div>
            <div style="font-size:0.82rem; margin-bottom:8px;">🎁 報酬: <strong>+${pz.rewardExp} EXP / +${pz.rewardGold} G</strong></div>
            <button class="stage-play-btn" onclick="Game.startPuzzle(${pz.id})">🧩 この論理パズルに挑戦！</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderShop() {
    const shopGrid = document.getElementById('shop-items-grid');
    shopGrid.innerHTML = SHOP_ITEMS.map(item => {
      const isThemeOwned = item.type === 'theme' && State.ownedThemes.includes(item.themeClass);
      const isActiveTheme = item.type === 'theme' && State.activeTheme === item.themeClass;

      let btnHtml = '';
      if (item.type === 'theme' && isThemeOwned) {
        btnHtml = `<button class="primary-btn" style="width:100%" onclick="Game.equipTheme('${item.themeClass}')">
          ${isActiveTheme ? '✨ 現在使用中' : '🎨 この盤面に切り替える'}
        </button>`;
      } else {
        btnHtml = `<button class="primary-btn" style="width:100%" onclick="Game.buyShopItem('${item.id}')">
          🪙 ${item.price} G で購入する
        </button>`;
      }

      return `
        <div class="shop-card">
          <div>
            <div style="font-size:2.2rem;">${item.icon}</div>
            <h3 style="margin:6px 0;">${item.name}</h3>
            <p style="font-size:0.84rem; color:#cbd5e1;">${item.desc}</p>
          </div>
          <div>${btnHtml}</div>
        </div>
      `;
    }).join('');

    const allRealRewards = [...REAL_REWARDS_DEFAULT, ...(State.customRewards || [])];
    const realGrid = document.getElementById('real-rewards-grid');
    realGrid.innerHTML = allRealRewards.map(rw => `
      <div class="shop-card real-card">
        <div>
          <div style="font-size:2.4rem;">${rw.icon}</div>
          <h3 style="margin:6px 0; color:#fcd34d;">${rw.name}</h3>
          <p style="font-size:0.84rem; color:#e2e8f0;">${rw.desc}</p>
        </div>
        <button class="stage-play-btn" onclick="Game.redeemRealReward('${rw.id}', '${rw.name}', ${rw.price}, '${rw.icon}')">
          🎁 ${rw.price} G でごほうび交換！
        </button>
      </div>
    `).join('');

    const ticketList = document.getElementById('redeemed-tickets-list');
    if (State.redeemedTickets.length === 0) {
      ticketList.innerHTML = `<div style="color:#94a3b8; font-size:0.9rem;">まだ交換したチケットはありません。バトルや好手でゴールドを貯めて交換しよう！</div>`;
    } else {
      ticketList.innerHTML = State.redeemedTickets.map((tk, idx) => `
        <div class="ticket-item">
          <div style="font-size:1.3rem;">${tk.icon} ${tk.name}</div>
          <div style="font-size:0.78rem; margin-top:4px;">獲得日: ${tk.date} ／ 状態: ${tk.used ? '✅ 使用済み' : '🌟 未使用（お父さん・お母さんに見せよう！）'}</div>
          ${!tk.used ? `<button class="mini-btn" style="margin-top:6px; background:#b45309;" onclick="Game.markTicketUsed(${idx})">🎫 使ったらチェック</button>` : ''}
        </div>
      `).join('');
    }
  },

  renderStatusModal() {
    const lvBonus = (State.level - 1) * 6;
    const logicVal = 151 + lvBonus;
    const memVal = 126 + lvBonus;
    const tacVal = 110 + lvBonus + State.goodMovesCount * 2;
    const visVal = 100 + lvBonus + State.puzzlesCleared.length * 5;
    const cmdVal = 115 + lvBonus + State.wins * 5;

    document.getElementById('status-player-svg').innerHTML = Sprites.getCharacterAvatarSVG('kensuke');
    document.getElementById('st-title').textContent = getTitleForLevel(State.level);
    document.getElementById('st-lv').textContent = State.level;
    document.getElementById('st-total-exp').textContent = State.totalExp;

    document.getElementById('stat-val-logic').textContent = logicVal;
    document.getElementById('stat-val-memory').textContent = memVal;
    document.getElementById('stat-val-tactics').textContent = tacVal;
    document.getElementById('stat-val-vision').textContent = visVal;
    document.getElementById('stat-val-command').textContent = cmdVal;

    document.getElementById('stat-bar-logic').style.width = `${Math.min(100, logicVal / 2.2)}%`;
    document.getElementById('stat-bar-memory').style.width = `${Math.min(100, memVal / 2.2)}%`;
    document.getElementById('stat-bar-tactics').style.width = `${Math.min(100, tacVal / 2.2)}%`;
    document.getElementById('stat-bar-vision').style.width = `${Math.min(100, visVal / 2.2)}%`;
    document.getElementById('stat-bar-command').style.width = `${Math.min(100, cmdVal / 2.2)}%`;

    document.getElementById('rec-wins').textContent = State.wins;
    document.getElementById('rec-good-moves').textContent = State.goodMovesCount;
    document.getElementById('rec-puzzles').textContent = State.puzzlesCleared.length;

    const crewList = document.getElementById('crew-modal-list');
    crewList.innerHTML = CREW_DATA.map(c => {
      const unlocked = State.unlockedCrew.includes(c.id);
      return `
        <div class="crew-item-card ${unlocked ? 'unlocked' : ''}">
          <div class="crew-svg-slot">${unlocked ? Sprites.getCharacterAvatarSVG(c.id) : '<span style="font-size:2rem;">❓</span>'}</div>
          <div>
            <div style="font-weight:900; color:${unlocked ? '#fde047' : '#64748b'};">
              ${unlocked ? c.name : '？？？のデータ（章をクリアすると解放）'}
            </div>
            <div style="font-size:0.78rem; color:#38bdf8;">${unlocked ? c.role : ''}</div>
            <div style="font-size:0.8rem; color:#cbd5e1; margin-top:2px;">${c.specialty}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderGuideModal() {
    const wrap = document.getElementById('guide-modal-content');
    const pieceCards = Object.entries(PIECE_INFO).map(([k, p]) => `
      <div style="background:#0f172a; border:2px solid #334155; border-radius:12px; padding:12px; display:flex; gap:14px; align-items:center;">
        <div style="width:68px; height:68px; flex-shrink:0;">${Sprites.getPiece3DSVG(k, 'w')}</div>
        <div>
          <div style="font-weight:900; color:#fcd34d;">${p.name} / ${p.en} （価値: ${p.points === 100 ? '無限大' : p.points + '点'}）</div>
          <div style="font-size:0.84rem; color:#e2e8f0; margin-top:4px;">${p.ruleText}</div>
        </div>
      </div>
    `).join('');

    wrap.innerHTML = `
      <h3 style="color:#38bdf8; margin-bottom:10px;">① 3Dキャラクター駒と「動きの言語ルール」</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:12px; margin-bottom:20px;">
        ${pieceCards}
      </div>
      <h3 style="color:#f59e0b; margin-bottom:10px;">② 賢佑キャプテンの必殺戦術（論理の3大法則）</h3>
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:12px;">
        <div style="background:#0f172a; border:2px solid #22c55e; border-radius:12px; padding:12px;">
          <strong style="color:#4ade80;">🟨 法則1：センター4マス制圧</strong>
          <p style="font-size:0.83rem; margin-top:6px;">盤面の真ん中（D4, E4, D5, E5）にポーンやナイト（馬）を進めると、駒が動けるマスが約2倍に増えるよ！</p>
        </div>
        <div style="background:#0f172a; border:2px solid #38bdf8; border-radius:12px; padding:12px;">
          <strong style="color:#38bdf8;">🐍 法則2：フォーク（二股攻撃）</strong>
          <p style="font-size:0.83rem; margin-top:6px;">1つのナイトやポーンで、敵の2つの強い駒を同時に狙う必殺技！相手は片方しか逃がせないから確実に得をするよ！</p>
        </div>
        <div style="background:#0f172a; border:2px solid #a855f7; border-radius:12px; padding:12px;">
          <strong style="color:#c084fc;">🏰 法則3：キャスリング合体防御</strong>
          <p style="font-size:0.83rem; margin-top:6px;">キングとルークの間に駒がない時、キングを横に2マス動かしてルークと飛び越え合体！王様を安全に守れるよ！</p>
        </div>
      </div>
    `;
  }
};

// メインゲーム進行＆チェス盤インタラクション
const Game = {
  engine: new ChessEngine(),
  mode: 'stage', // 'stage' | 'puzzle'
  currentStage: STAGES_DATA[0],
  currentPuzzle: null,
  selectedSquare: null,
  legalMovesForSelected: [],
  pendingMove: null,
  pendingPromotionMove: null,
  comboCount: 0,
  capturedByPlayer: [],
  capturedByEnemy: [],
  thinkSeconds: 0,
  thinkTimerId: null,
  arrowHighlights: [],
  prologueIndex: 0,

  init() {
    loadState();
    FX.init();
    UI.initTitleVisuals();
    this.applyTheme(State.activeTheme);
    UI.renderMap();
    UI.updateTopBar();
    this.startThinkTimer();
  },

  // ---------------------------------------------------------
  // タイトル画面：「最初から」「続きから」＆途中セーブ
  // ---------------------------------------------------------
  returnToTitleScreen() {
    saveState(true);
    UI.refreshTitleContinueButton();
    document.getElementById('title-screen-overlay').classList.remove('hidden');
    Sound.setBGMMode('title');
  },

  startNewGameFromTitle() {
    if (hasExistingSave()) {
      if (!confirm('新しい冒険を第1章から始めますか？（これまでのセーブデータは新しく上書きされます）')) {
        return;
      }
    }
    State = getDefaultState();
    State.hasStarted = true;
    saveState(false);

    Sound.ensureBGM('title');
    Sound.playVictory();
    document.getElementById('title-screen-overlay').classList.add('hidden');

    // 第1章開始前のオープニング物語アニメーションシアターを起動！
    this.openPrologueTheater();
  },

  continueGameFromTitle() {
    if (!hasExistingSave()) return;
    loadState();
    Sound.ensureBGM('map');
    Sound.playGoodMove();
    document.getElementById('title-screen-overlay').classList.add('hidden');

    this.applyTheme(State.activeTheme);
    UI.updateTopBar();

    // もし対局途中のセーブデータがあれば、その対局盤面を復元して再開可能！
    if (State.savedMatch && State.savedMatch.board) {
      this.restoreSavedMatch(State.savedMatch);
      UI.switchScreen('battle');
      Sound.speak('セーブしたところから冒険を再開するよ！頑張ろうキャプテン賢佑！', 'Welcome back Captain Kensuke!', 'happy');
    } else {
      const targetStage = State.currentStageId || Math.min(STAGES_DATA.length, State.clearedStages.length + 1);
      this.prepareStageBoard(targetStage);
      UI.switchScreen('map');
      Sound.speak('航海マップから冒険を再開するよ！', 'Let us set sail!', 'happy');
    }
  },

  manualSaveWithFeedback() {
    saveState(true);
    Sound.playGoodMove();
    const toast = document.getElementById('save-toast');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2400);
  },

  restoreSavedMatch(saved) {
    this.mode = saved.mode || 'stage';
    const st = STAGES_DATA.find(s => s.id === saved.stageId) || STAGES_DATA[0];
    this.currentStage = st;
    this.engine.reset();
    this.engine.board = this.engine.cloneBoard(saved.board);
    this.engine.turn = saved.turn || 'w';
    this.engine.castling = { ...saved.castling };
    this.capturedByPlayer = [...(saved.capturedByPlayer || [])];
    this.capturedByEnemy = [...(saved.capturedByEnemy || [])];
    this.comboCount = saved.comboCount || 0;
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.arrowHighlights = [];

    document.getElementById('boss-avatar').innerHTML = Sprites.getCharacterAvatarSVG(st.bossKey);
    document.getElementById('boss-stage-label').textContent = `CHAPTER ${st.id}`;
    document.getElementById('boss-name').textContent = st.bossName;
    document.getElementById('boss-title').textContent = st.bossTitle;
    document.getElementById('boss-speech').textContent = st.openingSpeech;

    this.updateAdvisorDisplay();
    this.renderBoard();
  },

  // ---------------------------------------------------------
  // 第1章導入：オープニング物語アニメーションシアター
  // ---------------------------------------------------------
  openPrologueTheater() {
    this.prologueIndex = 0;
    document.getElementById('prologue-overlay').classList.remove('hidden');
    this.renderPrologueSlide();
  },

  renderPrologueSlide() {
    const slide = PROLOGUE_SLIDES[this.prologueIndex];
    if (!slide) return;

    // ドットインジケーター
    const dots = document.getElementById('prologue-dots');
    dots.innerHTML = PROLOGUE_SLIDES.map((_, i) =>
      `<span class="p-dot ${i === this.prologueIndex ? 'active' : ''}"></span>`
    ).join('');

    document.getElementById('prologue-speaker').textContent = slide.speaker;
    document.getElementById('prologue-text').innerHTML = `<strong style="color:#fde047; font-size:1.15rem; display:block; margin-bottom:6px;">${slide.title}</strong>${slide.text}`;

    const vis = document.getElementById('prologue-visual');
    if (slide.visualType === 'crown_world') {
      vis.innerHTML = `
        <div class="pro-scene crown-scene">
          <div class="pro-big-piece">${Sprites.getPiece3DSVG('k', 'w')}</div>
          <div class="pro-sparkles">✨ 👑 ✨</div>
          <div class="pro-big-piece">${Sprites.getPiece3DSVG('q', 'w')}</div>
        </div>
      `;
    } else if (slide.visualType === 'hero_and_crew') {
      vis.innerHTML = `
        <div class="pro-scene">
          <div class="pro-char">${Sprites.getCharacterAvatarSVG('tako')}</div>
          <div class="pro-char hero-scale">${Sprites.getCharacterAvatarSVG('kensuke')}</div>
          <div class="pro-char">${Sprites.getCharacterAvatarSVG('washi')}</div>
        </div>
      `;
    } else if (slide.visualType === 'six_bosses') {
      vis.innerHTML = `
        <div class="pro-scene">
          <div class="pro-char">${Sprites.getCharacterAvatarSVG('boss_1')}</div>
          <div style="font-size:2.2rem; font-weight:900; color:#fde047;">➡ 🧭 ➡</div>
          <div class="pro-char">${Sprites.getCharacterAvatarSVG('boss_6')}</div>
        </div>
      `;
    } else {
      vis.innerHTML = `
        <div class="pro-scene">
          <div style="font-size:4.2rem;" class="anim-3d-float">📚</div>
          <div style="font-size:3.5rem;" class="anim-3d-bob">🪙</div>
          <div style="font-size:4.2rem;" class="anim-3d-float">🎁</div>
        </div>
      `;
    }

    const nextBtn = document.getElementById('prologue-next-btn');
    nextBtn.textContent = this.prologueIndex === PROLOGUE_SLIDES.length - 1
      ? '⚔️ 第1章の海へ出撃する！！'
      : '次の物語へ ▶';

    Sound.speak(slide.text, '', 'hero');
  },

  nextPrologueSlide() {
    this.prologueIndex++;
    if (this.prologueIndex >= PROLOGUE_SLIDES.length) {
      this.skipPrologue();
    } else {
      Sound.playSelect();
      this.renderPrologueSlide();
    }
  },

  skipPrologue() {
    document.getElementById('prologue-overlay').classList.add('hidden');
    UI.switchScreen('map');
    // そのまま第1章のVSバトルアニメーション画面へ突入！
    this.launchStageBattleIntro(1);
  },

  // ---------------------------------------------------------
  // 各ステージ開始時：VSバトル突入アニメーション＆ボスセリフ画面
  // ---------------------------------------------------------
  launchStageBattleIntro(stageId) {
    const st = STAGES_DATA.find(s => s.id === stageId) || STAGES_DATA[0];
    State.currentStageId = st.id;
    this.prepareStageBoard(st.id);

    document.getElementById('vs-stage-banner').textContent = st.title;
    document.getElementById('vs-player-sprite').innerHTML = Sprites.getCharacterAvatarSVG('kensuke');
    document.getElementById('vs-boss-sprite').innerHTML = Sprites.getCharacterAvatarSVG(st.bossKey);
    document.getElementById('vs-boss-title').textContent = st.bossTitle;
    document.getElementById('vs-boss-name').textContent = st.bossName;
    document.getElementById('vs-speech-speaker').textContent = `🔥 ${st.bossName} が立ちはだかった！`;
    document.getElementById('vs-speech-text').textContent = st.openingSpeech;
    document.getElementById('vs-mission-goal').textContent = st.missionGoal;

    document.getElementById('battle-intro-overlay').classList.remove('hidden');
    Sound.ensureBGM('battle');
    Sound.playCheck();
    Sound.speak(`${st.title}！${st.bossName}が現れたぞ！${st.openingSpeech}`, 'Battle Start!', 'boss');
  },

  enterChessBoardFromIntro() {
    document.getElementById('battle-intro-overlay').classList.add('hidden');
    UI.switchScreen('battle');
    FX.showCutin('⚔️', `CHAPTER ${this.currentStage.id} START!`, 'チェスバトル開始！！');
    Sound.playMove();
  },

  prepareStageBoard(stageId) {
    const st = STAGES_DATA.find(s => s.id === stageId) || STAGES_DATA[0];
    this.mode = 'stage';
    this.currentStage = st;
    this.engine.reset();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.comboCount = 0;
    this.capturedByPlayer = [];
    this.capturedByEnemy = [];
    this.arrowHighlights = [];
    this.thinkSeconds = 0;

    document.getElementById('boss-avatar').innerHTML = Sprites.getCharacterAvatarSVG(st.bossKey);
    document.getElementById('boss-stage-label').textContent = `CHAPTER ${st.id}`;
    document.getElementById('boss-name').textContent = st.bossName;
    document.getElementById('boss-title').textContent = st.bossTitle;
    document.getElementById('boss-speech').textContent = st.openingSpeech;
    document.getElementById('move-list').innerHTML = '';

    this.updateAdvisorDisplay();
    this.renderBoard();
    saveState(true);
  },

  startThinkTimer() {
    if (this.thinkTimerId) clearInterval(this.thinkTimerId);
    this.thinkTimerId = setInterval(() => {
      if (this.engine.turn === 'w') {
        this.thinkSeconds++;
        const el = document.getElementById('think-timer');
        if (el) el.textContent = `思考中: ${this.thinkSeconds}秒`;
      }
    }, 1000);
  },

  startPuzzle(puzzleId) {
    const pz = PUZZLES_DATA.find(p => p.id === puzzleId);
    if (!pz) return;
    this.mode = 'puzzle';
    this.currentPuzzle = pz;
    this.engine.loadFEN(pz.fen);
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.arrowHighlights = [];
    this.thinkSeconds = 0;

    document.getElementById('boss-avatar').innerHTML = Sprites.getPiece3DSVG('n', 'w');
    document.getElementById('boss-stage-label').textContent = `LOGIC PUZZLE`;
    document.getElementById('boss-name').textContent = pz.title;
    document.getElementById('boss-title').textContent = pz.difficulty;
    document.getElementById('boss-speech').textContent = pz.hintText;
    document.getElementById('advisor-message').textContent = pz.hintText;
    document.getElementById('move-list').innerHTML = '';

    this.renderBoard();
    UI.switchScreen('battle');
    Sound.playSelect();
  },

  restartStage() {
    if (this.mode === 'puzzle' && this.currentPuzzle) {
      this.startPuzzle(this.currentPuzzle.id);
    } else {
      this.launchStageBattleIntro(this.currentStage.id);
    }
  },

  updateSupportOptions() {
    this.renderBoard();
  },

  cycleAdvisor() {
    const unlockedList = CREW_DATA.filter(c => State.unlockedCrew.includes(c.id));
    State.currentAdvisorIndex = (State.currentAdvisorIndex + 1) % unlockedList.length;
    this.updateAdvisorDisplay();
    Sound.playSelect();
  },

  updateAdvisorDisplay(customText = null) {
    const unlockedList = CREW_DATA.filter(c => State.unlockedCrew.includes(c.id));
    const crew = unlockedList[State.currentAdvisorIndex % unlockedList.length] || CREW_DATA[0];
    document.getElementById('advisor-avatar').innerHTML = Sprites.getCharacterAvatarSVG(crew.id);
    document.getElementById('advisor-role-label').textContent = crew.role;
    document.getElementById('advisor-name').textContent = crew.name;
    if (customText) {
      document.getElementById('advisor-message').textContent = customText;
    } else {
      const q = crew.sampleQuotes[Math.floor(Math.random() * crew.sampleQuotes.length)];
      document.getElementById('advisor-message').textContent = q;
    }
  },

  renderBoard() {
    const boardEl = document.getElementById('chess-board');
    boardEl.innerHTML = '';

    const showMoves = document.getElementById('opt-show-moves').checked;
    const showDanger = document.getElementById('opt-show-danger').checked;
    const showZones = document.getElementById('opt-show-zones').checked;

    const lastSnap = this.engine.history[this.engine.history.length - 1];
    const inCheckW = this.engine.isInCheck('w');
    const inCheckB = this.engine.isInCheck('b');

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sq.className = `square ${isLight ? 'light' : 'dark'}`;

        if (showZones && (r === 3 || r === 4) && (c === 3 || c === 4)) {
          sq.classList.add('center-zone');
        }

        if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
          sq.classList.add('selected');
        }

        if (lastSnap && ((lastSnap.move.from.r === r && lastSnap.move.from.c === c) || (lastSnap.move.to.r === r && lastSnap.move.to.c === c))) {
          sq.classList.add('last-move');
        }

        const p = this.engine.board[r][c];
        if (p && p.type === 'k') {
          if ((p.color === 'w' && inCheckW) || (p.color === 'b' && inCheckB)) {
            sq.classList.add('in-check');
          }
        }

        const coordSpan = document.createElement('span');
        coordSpan.className = 'square-coord-mini';
        coordSpan.textContent = this.engine.coordToAlgebraic(r, c);
        sq.appendChild(coordSpan);

        if (showDanger && this.engine.isSquareAttacked(r, c, 'b')) {
          const dBadge = document.createElement('span');
          dBadge.className = 'danger-badge';
          dBadge.textContent = '⚠️';
          dBadge.title = '敵の駒から狙われているマスです';
          sq.appendChild(dBadge);
        }

        if (showMoves) {
          const matchedMove = this.legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
          if (matchedMove) {
            if (matchedMove.captured) {
              const ring = document.createElement('div');
              ring.className = 'capture-ring';
              sq.appendChild(ring);
            } else {
              const dot = document.createElement('div');
              dot.className = 'move-dot';
              sq.appendChild(dot);
            }
          }
        }

        // ★ 3D立体造形＆常時アニメーション付きのキャラクター駒を描画（ナイトは馬、ルークは城兵など）
        if (p) {
          const info = PIECE_INFO[p.type];
          const pieceDiv = document.createElement('div');
          pieceDiv.className = `chess-piece-3d ${p.color === 'w' ? 'white-3d' : 'black-3d'}`;
          pieceDiv.innerHTML = `
            ${Sprites.getPiece3DSVG(p.type, p.color)}
            <div class="piece-role-tag">${info.tag}</div>
          `;
          sq.appendChild(pieceDiv);
        }

        sq.addEventListener('click', (ev) => this.onSquareClick(r, c, ev));
        boardEl.appendChild(sq);
      }
    }

    this.renderArrows();
    this.updateBattleHUD();
  },

  renderArrows() {
    const group = document.getElementById('svg-arrows-group');
    group.innerHTML = '';
    const showMoves = document.getElementById('opt-show-moves').checked;

    if (showMoves && this.selectedSquare) {
      this.legalMovesForSelected.forEach(m => {
        const x1 = m.from.c * 100 + 50;
        const y1 = m.from.r * 100 + 50;
        const x2 = m.to.c * 100 + 50;
        const y2 = m.to.r * 100 + 50;
        const color = m.captured ? '#f59e0b' : '#22c55e';
        const marker = m.captured ? 'url(#arrow-gold)' : 'url(#arrow-green)';

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '8');
        line.setAttribute('stroke-dasharray', m.piece.type === 'n' ? '14,8' : 'none');
        line.setAttribute('opacity', '0.68');
        line.setAttribute('marker-end', marker);
        group.appendChild(line);
      });
    }

    this.arrowHighlights.forEach(ah => {
      const x1 = ah.from.c * 100 + 50;
      const y1 = ah.from.r * 100 + 50;
      const x2 = ah.to.c * 100 + 50;
      const y2 = ah.to.r * 100 + 50;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', ah.color || '#f59e0b');
      line.setAttribute('stroke-width', '13');
      line.setAttribute('opacity', '0.9');
      line.setAttribute('marker-end', 'url(#arrow-gold)');
      group.appendChild(line);
    });
  },

  updateBattleHUD() {
    let blackMaterial = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.engine.board[r][c];
        if (p && p.color === 'b' && p.type !== 'k') {
          blackMaterial += PIECE_INFO[p.type].points;
        }
      }
    }
    const maxMat = 39;
    const hpPct = Math.min(100, Math.max(5, Math.round((blackMaterial / maxMat) * 100)));
    document.getElementById('boss-hp-bar').style.width = `${hpPct}%`;
    document.getElementById('boss-hp-text').textContent = `${hpPct}%`;

    document.getElementById('captured-by-player').textContent = this.capturedByPlayer.map(t => PIECE_INFO[t].glyphB).join(' ');
    document.getElementById('captured-by-enemy').textContent = this.capturedByEnemy.map(t => PIECE_INFO[t].glyphW).join(' ');
    document.getElementById('combo-badge').textContent = `🔥 無双コンボ: ${this.comboCount}`;

    const turnEl = document.getElementById('turn-status');
    if (this.engine.turn === 'w') {
      turnEl.textContent = '⚪ あなたの番です（白）— じっくり最善手を探そう！';
    } else {
      turnEl.textContent = '⚫ 敵ボスが思考中です…';
    }
  },

  onSquareClick(r, c, ev) {
    if (this.engine.turn !== 'w') return;

    const move = this.legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
    if (move) {
      if (move.isPromotion && !move.promoteTo) {
        this.pendingPromotionMove = move;
        UI.openModal('promo-modal');
        return;
      }

      if (document.getElementById('opt-think-frame').checked) {
        this.pendingMove = move;
        const pName = PIECE_INFO[move.piece.type].name;
        const dest = this.engine.coordToAlgebraic(move.to.r, move.to.c);
        document.getElementById('tf-conclusion').textContent = `「${pName}」を【${dest}】に動かす！`;
        UI.openModal('think-frame-modal');
        return;
      }

      this.executePlayerMove(move, ev);
      return;
    }

    const clickedPiece = this.engine.board[r][c];
    if (clickedPiece && clickedPiece.color === 'w') {
      this.selectedSquare = { r, c };
      this.legalMovesForSelected = this.engine.getLegalMovesForSquare(r, c);
      this.arrowHighlights = [];
      Sound.playSelect();
      this.updatePieceLogicCard(clickedPiece, r, c, this.legalMovesForSelected);
      this.renderBoard();
    } else {
      this.selectedSquare = null;
      this.legalMovesForSelected = [];
      if (clickedPiece) {
        this.updatePieceLogicCard(clickedPiece, r, c, []);
      }
      this.renderBoard();
    }
  },

  updatePieceLogicCard(piece, r, c, legalMoves) {
    const info = PIECE_INFO[piece.type];
    const coord = this.engine.coordToAlgebraic(r, c);
    document.getElementById('plc-icon').innerHTML = Sprites.getPiece3DSVG(piece.type, piece.color);
    document.getElementById('plc-name').textContent = `${info.name}（現在地: ${coord}）`;
    document.getElementById('plc-sub').textContent = `英語名: ${info.en} ／ 価値ポイント: ${info.points === 100 ? '王様' : info.points + '点'}`;

    let targetsText = '';
    if (piece.color === 'w') {
      const capMoves = legalMoves.filter(m => m.captured);
      if (capMoves.length > 0) {
        const names = capMoves.map(m => `${this.engine.coordToAlgebraic(m.to.r, m.to.c)}の${PIECE_INFO[m.captured.type].name}`).join('、');
        targetsText = `<div style="margin-top:6px; color:#4ade80; font-weight:800;">🎯 今すぐキャプチャーできる敵: ${names}</div>`;
      } else {
        targetsText = `<div style="margin-top:6px; color:#38bdf8;">🟢 動ける安全・移動マス数: ${legalMoves.length}マス</div>`;
      }
    }

    document.getElementById('plc-body').innerHTML = `
      <div>${info.ruleText}</div>
      ${targetsText}
    `;
  },

  completePromotion(promoteType) {
    UI.closeModal('promo-modal');
    if (!this.pendingPromotionMove) return;
    this.pendingPromotionMove.promoteTo = promoteType;
    const m = this.pendingPromotionMove;
    this.pendingPromotionMove = null;
    this.executePlayerMove(m);
  },

  selectThinkChoice(group, idx, btnEl) {
    const parent = btnEl.parentElement;
    parent.querySelectorAll('.pill-choice').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');
    Sound.playSelect();
  },

  confirmMoveWithThinkBonus() {
    UI.closeModal('think-frame-modal');
    if (!this.pendingMove) return;
    const m = this.pendingMove;
    this.pendingMove = null;
    this.gainReward(25, 20, '🧠 思考の言語化ボーナス！ (+25 EXP / +20 G)');
    this.executePlayerMove(m);
  },

  executePlayerMove(move, clickEvent = null) {
    if (this.mode === 'puzzle' && this.currentPuzzle) {
      const pz = this.currentPuzzle;
      if (move.from.r === pz.solutionFrom.r && move.from.c === pz.solutionFrom.c &&
          move.to.r === pz.solutionTo.r && move.to.c === pz.solutionTo.c) {
        this.engine.makeMove(move);
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        this.renderBoard();
        Sound.playVictory();
        FX.confetti();
        FX.showCutin('🧩', 'LOGIC PUZZLE CLEAR!!', '法則発見！大正解！！');
        if (!State.puzzlesCleared.includes(pz.id)) {
          State.puzzlesCleared.push(pz.id);
        }
        this.gainReward(pz.rewardExp, pz.rewardGold);
        this.showResultModal(true, '🧩 論理パズル完全突破！！', pz.explanation, pz.rewardExp, pz.rewardGold, null, null);
      } else {
        Sound.playCheck();
        this.updateAdvisorDisplay('「おしいっ！その手だと敵のキングに逃げ道があるみたいだ。ヒントの『横ライン・斜めラインの法則』をもう一度見てみよう！」');
      }
      return;
    }

    const ranked = this.engine.analyzeMovesForPlayer('w');
    const isTopMove = ranked.length > 0 &&
      ranked[0].move.from.r === move.from.r &&
      ranked[0].move.from.c === move.from.c &&
      ranked[0].move.to.r === move.to.r &&
      ranked[0].move.to.c === move.to.c;

    const wasDeepThought = this.thinkSeconds >= 8;
    this.thinkSeconds = 0;

    this.engine.makeMove(move);
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.arrowHighlights = [];

    const moveCoord = `${PIECE_INFO[move.piece.type].glyphW} ${this.engine.coordToAlgebraic(move.from.r, move.from.c)} → ${this.engine.coordToAlgebraic(move.to.r, move.to.c)}`;
    this.appendMoveLog(`⚪ あなた: ${moveCoord}`);

    const burstX = clickEvent ? clickEvent.clientX : window.innerWidth / 2;
    const burstY = clickEvent ? clickEvent.clientY : window.innerHeight / 2;

    if (move.captured) {
      this.capturedByPlayer.push(move.captured.type);
      this.comboCount++;
      const pts = PIECE_INFO[move.captured.type].points;
      const bonusExp = pts * 8 + this.comboCount * 3;
      const bonusGold = pts * 10 + this.comboCount * 4;
      Sound.playCapture();
      FX.burst(burstX, burstY, '#ef4444', 45);
      FX.showCutin('⚔️', `${this.comboCount} COMBO SLASH!!`, `敵の${PIECE_INFO[move.captured.type].name}を撃破！ (+${bonusGold}G)`);
      Sound.speak(`やったね！${PIECE_INFO[move.captured.type].name}をゲット！ナイスコンボ！`, `Nice capture!`, 'happy');
      this.gainReward(bonusExp, bonusGold);
    } else if (isTopMove) {
      this.comboCount++;
      State.goodMovesCount++;
      const expGain = wasDeepThought ? 25 : 15;
      const goldGain = wasDeepThought ? 20 : 12;
      Sound.playGoodMove();
      FX.burst(burstX, burstY, '#22c55e', 30);
      const msg = wasDeepThought
        ? `🌟 じっくり考え抜いた最高の論理手（Brilliant Move）！！ (+${expGain}EXP / +${goldGain}G)`
        : `✨ ナイスムーブ（好手）！！ (+${expGain}EXP / +${goldGain}G)`;
      this.updateAdvisorDisplay(msg);
      this.gainReward(expGain, goldGain);
    } else {
      Sound.playMove();
      FX.burst(burstX, burstY, '#38bdf8', 18);
    }

    this.renderBoard();
    saveState(true); // 1手ごとに自動セーブ

    const blackMoves = this.engine.getAllLegalMoves('b');
    const blackInCheck = this.engine.isInCheck('b');

    if (blackMoves.length === 0) {
      if (blackInCheck) {
        this.handleStageVictory();
      } else {
        this.showResultModal(false, '🤝 ステイルメイト（引き分け）！', '敵のキングにチェックはかかっていないけれど、動けるマスがなくなったため引き分けだ！もう1回挑戦しよう！', 50, 50, null, null);
      }
      return;
    }

    if (blackInCheck) {
      Sound.playCheck();
      FX.showCutin('⚡', 'CHECK!!', 'チェック！！敵の王様を追い詰めたぞ！');
      Sound.speak('チェック！王様を追い詰めたよ！', 'Check!', 'hero');
    }

    setTimeout(() => this.executeAITurn(), 650);
  },

  executeAITurn() {
    if (this.engine.turn !== 'b') return;
    const aiMove = this.engine.chooseAIMove(this.currentStage.aiDepth, this.currentStage.aiRandomness);
    if (!aiMove) return;

    this.engine.makeMove(aiMove);
    if (aiMove.captured) {
      this.capturedByEnemy.push(aiMove.captured.type);
      this.comboCount = 0;
      Sound.playCapture();
    } else {
      Sound.playMove();
    }

    const moveCoord = `${PIECE_INFO[aiMove.piece.type].glyphB} ${this.engine.coordToAlgebraic(aiMove.from.r, aiMove.from.c)} → ${this.engine.coordToAlgebraic(aiMove.to.r, aiMove.to.c)}`;
    this.appendMoveLog(`⚫ ボス: ${moveCoord}`);

    this.renderBoard();
    saveState(true);

    const whiteMoves = this.engine.getAllLegalMoves('w');
    const whiteInCheck = this.engine.isInCheck('w');

    if (whiteMoves.length === 0) {
      if (whiteInCheck) {
        this.gainReward(40, 40);
        this.showResultModal(false, '💥 チェックメイト…！でも経験値はゲット！', '悔しいけれど、どこで危なくなったか「時の砂時計（1手戻す）」で振り返るか、もう一度挑戦してリベンジしよう！', 40, 40, null, null);
      } else {
        this.showResultModal(false, '🤝 ステイルメイト（引き分け）！', '引き分けになったぞ！次はチェックメイトを狙おう！', 50, 50, null, null);
      }
      return;
    }

    if (whiteInCheck) {
      Sound.playCheck();
      this.updateAdvisorDisplay('「⚠️ キャプテン！キングがチェック（王手）されているよ！王様を安全なマスに逃がすか、攻撃してきている敵の駒を取るか、間に味方の駒を挟んでブロックしよう！」');
    }
  },

  handleStageVictory() {
    Sound.playVictory();
    FX.confetti();
    FX.showCutin('👑', 'CHECKMATE VICTORY!!', '完全勝利！チェックメイト！！');
    Sound.speak('チェックメイト！完全勝利だよキャプテン賢佑！やったー！', 'Checkmate! Brilliant victory!', 'hero');

    State.wins++;
    const st = this.currentStage;
    const wasFirstClear = !State.clearedStages.includes(st.id);
    if (wasFirstClear) {
      State.clearedStages.push(st.id);
    }

    // 次の章の解放チェック
    const nextStage = STAGES_DATA.find(s => s.id === st.id + 1) || null;
    if (nextStage) {
      State.currentStageId = nextStage.id;
    }
    State.savedMatch = null; // ステージクリア時は途中対局データをクリア

    let newCrew = null;
    if (st.unlockCrewId && !State.unlockedCrew.includes(st.unlockCrewId)) {
      State.unlockedCrew.push(st.unlockCrewId);
      newCrew = CREW_DATA.find(c => c.id === st.unlockCrewId);
    }

    this.gainReward(st.rewardExp, st.rewardGold);
    document.getElementById('boss-speech').textContent = st.winSpeech;

    this.showResultModal(
      true,
      `🏆 ${st.bossName}を撃破！！`,
      st.winSpeech,
      st.rewardExp,
      st.rewardGold,
      newCrew,
      nextStage
    );
  },

  showResultModal(isWin, title, desc, exp, gold, newCrew, nextStageUnlocked) {
    document.getElementById('result-banner').textContent = isWin ? '🏆 VICTORY!! CHECKMATE!!' : '🔥 NICE TRY!! 次に活かそう！';
    document.getElementById('result-icon').innerHTML = isWin ? Sprites.getPiece3DSVG('k', 'w') : Sprites.getCharacterAvatarSVG('tako');
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-desc').textContent = desc;
    document.getElementById('res-exp').textContent = `+${exp} EXP`;
    document.getElementById('res-gold').textContent = `+${gold} G`;

    const nextBox = document.getElementById('next-stage-unlock-notice');
    if (nextStageUnlocked) {
      nextBox.classList.remove('hidden');
      nextBox.innerHTML = `
        <div style="font-weight:900; color:#38bdf8; margin-bottom:4px;">🧭 新たな海域（次の章）が発見されたぞ！！</div>
        <div style="font-size:0.95rem; font-weight:800; color:#fff;">『${nextStageUnlocked.title}』</div>
        <div style="font-size:0.82rem; color:#fde047; margin-top:4px;">${nextStageUnlocked.missionGoal}</div>
      `;
    } else {
      nextBox.classList.add('hidden');
    }

    const crewBox = document.getElementById('new-crew-unlock-box');
    if (newCrew) {
      crewBox.classList.remove('hidden');
      document.getElementById('nc-icon').innerHTML = Sprites.getCharacterAvatarSVG(newCrew.id);
      document.getElementById('nc-name').textContent = `${newCrew.name}（${newCrew.role}）が仲間になった！`;
      document.getElementById('nc-desc').textContent = newCrew.specialty;
    } else {
      crewBox.classList.add('hidden');
    }

    UI.openModal('result-modal');
  },

  gainReward(exp, gold, customLog = null) {
    State.exp += exp;
    State.totalExp += exp;
    State.gold += gold;

    let leveledUp = false;
    while (State.exp >= getExpNeeded(State.level)) {
      State.exp -= getExpNeeded(State.level);
      State.level++;
      leveledUp = true;
    }

    if (leveledUp) {
      setTimeout(() => {
        Sound.playLevelUp();
        FX.confetti();
        FX.showCutin('🌟', 'LEVEL UP!!', `レベル ${State.level} に成長したぞ！！`);
        Sound.speak(`やったー！レベルアップ！レベル${State.level}になったよ！`, `Level Up!`, 'hero');
      }, 600);
    }

    if (customLog) {
      this.updateAdvisorDisplay(customLog);
    }

    saveState(false);
    UI.updateTopBar();
  },

  appendMoveLog(text) {
    const list = document.getElementById('move-list');
    const div = document.createElement('div');
    div.textContent = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  },

  requestAdvisorHint() {
    if (this.engine.turn !== 'w') return;
    if (this.mode === 'puzzle' && this.currentPuzzle) {
      const pz = this.currentPuzzle;
      this.arrowHighlights = [{ from: pz.solutionFrom, to: pz.solutionTo, color: '#f59e0b' }];
      this.updateAdvisorDisplay(`💡 ${pz.hintText}`);
      this.renderBoard();
      Sound.playGoodMove();
      return;
    }

    const ranked = this.engine.analyzeMovesForPlayer('w');
    if (ranked.length === 0) return;

    const best = ranked[0];
    const fromCoord = this.engine.coordToAlgebraic(best.move.from.r, best.move.from.c);
    const toCoord = this.engine.coordToAlgebraic(best.move.to.r, best.move.to.c);
    const pName = PIECE_INFO[best.move.piece.type].name;

    this.arrowHighlights = [{ from: best.move.from, to: best.move.to, color: '#f59e0b' }];
    this.selectedSquare = best.move.from;
    this.legalMovesForSelected = this.engine.getLegalMovesForSquare(best.move.from.r, best.move.from.c);

    const msg = `💡【作戦提案】①結論：${fromCoord}の「${pName}」を【${toCoord}】へ動かそう！ ／ ②理由：${best.reasons.join(' さらに ')}`;
    this.updateAdvisorDisplay(msg);
    this.renderBoard();
    Sound.playGoodMove();
  },

  useUndo() {
    if (this.engine.history.length < 2) {
      this.updateAdvisorDisplay('「まだ戻せる手がないよ！まずは1手動かしてみよう！」');
      return;
    }
    this.engine.undoMove();
    this.engine.undoMove();
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.arrowHighlights = [];
    Sound.playSelect();
    this.updateAdvisorDisplay('⏳ 時の砂時計を使って1手前の盤面に戻したよ！別の論理ルートをじっくり試してみよう！');
    this.renderBoard();
    saveState(true);
  },

  useFutureEye() {
    if (this.engine.turn !== 'w') return;
    if (State.items.eye <= 0) {
      this.updateAdvisorDisplay('「ワシの未来予測アイがなくなったよ！ショップで補充するか、無料の『仲間の作戦アドバイス』を使おう！」');
      return;
    }
    const ranked = this.engine.analyzeMovesForPlayer('w');
    if (ranked.length === 0) return;

    State.items.eye--;
    saveState(false);
    UI.updateTopBar();

    this.arrowHighlights = [];
    const first = ranked[0];
    this.arrowHighlights.push({ from: first.move.from, to: first.move.to, color: '#f59e0b' });

    let msg = `🦅【ワシの未来予測】第1候補（金色の矢印）: ${this.engine.coordToAlgebraic(first.move.from.r, first.move.from.c)}→${this.engine.coordToAlgebraic(first.move.to.r, first.move.to.c)}（${first.reasons[0]}）`;

    if (ranked.length > 1) {
      const second = ranked[1];
      this.arrowHighlights.push({ from: second.move.from, to: second.move.to, color: '#22c55e' });
      msg += ` ／ 第2候補（緑の矢印）: ${this.engine.coordToAlgebraic(second.move.from.r, second.move.from.c)}→${this.engine.coordToAlgebraic(second.move.to.r, second.move.to.c)}`;
    }

    this.updateAdvisorDisplay(msg);
    this.renderBoard();
    Sound.playGoodMove();
  },

  buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (State.gold < item.price) {
      alert(`ゴールドが足りないよ！（必要: ${item.price} G ／ 所持: ${State.gold} G）\nバトルや論理パズルでゴールドを貯めよう！`);
      return;
    }

    State.gold -= item.price;
    if (itemId === 'item_undo_pack') State.items.undo += 3;
    if (itemId === 'item_eye_pack') State.items.eye += 3;
    if (item.type === 'theme') {
      if (!State.ownedThemes.includes(item.themeClass)) {
        State.ownedThemes.push(item.themeClass);
      }
      this.equipTheme(item.themeClass);
    }

    Sound.playGoodMove();
    FX.confetti();
    saveState(false);
    UI.renderShop();
    UI.updateTopBar();
  },

  equipTheme(themeClass) {
    State.activeTheme = themeClass;
    this.applyTheme(themeClass);
    saveState(false);
    UI.renderShop();
    Sound.playSelect();
  },

  applyTheme(themeClass) {
    const wrapper = document.getElementById('board-theme-wrapper');
    wrapper.className = 'board-outer-frame';
    if (themeClass && themeClass !== 'default') {
      wrapper.classList.add(themeClass);
    }
  },

  redeemRealReward(id, name, price, icon) {
    if (State.gold < price) {
      alert(`あと ${price - State.gold} G 貯めると「${name}」と交換できるよ！頑張ろう！`);
      return;
    }
    if (!confirm(`🪙 ${price} G を使って、現実世界のごほうび\n「${name}」\nと交換しますか？`)) {
      return;
    }

    State.gold -= price;
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
    State.redeemedTickets.unshift({
      id,
      name,
      icon,
      date: dateStr,
      used: false
    });

    Sound.playVictory();
    FX.confetti();
    FX.showCutin('🎁', 'REAL WORLD REWARD GET!!', `ごほうびチケット獲得！！`);
    saveState(false);
    UI.renderShop();
    UI.updateTopBar();
  },

  markTicketUsed(idx) {
    if (!State.redeemedTickets[idx]) return;
    if (confirm('お父さん・お母さんにチケットを見せて、ごほうびを受け取りましたか？')) {
      State.redeemedTickets[idx].used = true;
      saveState(false);
      UI.renderShop();
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
