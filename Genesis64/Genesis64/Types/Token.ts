enum Tokentype {
    nop     /*  0, nop / rem */,
    err     /*  1, if something couldn't be parsed, id == syntax error */,
    cmd     /*  2, commands, PRINT */,
    fnnum   /*  3, numercal methods, SIN(i) */,
    fnstr   /*  4, string methods, LEFT$("", i) */,
    fnout   /*  5, output methods, SPC(i) */,
    ops     /*  6, operators, +, -, ... */,
    comp    /*  7, compare: <, == ... */,
    num     /*  8, a single number, 1.0 */,
    int     /*  9, an interger, 1 */,
    str     /* 10, string, either {1} or "abc" */,
    vnum    /* 11, num var, A */,
    vint    /* 12, int var, A% */,
    vstr    /* 13, str var, A$ */,
    anum    /* 14, num array, A[x] */,
    aint    /* 15, int array, A%[x] */,
    astr    /* 16, string array, A$[x] */,
    link    /* 17, print links: spc, "," and ";" */,
    eop     /* 18, token exec ok, end of part */,
    run     /* 19, token exec ok, end of line */,
    jmp     /* 20, jump (goto, gosub, etc) */,
    end     /* 21, prg ends here */
}

type Token = {
    Type: Tokentype;
    Id: number;				// basic cmd/fn/error id
    Data?: number;			// if sub token, the id of the cmd

    Name?: string;			// if var, stores var's name

    Order?: number;			// this will remove the need for the token order array

    Num?: number;			// number data
    Str?: string;			// string data
    Values?: Array<Token>;	// ref to token array

    Fn?: Function;			// pointer to exec method
}
