// 本格チェスルール＆論理説明付きAIエンジン（キャスリング・プロモーション・チェック・好手判定対応）

class ChessEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.loadFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  loadFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));

    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') {
          c += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toLowerCase();
          this.board[r][c] = { type, color };
          c++;
        }
      }
    }

    this.turn = parts[1] || 'w';
    const castleStr = parts[2] || '-';
    this.castling = {
      wK: castleStr.includes('K'),
      wQ: castleStr.includes('Q'),
      bK: castleStr.includes('k'),
      bQ: castleStr.includes('q')
    };
    this.history = [];
  }

  cloneBoard(board = this.board) {
    return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  }

  inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  coordToAlgebraic(r, c) {
    return String.fromCharCode(65 + c) + (8 - r);
  }

  // 指定した盤面で targetColor の駒が (tr, tc) を攻撃しているか判定
  isSquareAttacked(tr, tc, attackerColor, board = this.board) {
    // ポーンの攻撃
    const pawnDir = attackerColor === 'w' ? 1 : -1; // 白は下(r大)から上(r小)へ攻撃するので attacker is at tr + pawnDir
    for (const dc of [-1, 1]) {
      const pr = tr + pawnDir;
      const pc = tc + dc;
      if (this.inBounds(pr, pc)) {
        const p = board[pr][pc];
        if (p && p.color === attackerColor && p.type === 'p') return true;
      }
    }

    // ナイトの攻撃
    const knightSteps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightSteps) {
      const nr = tr + dr, nc = tc + dc;
      if (this.inBounds(nr, nc)) {
        const p = board[nr][nc];
        if (p && p.color === attackerColor && p.type === 'n') return true;
      }
    }

    // キングの攻撃
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const kr = tr + dr, kc = tc + dc;
        if (this.inBounds(kr, kc)) {
          const p = board[kr][kc];
          if (p && p.color === attackerColor && p.type === 'k') return true;
        }
      }
    }

    // ルーク・クイーン（直線）
    const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of orthoDirs) {
      let r = tr + dr, c = tc + dc;
      while (this.inBounds(r, c)) {
        const p = board[r][c];
        if (p) {
          if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    // ビショップ・クイーン（斜め）
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let r = tr + dr, c = tc + dc;
      while (this.inBounds(r, c)) {
        const p = board[r][c];
        if (p) {
          if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
          break;
        }
        r += dr; c += dc;
      }
    }

    return false;
  }

  findKing(color, board = this.board) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.color === color && p.type === 'k') return { r, c };
      }
    }
    return null;
  }

  isInCheck(color, board = this.board) {
    const kPos = this.findKing(color, board);
    if (!kPos) return true;
    const enemy = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kPos.r, kPos.c, enemy, board);
  }

  // 擬似合法手の生成
  getPseudoMovesForSquare(r, c, board = this.board, castling = this.castling) {
    const piece = board[r][c];
    if (!piece) return [];
    const moves = [];
    const { type, color } = piece;
    const enemy = color === 'w' ? 'b' : 'w';

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;

      // 1歩前進
      if (this.inBounds(r + dir, c) && !board[r + dir][c]) {
        moves.push({
          from: { r, c },
          to: { r: r + dir, c },
          piece,
          captured: null,
          isPromotion: r + dir === promoRow
        });
        // 2歩前進
        if (r === startRow && !board[r + dir * 2][c]) {
          moves.push({
            from: { r, c },
            to: { r: r + dir * 2, c },
            piece,
            captured: null
          });
        }
      }
      // 斜めキャプチャー
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc;
        if (this.inBounds(nr, nc) && board[nr][nc] && board[nr][nc].color === enemy) {
          moves.push({
            from: { r, c },
            to: { r: nr, c: nc },
            piece,
            captured: board[nr][nc],
            isPromotion: nr === promoRow
          });
        }
      }
    } else if (type === 'n') {
      const steps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of steps) {
        const nr = r + dr, nc = c + dc;
        if (!this.inBounds(nr, nc)) continue;
        const target = board[nr][nc];
        if (!target || target.color === enemy) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target || null });
        }
      }
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const dirs = [];
      if (type === 'b' || type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (type === 'r' || type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (this.inBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: null });
          } else {
            if (target.color === enemy) {
              moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target });
            }
            break;
          }
          nr += dr; nc += dc;
        }
      }
    } else if (type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (!this.inBounds(nr, nc)) continue;
          const target = board[nr][nc];
          if (!target || target.color === enemy) {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, piece, captured: target || null });
          }
        }
      }

      // キャスリング
      const homeRow = color === 'w' ? 7 : 0;
      if (r === homeRow && c === 4 && !this.isInCheck(color, board)) {
        const canK = color === 'w' ? castling.wK : castling.bK;
        const canQ = color === 'w' ? castling.wQ : castling.bQ;
        // キングサイド
        if (
          canK &&
          !board[homeRow][5] &&
          !board[homeRow][6] &&
          board[homeRow][7] &&
          board[homeRow][7].type === 'r' &&
          !this.isSquareAttacked(homeRow, 5, enemy, board) &&
          !this.isSquareAttacked(homeRow, 6, enemy, board)
        ) {
          moves.push({
            from: { r, c },
            to: { r: homeRow, c: 6 },
            piece,
            captured: null,
            isCastle: 'K'
          });
        }
        // クイーンサイド
        if (
          canQ &&
          !board[homeRow][3] &&
          !board[homeRow][2] &&
          !board[homeRow][1] &&
          board[homeRow][0] &&
          board[homeRow][0].type === 'r' &&
          !this.isSquareAttacked(homeRow, 3, enemy, board) &&
          !this.isSquareAttacked(homeRow, 2, enemy, board)
        ) {
          moves.push({
            from: { r, c },
            to: { r: homeRow, c: 2 },
            piece,
            captured: null,
            isCastle: 'Q'
          });
        }
      }
    }

    return moves;
  }

  simulateMoveOnBoard(move, board = this.board) {
    const next = this.cloneBoard(board);
    const { from, to, piece, isCastle, promoteTo } = move;
    next[to.r][to.c] = {
      type: promoteTo || (move.isPromotion ? 'q' : piece.type),
      color: piece.color
    };
    next[from.r][from.c] = null;

    if (isCastle === 'K') {
      next[to.r][5] = next[to.r][7];
      next[to.r][7] = null;
    } else if (isCastle === 'Q') {
      next[to.r][3] = next[to.r][0];
      next[to.r][0] = null;
    }
    return next;
  }

  getLegalMovesForSquare(r, c, board = this.board, castling = this.castling) {
    const piece = board[r][c];
    if (!piece) return [];
    const pseudo = this.getPseudoMovesForSquare(r, c, board, castling);
    return pseudo.filter(m => {
      const nextBoard = this.simulateMoveOnBoard(m, board);
      return !this.isInCheck(piece.color, nextBoard);
    });
  }

  getAllLegalMoves(color = this.turn, board = this.board, castling = this.castling) {
    const all = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.color === color) {
          all.push(...this.getLegalMovesForSquare(r, c, board, castling));
        }
      }
    }
    return all;
  }

  makeMove(move) {
    const snapshot = {
      board: this.cloneBoard(),
      turn: this.turn,
      castling: { ...this.castling },
      move
    };
    this.history.push(snapshot);

    this.board = this.simulateMoveOnBoard(move, this.board);

    // キャスリング権利の更新
    if (move.piece.type === 'k') {
      if (move.piece.color === 'w') { this.castling.wK = false; this.castling.wQ = false; }
      else { this.castling.bK = false; this.castling.bQ = false; }
    }
    if (move.from.r === 7 && move.from.c === 7) this.castling.wK = false;
    if (move.from.r === 7 && move.from.c === 0) this.castling.wQ = false;
    if (move.from.r === 0 && move.from.c === 7) this.castling.bK = false;
    if (move.from.r === 0 && move.from.c === 0) this.castling.bQ = false;

    this.turn = this.turn === 'w' ? 'b' : 'w';
  }

  undoMove() {
    if (this.history.length === 0) return false;
    const last = this.history.pop();
    this.board = last.board;
    this.turn = last.turn;
    this.castling = last.castling;
    return true;
  }

  // 盤面評価関数（白プラス・黒マイナス）
  evaluateBoard(board = this.board) {
    const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    let score = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        let val = values[p.type] || 0;

        // 中央4マス・前進ボーナス
        const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
        if (p.type === 'n' || p.type === 'b' || p.type === 'p') {
          val += Math.round((7 - centerDist) * 6);
        }
        if (p.type === 'p') {
          const advance = p.color === 'w' ? (6 - r) : (r - 1);
          val += advance * 12;
        }

        score += p.color === 'w' ? val : -val;
      }
    }
    return score;
  }

  // プレイヤー向け最善手＆その「言語的理由」を分析するアドバイザーエンジン
  analyzeMovesForPlayer(color = 'w') {
    const moves = this.getAllLegalMoves(color);
    if (moves.length === 0) return [];
    const enemy = color === 'w' ? 'b' : 'w';

    const scoredMoves = moves.map(m => {
      const nextBoard = this.simulateMoveOnBoard(m, this.board);
      let score = this.evaluateBoard(nextBoard) * (color === 'w' ? 1 : -1);
      const reasons = [];

      // チェックメイト判定
      const enemyReplies = this.getAllLegalMoves(enemy, nextBoard, this.castling);
      const givesCheck = this.isInCheck(enemy, nextBoard);
      if (enemyReplies.length === 0 && givesCheck) {
        score += 99999;
        reasons.push('👑 敵のキングを逃がさない【チェックメイト】の決め手だ！');
      } else if (givesCheck) {
        score += 45;
        reasons.push('⚡ 敵のキングを直接狙う【チェック】で主導権を握れるよ！');
      }

      // 駒得判定
      if (m.captured) {
        const capPts = PIECE_INFO[m.captured.type].points;
        const myPts = PIECE_INFO[m.piece.type].points;
        reasons.push(`⚔️ 敵の${PIECE_INFO[m.captured.type].name}（${capPts}点）をキャプチャーできるぞ！`);
      }

      // 移動先の安全性チェック
      const isDestDanger = this.isSquareAttacked(m.to.r, m.to.c, enemy, nextBoard);
      if (isDestDanger) {
        const myPts = PIECE_INFO[m.piece.type].points * 95;
        score -= myPts;
      } else {
        reasons.push('🛡️ 移動先のマスは敵に狙われていない【安全マス】だよ！');
      }

      // 中央制圧ボーナス
      if ((m.to.r === 3 || m.to.r === 4) && (m.to.c === 3 || m.to.c === 4)) {
        score += 35;
        reasons.push('🟨 盤面の要所【中央4マス（センター）】を支配できる好手！');
      }

      // キャスリング
      if (m.isCastle) {
        score += 65;
        reasons.push('🏰 王様を安全地帯へ守りながらルークも中央へ出す【キャスリング】！');
      }

      // 二股攻撃（フォーク）検出
      let attackedHighValueCount = 0;
      for (let rr = 0; rr < 8; rr++) {
        for (let cc = 0; cc < 8; cc++) {
          const target = nextBoard[rr][cc];
          if (target && target.color === enemy && PIECE_INFO[target.type].points >= 3) {
            const subMoves = this.getPseudoMovesForSquare(m.to.r, m.to.c, nextBoard, this.castling);
            if (subMoves.some(sm => sm.to.r === rr && sm.to.c === cc)) {
              attackedHighValueCount++;
            }
          }
        }
      }
      if (attackedHighValueCount >= 2 && !isDestDanger) {
        score += 90;
        reasons.push('🐍 1つの駒で2つ以上の強い敵を同時に狙う必殺【フォーク（二股攻撃）】だ！');
      }

      if (reasons.length === 0) {
        reasons.push('🚀 駒の働きを広げて次の攻撃を準備する堅実な一手だよ！');
      }

      return { move: m, score, reasons, isDestDanger };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves;
  }

  // 敵AIの思考（ステージ難易度に応じる）
  chooseAIMove(depth = 2, randomness = 0.2) {
    const legalMoves = this.getAllLegalMoves('b');
    if (legalMoves.length === 0) return null;

    // ランダム性がある場合
    if (Math.random() < randomness) {
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    let bestMove = legalMoves[0];
    let bestScore = Infinity; // 黒は評価値を最小化したい

    for (const m of legalMoves) {
      const nextBoard = this.simulateMoveOnBoard(m, this.board);
      const val = this.minimax(nextBoard, depth - 1, -Infinity, Infinity, true);
      // 少しだけ揺らぎを入れて自然な動きにする
      const jitter = (Math.random() - 0.5) * 15;
      if (val + jitter < bestScore) {
        bestScore = val + jitter;
        bestMove = m;
      }
    }
    return bestMove;
  }

  minimax(board, depth, alpha, beta, isMaximizingWhite) {
    if (depth <= 0) {
      return this.evaluateBoard(board);
    }

    const color = isMaximizingWhite ? 'w' : 'b';
    const moves = this.getAllLegalMoves(color, board, this.castling);
    if (moves.length === 0) {
      if (this.isInCheck(color, board)) {
        return isMaximizingWhite ? -50000 - depth * 100 : 50000 + depth * 100;
      }
      return 0; // ステイルメイト
    }

    if (isMaximizingWhite) {
      let maxEval = -Infinity;
      for (const m of moves) {
        const nextB = this.simulateMoveOnBoard(m, board);
        const ev = this.minimax(nextB, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const m of moves) {
        const nextB = this.simulateMoveOnBoard(m, board);
        const ev = this.minimax(nextB, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
