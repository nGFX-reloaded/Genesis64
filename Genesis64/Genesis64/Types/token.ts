enum Tokentype {
	nop     /*  0, nop / rem */,
	err     /*  1, if something couldn't be parsed, id == syntax error */,
	cmd     /*  2, commands, PRINT */,
	fnnum   /*  3, numerical methods, SIN(i) */,
	fnstr   /*  4, string methods, LEFT$("", i) */,
	fnout   /*  5, output methods, SPC(i) */,
	ops     /*  6, operators, +, -, also: =,<,> ... */,
	not     /*  7, NOT */,
	num     /*  8, a single number, 1.0 */,
	str     /*  9, string, either {1} or "abc" */,
	vnum    /* 10, num var, A */,
	vint    /* 11, int var, A% */,
	vstr    /* 12, str var, A$ */,
	anum    /* 13, num array, A[x] */,
	aint    /* 14, int array, A%[x] */,
	astr    /* 15, string array, A$[x] */,
	link    /* 16, print links: spc, "," and ";" */,
	eop     /* 17, token exec ok, end of part */,
	eol     /* 18, token exec ok, end of line */,
	jmp     /* 19, jump (goto, gosub, etc) */,
	end     /* 20, prg ends here */,
	any		/* 21, any token, used for error checking */,
	var		/* 22, any var, used for error checking */,
	adr		/* 23, any address, used for error checking */,
	byte	/* 24, any byte, used for error checking */,
	line	/* 25, a line, stores line tokens */,
	sysvar	/* 26, system var, like ti and ti$ */,
}

interface G64Token {
	Type: Tokentype;
	Id?: number;					// basic cmd/fn/error id
	Name?: string;				// if var, stores var's name, if error, the error's name

	Num?: number;				// number data
	Str?: string;				// string data
	Values?: G64Token[];		// ref to token array

	Hint?: string;				// error message, or other debug data
}