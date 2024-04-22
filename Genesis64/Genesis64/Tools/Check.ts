
class Check {

	/**
	 * Returns the base type of a token, ie: aint -> number
	 * @param			tkn			Token to get the type from
	 * @returns			Tokentype
	 **/
	public static GetBaseType(tkn: G64Token): Tokentype {

		if (this.IsNum(tkn))
			return Tokentype.num;

		if (this.IsStr(tkn))
			return Tokentype.str;

		return tkn.Type;
	}

	/**
	 * Checks if the given token can be executed
	 * @param			tkn			Token to check
	 * @returns			boolean
	 */
	public static IsCmd(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.cmd ||
			tkn.Type == Tokentype.fnnum ||
			tkn.Type == Tokentype.fnstr ||
			tkn.Type == Tokentype.fnout);
	}

	/**
	 * Checks if the given token is a value (literal or number) 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	public static IsPlainType(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.num
			|| tkn.Type == Tokentype.str
			|| this.IsVar(tkn));
	}

	/**
	 * Checks if the given token returns a number 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	public static IsNum(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.num
			|| tkn.Type == Tokentype.fnnum
			|| tkn.Type == Tokentype.vnum
			|| tkn.Type == Tokentype.vint
			|| tkn.Type == Tokentype.anum
			|| tkn.Type == Tokentype.aint
			|| tkn.Type == Tokentype.ops);
	}

	/**
	 * Checks if the given token returns a string 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	public static IsStr(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.str
			|| tkn.Type == Tokentype.fnstr
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.astr
			|| tkn.Type == Tokentype.ops);
	}

	/**
	 * Checks if the given token is variable 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	public static IsVar(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.vnum
			|| tkn.Type == Tokentype.vint
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.anum
			|| tkn.Type == Tokentype.aint
			|| tkn.Type == Tokentype.astr)
	};

	/**
	 * Checks if the given token is an array
	 * @param			tkn			Token to check
	 * @returns			boolean
	 */
	public static IsArray(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.anum || tkn.Type == Tokentype.aint || tkn.Type == Tokentype.astr);
	}

	/**
	 * Checks if the given token is a number between 0 and 65535
	 * @param tkn
	 * @returns
	 */
	public static IsAdr(tkn: G64Token): boolean {
		return this.IsNum(tkn) && (tkn.Num >= 0 && tkn.Num <= 65535);
	}

	/**
	 * Checks if the given token is a number between 0 and 255
	 * @param tkn
	 * @returns
	 */
	public static IsByte(tkn: G64Token): boolean {
		return this.IsNum(tkn) && (tkn.Num >= 0 && tkn.Num <= 255);
	}

	public static IsSame(tkn1: G64Token, tkn2: G64Token): boolean {
		return (this.GetBaseType(tkn1) == this.GetBaseType(tkn2));
	}

}