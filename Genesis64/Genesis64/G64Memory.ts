/**
 * G64Memory
 * Deals with the C64 memory
 */

class G64Memory {

	//#region " ----- Privates ----- "

	private m_Variables: Map<string, G64Token> = new Map<string, G64Token>();

	private m_DataPointer: number = 0;
	private m_DataRef: G64Token[] = [];

	//#endregion

	//#region " ----- Publics ----- "

	get Variables(): Map<string, G64Token> { return this.m_Variables; }

	//#endregion

	// init, constructor



	//#region " --- Variables --- "

	/**
	 * Returns a variable token, or creates a new one if it doesn't exist
	 * @param tkn 
	 */
	public Variable(tkn: G64Token): G64Token {

		if (this.m_Variables.has(tkn.Name)) {
			return this.m_Variables.get(tkn.Name);
		} else {
			this.m_Variables.set(tkn.Name, tkn);
		}

		return tkn;
	}

	//#endregion

	//#region " ----- Methods ----- "

	/**
	 * Clears all variables and stacks, prior to RUN or using CLR
	 **/
	public Clear(): void {
		this.m_Variables.clear();
		this.m_DataPointer = 0;
	}

	public Poke(addr: number, value: number): void {
		console.log("memory.poke: " + addr + " = " + value);
	}

	public Peek(addr: number): number {
		console.log("memory.peek: " + addr);
		return 0;
	}

	public Restore(): void {
		this.m_DataPointer = 0;
	}

	public Run(line: number): void {
		this.Clear();

		// collect DATA tokens
	}

	//#endregion

}