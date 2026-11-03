// 立体3Dシェーディング＆常時アニメーション付きSVGキャラクター・3Dチェス駒ファクトリー
// 賢佑くんが視覚的にもワクワクし、各駒の役割・特徴がひと目で分かる立体造形

const Sprites = {
  // ---------------------------------------------------------
  // 1. チェスの駒 3DキャラクターSVG（常時アニメーション付き）
  // ---------------------------------------------------------
  getPiece3DSVG(type, color) {
    const isWhite = color === 'w';
    const uid = `${type}_${color}`;

    // 白駒：プラチナ＆ロイヤルブルー＆ゴールド装飾
    // 黒駒：ダークオニキス＆クリムゾンレッド＆パープル装飾
    const palette = isWhite
      ? {
          baseTop: '#f8fafc',
          baseMid: '#cbd5e1',
          baseBot: '#64748b',
          ring: '#38bdf8',
          bodyLight: '#ffffff',
          bodyMid: '#e2e8f0',
          bodyDark: '#94a3b8',
          accent: '#f59e0b',
          accentLight: '#fef08a',
          cape: '#0284c7',
          eye: '#0f172a',
          cheek: '#f43f5e'
        }
      : {
          baseTop: '#475569',
          baseMid: '#1e293b',
          baseBot: '#090d16',
          ring: '#ef4444',
          bodyLight: '#64748b',
          bodyMid: '#334155',
          bodyDark: '#0f172a',
          accent: '#ec4899',
          accentLight: '#fbcfe8',
          cape: '#991b1b',
          eye: '#fef08a',
          cheek: '#fb7185'
        };

    let charBody = '';
    if (type === 'p') {
      // ポーン：剣と盾を持ったかわいい見習い海賊兵士モンスター
      charBody = `
        <g class="anim-3d-bob">
          <!-- マント -->
          <path d="M26,56 Q20,72 24,80 L76,80 Q80,72 74,56 Z" fill="${palette.cape}" />
          <!-- 丸っこい3Dボディ -->
          <ellipse cx="50" cy="64" rx="20" ry="16" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- 3Dヘッド＆海賊ヘルメット -->
          <circle cx="50" cy="42" r="18" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <path d="M31,38 Q50,20 69,38 Q50,33 31,38 Z" fill="${palette.cape}" stroke="#0f172a" stroke-width="2"/>
          <circle cx="50" cy="25" r="4.5" fill="${palette.accent}" stroke="#0f172a" stroke-width="1.5"/>
          <!-- かわいい目とほっぺ -->
          <g class="anim-3d-blink">
            <ellipse cx="43" cy="44" rx="3.2" ry="4.2" fill="${palette.eye}"/>
            <circle cx="42" cy="42.5" r="1.3" fill="#fff"/>
            <ellipse cx="57" cy="44" rx="3.2" ry="4.2" fill="${palette.eye}"/>
            <circle cx="56" cy="42.5" r="1.3" fill="#fff"/>
          </g>
          <ellipse cx="37" cy="48" rx="3" ry="1.6" fill="${palette.cheek}" opacity="0.65"/>
          <ellipse cx="63" cy="48" rx="3" ry="1.6" fill="${palette.cheek}" opacity="0.65"/>
          <!-- 小さな盾と剣（常時スイング） -->
          <g class="anim-3d-weapon">
            <path d="M72,58 L84,36 L88,40 L76,62 Z" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.8"/>
            <rect x="70" y="56" width="10" height="4" rx="2" fill="${palette.accent}" stroke="#0f172a" stroke-width="1.4"/>
          </g>
          <path d="M18,52 Q18,68 28,73 Q38,68 38,52 Z" fill="${palette.accent}" stroke="#0f172a" stroke-width="2"/>
          <path d="M22,55 Q22,65 28,69 Q34,65 34,55 Z" fill="${palette.cape}"/>
        </g>
      `;
    } else if (type === 'n') {
      // ナイト：たてがみをなびかせ、前足を上げていななく3Dペガサス・バトルホース（馬）
      charBody = `
        <g class="anim-3d-gallop">
          <!-- 背中の翼（ペガサス風立体ウイング） -->
          <path class="anim-3d-wing" d="M62,52 Q88,34 84,56 Q78,66 62,64 Z" fill="${palette.accentLight}" stroke="#0f172a" stroke-width="2"/>
          <!-- 馬の立体的な胴体・胸 -->
          <path d="M32,76 Q28,56 40,46 L62,48 Q72,62 66,76 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- たてがみ（ゴールド／アクセント） -->
          <path d="M46,18 Q66,22 68,42 Q64,54 58,52 Q56,34 44,26 Z" fill="${palette.accent}" stroke="#0f172a" stroke-width="2"/>
          <!-- 馬の顔・マズル（立体シェーディング） -->
          <path d="M38,20 L48,12 L52,22 C60,26 62,38 56,48 L36,46 L22,42 C18,38 20,30 28,28 L38,22 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- 馬の額アーマー（シャンフロン） -->
          <path d="M36,22 L48,15 L44,32 L30,34 Z" fill="${palette.cape}" stroke="${palette.accent}" stroke-width="1.6"/>
          <!-- 凛々しくかわいい目 -->
          <g class="anim-3d-blink">
            <ellipse cx="41" cy="30" rx="3.4" ry="4" fill="${palette.eye}"/>
            <circle cx="40" cy="28.5" r="1.4" fill="#fff"/>
          </g>
          <!-- 鼻先と手綱 -->
          <circle cx="25" cy="36" r="1.8" fill="#0f172a"/>
          <path d="M24,41 L54,46" stroke="${palette.accent}" stroke-width="2.5" stroke-linecap="round"/>
          <!-- 跳ねる前足 -->
          <path class="anim-3d-hoof" d="M34,58 L20,66 L24,72 L38,65 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2"/>
          <rect x="17" y="65" width="7" height="6" rx="2" transform="rotate(-20 20 68)" fill="${palette.accent}" stroke="#0f172a" stroke-width="1.5"/>
        </g>
      `;
    } else if (type === 'b') {
      // ビショップ：魔法の宝石杖を浮かせる3Dアークメイジ（賢者僧侶）
      charBody = `
        <g class="anim-3d-float">
          <!-- ローブ -->
          <path d="M26,78 Q30,48 50,48 Q70,48 74,78 Z" fill="${palette.cape}" stroke="#0f172a" stroke-width="2.2"/>
          <path d="M42,50 L50,78 L58,50 Z" fill="${palette.accentLight}" opacity="0.85"/>
          <!-- 顔 -->
          <circle cx="50" cy="42" r="15" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- ビショップのミトラ帽子（立体） -->
          <path d="M32,36 Q50,6 68,36 Q50,32 32,36 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <path d="M46,18 L54,18 M50,14 L50,24" stroke="${palette.accent}" stroke-width="3" stroke-linecap="round"/>
          <!-- 目 -->
          <g class="anim-3d-blink">
            <ellipse cx="44" cy="42" rx="2.8" ry="3.8" fill="${palette.eye}"/>
            <circle cx="43" cy="40.5" r="1.2" fill="#fff"/>
            <ellipse cx="56" cy="42" rx="2.8" ry="3.8" fill="${palette.eye}"/>
            <circle cx="55" cy="40.5" r="1.2" fill="#fff"/>
          </g>
          <!-- 浮遊する魔法クリスタル杖 -->
          <g class="anim-3d-orb">
            <line x1="78" y1="36" x2="72" y2="76" stroke="${palette.accent}" stroke-width="3.5" stroke-linecap="round"/>
            <polygon points="78,20 86,30 78,40 70,30" fill="#38bdf8" stroke="#fff" stroke-width="1.8"/>
            <circle cx="78" cy="30" r="10" fill="none" stroke="${palette.accentLight}" stroke-width="1.5" stroke-dasharray="3,3"/>
          </g>
        </g>
      `;
    } else if (type === 'r') {
      // ルーク：城塞の凹凸冠を頂く重装甲3Dキャッスル・ゴーレム
      charBody = `
        <g class="anim-3d-heavy">
          <!-- 両肩の3Dタワアーマー -->
          <rect x="16" y="42" width="16" height="28" rx="4" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <rect x="68" y="42" width="16" height="28" rx="4" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- 中央の城塞ボディ -->
          <path d="M28,78 L32,34 L68,34 L72,78 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.4"/>
          <!-- 城壁の凹凸（クレネル）トップ -->
          <path d="M26,34 L26,18 L36,18 L36,25 L44,25 L44,18 L56,18 L56,25 L64,25 L64,18 L74,18 L74,34 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- ゴーレムの光るバイザーアイ -->
          <rect x="35" y="40" width="30" height="10" rx="5" fill="#0f172a"/>
          <g class="anim-3d-blink">
            <circle cx="43" cy="45" r="3.5" fill="${palette.ring}"/>
            <circle cx="57" cy="45" r="3.5" fill="${palette.ring}"/>
          </g>
          <!-- 胸のコアエンブレム -->
          <polygon points="50,55 58,64 50,73 42,64" fill="${palette.accent}" stroke="#0f172a" stroke-width="1.8"/>
        </g>
      `;
    } else if (type === 'q') {
      // クイーン：輝くティアラと光の羽衣をまとった3Dエンプレス（無双の女帝）
      charBody = `
        <g class="anim-3d-float">
          <!-- 光のオーラリング -->
          <circle class="anim-3d-aura" cx="50" cy="45" r="32" fill="none" stroke="${palette.accentLight}" stroke-width="2" stroke-dasharray="6,4" opacity="0.7"/>
          <!-- ロイヤルマント＆ドレス -->
          <path d="M20,78 Q26,48 50,48 Q74,48 80,78 Z" fill="${palette.cape}" stroke="#0f172a" stroke-width="2.2"/>
          <path d="M32,78 Q38,52 50,52 Q62,52 68,78 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2"/>
          <!-- 顔 -->
          <circle cx="50" cy="39" r="15" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- 5連ジュエル・ティアラ冠 -->
          <path d="M32,30 L28,14 L40,24 L50,10 L60,24 L72,14 L68,30 Z" fill="${palette.accent}" stroke="#0f172a" stroke-width="2"/>
          <circle cx="28" cy="13" r="2.8" fill="#fff"/>
          <circle cx="50" cy="9" r="3.5" fill="#38bdf8"/>
          <circle cx="72" cy="13" r="2.8" fill="#fff"/>
          <!-- 美しい瞳 -->
          <g class="anim-3d-blink">
            <ellipse cx="44" cy="40" rx="3" ry="4" fill="${palette.eye}"/>
            <circle cx="43" cy="38.5" r="1.3" fill="#fff"/>
            <ellipse cx="56" cy="40" rx="3" ry="4" fill="${palette.eye}"/>
            <circle cx="55" cy="38.5" r="1.3" fill="#fff"/>
          </g>
          <ellipse cx="38" cy="44" rx="3" ry="1.5" fill="${palette.cheek}" opacity="0.7"/>
          <ellipse cx="62" cy="44" rx="3" ry="1.5" fill="${palette.cheek}" opacity="0.7"/>
        </g>
      `;
    } else if (type === 'k') {
      // キング：黄金の十字王冠と覇王マントをまとった3Dキャプテン王
      charBody = `
        <g class="anim-3d-bob">
          <!-- 覇王の黄金縁取りマント -->
          <path d="M16,78 Q20,44 50,44 Q80,44 84,78 Z" fill="${palette.cape}" stroke="${palette.accent}" stroke-width="2.8"/>
          <!-- 王の鎧ボディ -->
          <path d="M30,78 L34,48 L66,48 L70,78 Z" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <polygon points="50,53 57,63 50,73 43,63" fill="${palette.accent}" stroke="#0f172a" stroke-width="1.8"/>
          <!-- 顔 -->
          <circle cx="50" cy="39" r="15.5" fill="url(#bodyGrad_${uid})" stroke="#0f172a" stroke-width="2.2"/>
          <!-- キングの立体クロス王冠 -->
          <path d="M31,30 L31,17 L42,23 L50,15 L58,23 L69,17 L69,30 Z" fill="${palette.accent}" stroke="#0f172a" stroke-width="2.2"/>
          <!-- 王冠頂上の十字架 -->
          <path d="M47,4 L53,4 L53,16 L47,16 Z M43,8 L57,8 L57,12 L43,12 Z" fill="${palette.accentLight}" stroke="#0f172a" stroke-width="1.5"/>
          <!-- 瞳と自信に満ちた笑顔 -->
          <g class="anim-3d-blink">
            <ellipse cx="44" cy="39" rx="3.2" ry="4.2" fill="${palette.eye}"/>
            <circle cx="43" cy="37.5" r="1.4" fill="#fff"/>
            <ellipse cx="56" cy="39" rx="3.2" ry="4.2" fill="${palette.eye}"/>
            <circle cx="55" cy="37.5" r="1.4" fill="#fff"/>
          </g>
          <path d="M45,46 Q50,50 55,46" fill="none" stroke="${palette.eye}" stroke-width="2.2" stroke-linecap="round"/>
        </g>
      `;
    }

    return `
      <svg class="piece-3d-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bodyGrad_${uid}" cx="32%" cy="28%" r="70%">
            <stop offset="0%" stop-color="${palette.bodyLight}"/>
            <stop offset="55%" stop-color="${palette.bodyMid}"/>
            <stop offset="100%" stop-color="${palette.bodyDark}"/>
          </radialGradient>
          <linearGradient id="pedestalGrad_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${palette.baseMid}"/>
            <stop offset="35%" stop-color="${palette.baseTop}"/>
            <stop offset="100%" stop-color="${palette.baseBot}"/>
          </linearGradient>
        </defs>
        <!-- 床のドロップシャドウ -->
        <ellipse cx="50" cy="91" rx="36" ry="7" fill="rgba(0,0,0,0.45)"/>
        <!-- 3D立体チェス台座（シリンダー） -->
        <path d="M18,80 L18,87 A32,7 0 0,0 82,87 L82,80 Z" fill="url(#pedestalGrad_${uid})" stroke="#0f172a" stroke-width="2"/>
        <ellipse cx="50" cy="80" rx="32" ry="7.5" fill="${palette.baseTop}" stroke="${palette.ring}" stroke-width="2.5"/>
        <!-- キャラクター本体 -->
        ${charBody}
      </svg>
    `;
  },

  // ---------------------------------------------------------
  // 2. 仲間＆敵ボスのアニメーション付き2D/3D風キャラクターSVG
  // ---------------------------------------------------------
  getCharacterAvatarSVG(charKey) {
    const avatars = {
      // キャプテン・ケンスケ（勇者海賊キャプテン）
      kensuke: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="kenSkin" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#fef3c7"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-bob">
            <!-- 赤い海賊マント -->
            <path d="M22,110 Q28,68 60,68 Q92,68 98,110 Z" fill="#dc2626" stroke="#0f172a" stroke-width="3"/>
            <!-- 青いキャプテンコート -->
            <path d="M34,110 L40,72 L80,72 L86,110 Z" fill="#1d4ed8" stroke="#f59e0b" stroke-width="2.5"/>
            <!-- 顔 -->
            <circle cx="60" cy="54" r="24" fill="url(#kenSkin)" stroke="#0f172a" stroke-width="2.8"/>
            <!-- カッコいい海賊キャプテンハット -->
            <path d="M16,44 Q60,8 104,44 Q60,36 16,44 Z" fill="#0f172a" stroke="#f59e0b" stroke-width="3"/>
            <circle cx="60" cy="29" r="7" fill="#f59e0b"/>
            <!-- 輝く目 -->
            <g class="anim-3d-blink">
              <ellipse cx="50" cy="55" rx="4" ry="5.5" fill="#0f172a"/>
              <circle cx="48.5" cy="53" r="1.8" fill="#fff"/>
              <ellipse cx="70" cy="55" rx="4" ry="5.5" fill="#0f172a"/>
              <circle cx="68.5" cy="53" r="1.8" fill="#fff"/>
            </g>
            <path d="M52,65 Q60,72 68,65" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
          </g>
        </svg>
      `,
      // 参謀タコ・オクトパス（WMF15記念相棒）
      tako: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="takoGrad" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stop-color="#fb7185"/>
              <stop offset="60%" stop-color="#e11d48"/>
              <stop offset="100%" stop-color="#881337"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-float">
            <!-- うねる8本足 -->
            <path class="anim-3d-wing" d="M25,78 Q10,92 22,104 Q34,108 38,90" fill="none" stroke="url(#takoGrad)" stroke-width="10" stroke-linecap="round"/>
            <path class="anim-3d-hoof" d="M45,82 Q38,105 50,108" fill="none" stroke="url(#takoGrad)" stroke-width="10" stroke-linecap="round"/>
            <path class="anim-3d-wing" d="M75,82 Q82,105 70,108" fill="none" stroke="url(#takoGrad)" stroke-width="10" stroke-linecap="round"/>
            <path class="anim-3d-hoof" d="M95,78 Q110,92 98,104 Q86,108 82,90" fill="none" stroke="url(#takoGrad)" stroke-width="10" stroke-linecap="round"/>
            <!-- 3Dタコ頭 -->
            <ellipse cx="60" cy="54" rx="32" ry="28" fill="url(#takoGrad)" stroke="#0f172a" stroke-width="2.8"/>
            <!-- 知的な参謀ゴーグル＆海賊帽 -->
            <path d="M34,32 L60,14 L86,32 Z" fill="#1e3a8a" stroke="#f59e0b" stroke-width="2.5"/>
            <g class="anim-3d-blink">
              <circle cx="47" cy="52" r="6" fill="#fff" stroke="#0f172a" stroke-width="2"/>
              <circle cx="47" cy="52" r="3" fill="#0f172a"/>
              <circle cx="73" cy="52" r="6" fill="#fff" stroke="#0f172a" stroke-width="2"/>
              <circle cx="73" cy="52" r="3" fill="#0f172a"/>
            </g>
            <!-- タコの口 -->
            <circle cx="60" cy="64" r="6" fill="#881337" stroke="#fecdd3" stroke-width="2.5"/>
          </g>
        </svg>
      `,
      // 蒼天のワシ・イーグル（WMF13記念相棒）
      washi: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="washiGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#38bdf8"/>
              <stop offset="60%" stop-color="#0284c7"/>
              <stop offset="100%" stop-color="#1e3a8a"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-float">
            <!-- 羽ばたく大きな翼 -->
            <path class="anim-3d-wing" d="M32,64 Q4,30 14,76 Q24,88 38,78 Z" fill="url(#washiGrad)" stroke="#0f172a" stroke-width="2.5"/>
            <path class="anim-3d-wing" d="M88,64 Q116,30 106,76 Q96,88 82,78 Z" fill="url(#washiGrad)" stroke="#0f172a" stroke-width="2.5"/>
            <!-- ボディ＆白い頭部 -->
            <ellipse cx="60" cy="70" rx="24" ry="26" fill="url(#washiGrad)" stroke="#0f172a" stroke-width="2.5"/>
            <circle cx="60" cy="46" r="22" fill="#f8fafc" stroke="#0f172a" stroke-width="2.5"/>
            <!-- パイロットゴーグル -->
            <rect x="38" y="26" width="44" height="10" rx="5" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>
            <!-- 鋭い目と黄金のクチバシ -->
            <g class="anim-3d-blink">
              <circle cx="49" cy="45" r="4.2" fill="#0f172a"/>
              <circle cx="48" cy="43.5" r="1.5" fill="#fff"/>
              <circle cx="71" cy="45" r="4.2" fill="#0f172a"/>
              <circle cx="70" cy="43.5" r="1.5" fill="#fff"/>
            </g>
            <polygon points="50,50 70,50 60,66" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>
          </g>
        </svg>
      `,
      // 機巧へび・スネーク（WMF9記念相棒）
      hebi: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="hebiGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#4ade80"/>
              <stop offset="60%" stop-color="#16a34a"/>
              <stop offset="100%" stop-color="#14532d"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-bob">
            <!-- とぐろを巻くメカニック・ボディ -->
            <ellipse cx="60" cy="92" rx="34" ry="12" fill="url(#hebiGrad)" stroke="#0f172a" stroke-width="2.5"/>
            <ellipse cx="60" cy="78" rx="26" ry="10" fill="url(#hebiGrad)" stroke="#0f172a" stroke-width="2.5"/>
            <!-- コブラフード＆ヘッド -->
            <path d="M32,52 Q24,26 60,22 Q96,26 88,52 Q74,68 60,68 Q46,68 32,52 Z" fill="url(#hebiGrad)" stroke="#f59e0b" stroke-width="2.8"/>
            <g class="anim-3d-blink">
              <ellipse cx="48" cy="44" rx="4" ry="5" fill="#fef08a"/>
              <ellipse cx="48" cy="44" rx="1.5" ry="4" fill="#0f172a"/>
              <ellipse cx="72" cy="44" rx="4" ry="5" fill="#fef08a"/>
              <ellipse cx="72" cy="44" rx="1.5" ry="4" fill="#0f172a"/>
            </g>
            <!-- ピロピロ動く赤い舌 -->
            <path class="anim-3d-weapon" d="M60,62 L60,75 L55,80 M60,75 L65,80" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
          </g>
        </svg>
      `,
      // 炎の竜騎士・フレアナイト
      knight_flare: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="dragonGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#fb923c"/>
              <stop offset="60%" stop-color="#dc2626"/>
              <stop offset="100%" stop-color="#7f1d1d"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-gallop">
            <path class="anim-3d-wing" d="M28,62 Q4,24 12,72 Z" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>
            <path class="anim-3d-wing" d="M92,62 Q116,24 108,72 Z" fill="#f59e0b" stroke="#0f172a" stroke-width="2.5"/>
            <circle cx="60" cy="60" r="28" fill="url(#dragonGrad)" stroke="#0f172a" stroke-width="2.8"/>
            <polygon points="36,38 26,14 48,30" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
            <polygon points="84,38 94,14 72,30" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
            <g class="anim-3d-blink">
              <circle cx="48" cy="56" r="4.5" fill="#fef08a"/>
              <circle cx="72" cy="56" r="4.5" fill="#fef08a"/>
            </g>
          </g>
        </svg>
      `,
      // 星読みの女帝・ステラクイーン
      queen_stella: `
        <svg class="char-anim-svg" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="stellaGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#e879f9"/>
              <stop offset="60%" stop-color="#9333ea"/>
              <stop offset="100%" stop-color="#3b0764"/>
            </radialGradient>
          </defs>
          <g class="anim-3d-float">
            <circle class="anim-3d-aura" cx="60" cy="60" r="46" fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="6,4"/>
            <circle cx="60" cy="62" r="26" fill="url(#stellaGrad)" stroke="#fef08a" stroke-width="2.5"/>
            <polygon points="36,42 32,18 48,32 60,12 72,32 88,18 84,42" fill="#f59e0b" stroke="#0f172a" stroke-width="2"/>
            <g class="anim-3d-blink">
              <circle cx="50" cy="60" r="4" fill="#fff"/>
              <circle cx="70" cy="60" r="4" fill="#fff"/>
            </g>
          </g>
        </svg>
      `
    };

    if (avatars[charKey]) return avatars[charKey];

    // 敵ボス（ステージ1〜6）用の汎用3Dアニメーションボスアバター
    const bossColors = {
      boss_1: { c1: '#f43f5e', c2: '#881337', hat: '#38bdf8', acc: '#fef08a' },
      boss_2: { c1: '#eab308', c2: '#713f12', hat: '#1e293b', acc: '#22c55e' },
      boss_3: { c1: '#38bdf8', c2: '#0c4a6e', hat: '#e0f2fe', acc: '#f59e0b' },
      boss_4: { c1: '#fde047', c2: '#a16207', hat: '#7e22ce', acc: '#38bdf8' },
      boss_5: { c1: '#ef4444', c2: '#450a0a', hat: '#0f172a', acc: '#f59e0b' },
      boss_6: { c1: '#c084fc', c2: '#3b0764', hat: '#f59e0b', acc: '#fef08a' }
    };
    const bc = bossColors[charKey] || bossColors.boss_1;

    return `
      <svg class="char-anim-svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="bg_${charKey}" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${bc.c1}"/>
            <stop offset="100%" stop-color="${bc.c2}"/>
          </radialGradient>
        </defs>
        <g class="anim-3d-heavy">
          <!-- オーラ -->
          <circle class="anim-3d-aura" cx="60" cy="62" r="46" fill="none" stroke="${bc.acc}" stroke-width="2.5" stroke-dasharray="8,5"/>
          <!-- ボスマント -->
          <path d="M16,110 Q24,62 60,62 Q96,62 104,110 Z" fill="${bc.c2}" stroke="${bc.acc}" stroke-width="2.5"/>
          <!-- 3Dヘッド -->
          <circle cx="60" cy="58" r="26" fill="url(#bg_${charKey})" stroke="#0f172a" stroke-width="3"/>
          <!-- ボス海賊冠 -->
          <path d="M22,42 Q60,10 98,42 L86,48 L34,48 Z" fill="${bc.hat}" stroke="${bc.acc}" stroke-width="2.5"/>
          <!-- 迫力のある光る目 -->
          <g class="anim-3d-blink">
            <polygon points="40,52 54,56 42,60" fill="${bc.acc}"/>
            <polygon points="80,52 66,56 78,60" fill="${bc.acc}"/>
          </g>
          <!-- 不敵な笑み -->
          <path d="M44,70 Q60,80 76,70" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
          <!-- 武器エフェクト -->
          <g class="anim-3d-weapon">
            <path d="M92,76 L112,32 L116,38 L98,82 Z" fill="${bc.acc}" stroke="#0f172a" stroke-width="2"/>
          </g>
        </g>
      </svg>
    `;
  }
};
