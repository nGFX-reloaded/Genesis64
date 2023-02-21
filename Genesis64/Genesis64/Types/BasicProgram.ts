type BasicProgram = {
	Name: string;			// name of the prg (after load or 1st save with a name)
	Code: string;			// prgs unmodified code ?? NEEDED ??
	Lines: PrgLine[];		// line's o code
}

type PrgLine = {
	Ln: number;				// Line number, -1 if direct
	Code: string;			// de-abbrv'ed code of this line
	Tokens: Token[];		// compiled tokens
	// tokenMap?
}