
class Check {

	public static CheckType(tkn: G64Token, cmd: BasicCmd): G64Token {


		// console.log(" ----- ----- -----\n Check param:", tkn, cmd);

		// check parameter count
		if (cmd.Param.Len === 0) {

		} else if (cmd.Param.Len > 0) {
			if (tkn.Values.length !== cmd.Param.Len) {
				tkn.Id = ErrorCodes.SYNTAX;
				tkn.Type = Tokentype.err;
				tkn.Hint = "Parameter count mismatch, expected: " + cmd.Param.Len.toString() + ", got: " + tkn.Values.length.toString() + ".";
				return tkn;
			}

			let hasError: boolean = false;
			let typeLast: Tokentype = Tokentype.err;
			const name = "'" + cmd.Name + "' ";

			for (let i: number = 0; i < cmd.Param.Type.length; i++) {

				const type: Tokentype = this.GetBaseType(tkn.Values[i]);

				switch (cmd.Param.Type[i]) {
					case ParamType.num:
					case ParamType.adr:
					case ParamType.byte:
						if (!this.IsNum(tkn.Values[i])) {
							tkn.Id = ErrorCodes.TYPE_MISMATCH;
							tkn.Type = Tokentype.err;
							tkn.Hint = name + "Parameter #" + (i + 1).toString() + ", expected: number, got: " + Tools.GetTokentypeName(this.GetBaseType(tkn.Values[i])) + ".";
							hasError = true;
						}
						//console.log("->", i, "num", this.IsNum(tkn.Values[i]));
						break;

					case ParamType.str:
						//console.log("->", i, "str", this.IsStr(tkn.Values[i]));
						break;

					case ParamType.var:
						//console.log("->", i, "var", this.IsVar(tkn.Values[i]));
						break;

					case ParamType.any:
						typeLast = this.GetBaseType(tkn.Values[i]);
						//console.log("->", i, "any", Tools.GetTokentypeName(this.GetBaseType(tkn.Values[i])));
						break;

					case ParamType.same:
						if (typeLast !== this.GetBaseType(tkn.Values[i])) {
							tkn = Tools.CreateToken(Tokentype.err, 
								name + "parameter #" + (i + 1).toString() + ", expected: " + Tools.GetTokentypeName(typeLast) + ", got: " + Tools.GetTokentypeName(this.GetBaseType(tkn.Values[i])) + ".",
								ErrorCodes.TYPE_MISMATCH);
							hasError = true;
						}
						break;
				}

				if (hasError) break;

			}


		} else {

		}

		return tkn;
	}


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

	public static GetBaseVarType(tkn: G64Token): Tokentype {

		if (tkn.Type == Tokentype.vnum || tkn.Type == Tokentype.anum || tkn.Type == Tokentype.vint || tkn.Type == Tokentype.aint)
			return Tokentype.vnum;

		if (tkn.Type == Tokentype.vstr || tkn.Type == Tokentype.astr)
			return Tokentype.vstr;

		return Tokentype.err;
	}

	/**
	 * Checks if the given token can be executed
	 * @param			tkn			Token to check
	 * @returns			boolean
	 */
	public static IsCmd(tkn: G64Token): boolean {
		return (tkn.Id > 0 && tkn.Type != Tokentype.err);
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
	 * Checks if the given token is an int number
	 * @param			tkn			Token to check
	 * @returns			boolean
	 */
	public static IsInt(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.vint || tkn.Type == Tokentype.aint);
	}

	/**
	 * Checks if the given token is a number between 0 and 65535
	 * @param			tkn			Token to check
	 * @returns
	 */
	public static IsAdr(tkn: G64Token): boolean {
		return this.IsNum(tkn) && (tkn.Num >= 0 && tkn.Num <= 65535);
	}

	/**
	 * Checks if the given token is a number between 0 and 255
	 * @param			tkn 		Token to check
	 * @returns			boolean
	 */
	public static IsByte(tkn: G64Token): boolean {
		return this.IsNum(tkn) && (tkn.Num >= 0 && tkn.Num <= 255);
	}

	/**
	 * Checks if tkn1 and tkn2 are the same base type (string, num)
	 * @param			tkn1		first token to compare
	 * @param			tkn2		token to compare type with
	 * @returns			boolean
	 */
	public static IsSame(tkn1: G64Token, tkn2: G64Token): boolean {
		return (this.GetBaseType(tkn1) == this.GetBaseType(tkn2));
	}

	/**
	 * Checks if the given token is an error
	 * @param			tkn			Token to check
	 * @returns			boolean
	 */
	public static IsError(tkn: G64Token): boolean {
		return (tkn.Type == Tokentype.err);
	}

}