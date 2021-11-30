import { Mancala } from "./mancala.js";

function main() {
    let mancala = new Mancala();
    console.log(mancala.board);
    if (mancala.checkPit(2)) mancala.move(2);
    console.log(mancala.board);

    if (mancala.checkPit(3)) mancala.move(3);
    console.log(mancala.board);

    if (mancala.checkPit(9)) mancala.move(9);
    console.log(mancala.board);
}

window.onload = main;
 