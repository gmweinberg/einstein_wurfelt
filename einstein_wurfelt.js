(() => {
	const theCanvas  = document.getElementById("theCanvas");
	const ctx = theCanvas.getContext('2d');
	ctx.font = "16px";
	const header_height = 100;
	const grid_width = 300;
	//ctx.fillStyle = '#F0DB4F';
	//ctx.strokeStyle = 'red';
	//ctx.fillRect(50, 50, 150, 100);
        //ctx.strokeRect(50, 50, 150, 100);
	/* our position will have ptm (player to move, red = 1, blue=-1) and a "square" array indicating
	 * what is at each position, 0 for nothing, positive number for red piece, negative for blue piece
	 */
	let winner = 0;

	function get_start() {
		const pos = {ptm:1, squares: Array(25), die: 1 + Math.floor(Math.random() * 6)};
		pos.squares.fill(0);
		let rc = 3;
		let x = 0;
		let y = 0;
		for (let ii = 0; ii < 6; ii++){
		    pos.squares[y * 5 + x] = ii + 1; //red
		    pos.squares[(4 - y) * 5 + (4 - x)] = - (ii + 1); // blue
		    x += 1;
		    if (x == rc){
			x = 0;
			y += 1;
                        rc -= 1;

		    }
		}
		return pos;
	}
	function draw_pos(ctx, pos){
		ctx.clearRect(0, 0, grid_width, grid_width + header_height);
		//draw grid

		for (let ii = 0; ii < 6; ii++){
			ctx.strokeStyle = 'black';
			ctx.moveTo(0, header_height + grid_width  *  ii /5.0);
			ctx.lineTo(grid_width, header_height + grid_width  * ii /5.0);
			ctx.stroke();
			ctx.moveTo(grid_width  * ii /5.0, header_height)
			ctx.lineTo(grid_width  * ii /5.0, header_height + grid_width)
			ctx.stroke();
		}
		for (let ii = 0; ii < 25; ii++){
			let x = ii % 5; //  coordinate of square in grid
			let y = Math.floor(ii / 5);
			let xpos = x * grid_width / 5 + grid_width / 10 - 3; //position in canvas
			let ypos = header_height + y * grid_width / 5 + grid_width/ 10 + 2;
			if (pos.squares[ii] < 0){
			    ctx.fillStyle = 'blue';
			    ctx.fillText(-1 *pos.squares[ii], xpos, ypos);
			} else if (pos.squares[ii] > 0){
			    ctx.fillStyle = 'red';
			    ctx.fillText(pos.squares[ii], xpos, ypos);
			}
		}
		if (pos.ptm === 1){
			ctx.fillStyle = 'red';
			ctx.fillText(pos.die, 20, 20);
		} else {
			ctx.fillStyle = 'blue';
			ctx.fillText(pos.die, 20, 20);
		}
		if (winner !== 0) {
			if (winner === 1) {
				 ctx.fillStyle = 'red';
			} else {
				ctx.fillStyle = 'blue';
			}
			ctx.fillText(":-)",  80, 20);
		} else {
			ctx.fillStyle = 'black';
			 ctx.fillText(":-|", 80, 20);
		}
	}
	function owner(piece){
		if (piece > 0) return 1;
		if (piece < 0) return -1;
		return 0;
	}
        /* find legal moves in a positon. Returns a list of lists [[from_pos, to_pos]]*/
	function get_moves(pos){
		let piece;
		let diff;
	    	if (pos.ptm ===1){
		    piece = pos.die;
		    diff = 1; // player can increase x, y or both by this amount
	    	} else {
		    piece = -1 * pos.die;
		    diff = -1;
	    	}
	    	let moves = Array();
		for (let offset = 0; offset < 6; offset -= 1){
			for (let ii = 0; ii < 25; ii++){
				let there = pos.squares[ii]; //entity of piece there
				if (owner(there) == owner(piece) && ((there + offset == piece) || (there - offset == piece))){
					if (pos.ptm == 1){
						if (ii % 5 < 4){
							moves.push([ii, ii + 1]);
						}
						if (Math.floor(ii / 5) < 4) {
							moves.push([ii, ii + 5]);
						}
						if ((ii % 5 < 4) && (Math.floor(ii / 5) < 4)){
							moves.push([ii, ii + 6]);
						}
					} else {
						if (ii % 5 > 0){
							moves.push([ii, ii - 1]);
						}
						if (Math.floor(ii / 5) > 0 ) {
							moves.push([ii, ii - 5]);
						}
						if ((ii % 5 > 0 ) && (Math.floor(ii / 5) > 0)){
							moves.push([ii, ii - 6]);
						}
					}
				}
			}
			if (moves.length > 0) {
				break;
			}
		}
                return moves;
	}

	function apply_move(pos, move){
		let newpos = structuredClone(pos);
		newpos.squares[move[1]] =  pos.squares[move[0]]
		newpos.squares[move[0]] = 0;
		newpos.ptm = -1 * (pos.ptm);
		newpos.die = 1 + Math.floor(Math.random() * 6);
		return newpos;
	}

	function get_winner(pos) {
		if (pos.squares[24] > 0) return 1;
		if (pos.squares[0] < 0) return -1;
		let rc = 0;
		let bc = 0;
		for (let ii = 0; ii < 25; ii++){
			if (pos.squares[ii] > 0) rc += 1;
			if (pos.squares[ii] < 0) bc += 1;
		}
		if (rc === 0) return -1;
		if (bc === 0) return 1;
		return 0;
	}
        // play any legal move with equal probability
	function get_random_move(pos){
		const moves = get_moves(pos);
		return moves[Math.floor(Math.random() * moves.length)];
	}
        // pretend going forward after this one all moves will be played with equal probability.
	// play the move that gives the highest probability of winning in multi carlo simulation 
	function get_monte_carlo_move(pos){
		const moves = get_moves(pos);
		const tries = 50;
		let scores = Array(moves.length);
		scores.fill(0);
		for (ii = 0; ii < moves.length; ii++){
			for (iii = 0; iii < tries; iii++){ 
			    let move = moves[ii];
			    let npos = apply_move(pos, move);
			    let mwinner = get_winner(npos);
			    while (mwinner === 0){
				    let nmove = get_random_move(npos);
				    npos = apply_move(npos, nmove);
				    mwinner = get_winner(npos);
			    }
			    if (mwinner == pos.ptm){
				    scores[ii] += 1;
			    }
			}
		}
		let max = 0;
		let best = 0;
		for (ii = 0; ii < moves.length; ii++){
			console.log(moves[ii], scores[ii]);
			if (scores[ii] > max){
				max = scores[ii];
				best = ii;
			}
		}
		return moves[best];

	}

	// sleep doesn't seem to be working
	function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
	let pos = get_start(); // we will want to replace rather than modify internally
	draw_pos(ctx, pos);

	function do_iter(multi) {
		//console.log('iter ' + Math.random());
	        if (winner != 0) return;
		let move;
		if (pos.ptm == 1){
			move = get_random_move(pos);
		} else {
			move = get_monte_carlo_move(pos);
		}
		pos = apply_move(pos, move);
		winner = get_winner(pos);
		draw_pos(ctx, pos);
		if (winner != 0){
			if (winner === 1){
			    console.log("Red won");
			} else {
			    console.log('Blue won');
			}
			    
		} else {
			if (multi){
				setTimeout(do_iter, 5000, true);
			}
		}
	}
	//document.addEventListener('keydown', (e) => { if (e.code == 'KeyN'){ do_iter();} 
        //} );
	do_iter(true);

})();
