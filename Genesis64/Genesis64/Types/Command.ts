
interface BasicCmd {
	Name: string;			// name of the command, ie. the command
	Abbrv: string;			// abbreviation, if any
	TknId: number[];		// token id when saving, or -1, then use pet value
	Type: Tokentype;		// type of token
}