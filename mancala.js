const heroStart = 0,
    heroEnd = 5,
    heroScore = 6,
    vilStart = 7,
    vilEnd = 12,
    vilScore = 13;

function countSide(array, start, end) {
    var count = 0;
    for (var i = start; i < end; i++) {
        count += array[i];
    }
    return count;
}

class Mancala {
    constructor() {
        this.board = new Array(14);
        (this.heroSide = 0), (this.vilSide = 0);
        this.isHeroTurn = true;
        this.gameInit();
        this.winner = undefined;
    }

    gameInit() {
        this.board.fill(4);
        this.board[heroScore] = 0;
        this.board[vilScore] = 0;
        this.heroSide = countSide(this.board, heroStart, heroEnd);
        this.vilSide = countSide(this.board, vilStart, vilEnd);
        this.isHeroTurn = Math.random() < 0.5;
        this.winner = undefined;

        if (this.isHeroTurn) console.log("Player 1's turn");
        else console.log("Player 2's turn");
    }

    checkPit(choosenPit) {
        if (this.isHeroTurn) {
            if (
                choosenPit >= heroStart &&
                choosenPit <= heroEnd &&
                this.board[choosenPit] != 0
            )
                return true;
            return false;
        }
        if (!this.isHeroTurn) {
            if (
                choosenPit >= vilStart &&
                choosenPit <= vilEnd &&
                this.board[choosenPit] != 0
            )
                return true;
            return false;
        }
    }

    move(choosenPit) {
        const adjDict = {
            0: 12,
            1: 11,
            2: 10,
            3: 9,
            4: 8,
            5: 7,
            7: 5,
            8: 4,
            9: 3,
            10: 2,
            11: 1,
            12: 0,
        };

        let rocks = this.board[choosenPit];
        this.board[choosenPit] = 0;
        let startPos = choosenPit + 1;
        let endPosition = 0;

        while (rocks != 0) {
            for (let i = startPos; i < this.board.length; i++) {
                if (rocks == 0) break;

                // Anti-Scoring
                if (
                    (i == heroScore && !this.isHeroTurn) ||
                    (i == vilScore && this.isHeroTurn)
                )
                    continue;

                rocks--;
                this.board[i]++;
                endPosition = i;

                // Special Rule: if lands in empty, yoink and score opponents adjacent
                if (
                    this.isHeroTurn &&
                    rocks == 0 &&
                    endPosition < heroScore &&
                    this.board[i] == 1 &&
                    this.board[adjDict[i]] != 0
                ) {
                    this.board[heroScore] += this.board[adjDict[i]];
                    console.log("yoink");
                    this.board[adjDict[i]] = 0;
                } else if (
                    !this.isHeroTurn &&
                    rocks == 0 &&
                    endPosition < vilScore &&
                    endPosition > heroScore &&
                    this.board[i] == 1 &&
                    this.board[adjDict[i]] != 0
                ) {
                    this.board[vilScore] += this.board[adjDict[i]];
                    console.log("yoink");
                    this.board[adjDict[i]] = 0;
                }
            }
            startPos = 0; // reset index at end of board
        }

        // Special Rule: if ends in a score, have another turn
        if (
            (this.isHeroTurn && endPosition != heroScore) ||
            (!this.isHeroTurn && endPosition != vilScore)
        ) {
            this.isHeroTurn = !this.isHeroTurn;
        }

        this.heroSide = countSide(this.board, heroStart, heroEnd);
        this.vilSide = countSide(this.board, vilStart, vilEnd);
        if (this.heroSide == 0 || this.vilSide == 0) {
            for (var i = 0; i < heroScore; i++) {
                this.board[heroScore] += this.board[i];
                this.board[i] = 0;
            }
            for (var i = heroScore + 1; i < vilScore; i++) {
                this.board[vilScore] += this.board[i];
                this.board[i] = 0;
            }

            this.winner =
                this.board[heroScore] > this.board[vilScore]
                    ? "Player 1"
                    : "Player 2";
            return true;
        }
        return false;
    }
}

export { Mancala };
