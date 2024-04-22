/**
 * G64Memory
 * Deals with the C64 memory
 */

class G64Memory {

	//#region " ----- Privates ----- "

	private m_Variables:Map<string, G64Token> = new Map<string, G64Token>();

	//#endregion

	//#region " ----- Publics ----- "

	get Variables(): Map<string, G64Token> { return this.m_Variables; }

	//#endregion

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
	}

	//#endregion

}