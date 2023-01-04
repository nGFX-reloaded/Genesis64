class BitHelper {

	/**
	 * Helper method that either returns the given byte (number) or creates it from a string
	 * @param bits		string or number, string must be 8 chars 1 or 0
	 */
	public static Byte(bits: string | number): number {
		let byte: number;

		if (typeof bits === "number") {
			byte = bits;
		} else {
			byte = this.BitCreate(bits);
		}

		return byte;
	}

	/**
	 * Crerates a byte from a string
	 * 128 ... 0 | 10000000
	 * @param bits string, 8 chars long 1 or 0
	 */
	public static BitCreate(bits: string): number {

		let byte: number = 0;

		for (let i: number = 0; i < 8; i++) {
			if (bits.charAt(i) == "1") {
				byte = this.BitSet(byte, 7 - i);
			}
		}

		return byte;
	}

	/**
	 * Test for a bit in a byte
	 * @param byte	byte to test bit in
	 * @param bit	bit to test, number 7 -> 0
	 */
	public static BitTest(byte: number, bit: number): boolean {
		return (((byte >> bit) % 2) != 0);
	}

	/**
	 * Sets a bit in a byte
	 * @param byte	byte to set bit in
	 * @param bit	bit to set, number 7 -> 0
	 */
	public static BitSet(byte: number, bit: number): number {
		return (byte | (1 << bit));
	}

	/**
	 * Clears a bit in a byte
	 * @param byte	byte to clear bit in
	 * @param bit	bit to clear, 7 -> 0
	 */
	public static BitClear(byte: number, bit: number): number {
		return byte & ~(1 << bit);
	}

	/**
	 * Toggle a bit in a byte
	 * @param byte	byte to toggle bit in
	 * @param bit	bit to toggle, 7 -> 0
	 */
	public static BitToggle(byte: number, bit: number): number {
		return (this.BitTest(byte, bit)) ? this.BitClear(byte, bit) : this.BitSet(byte, bit);
	}

	/**
	 * Sets or clears a bit in a byte based on "set"
	 * @param byte	byte to set ot clear bit in
	 * @param bit	bit to set or clear, 7 -> 0
	 * @param set	set or clear flag
	 */
	public static BitPlace(byte: number, bit: number, set: boolean): number {
		return (set) ? this.BitSet(byte, bit) : this.BitClear(byte, bit);
	}

}