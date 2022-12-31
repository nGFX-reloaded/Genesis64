
/* 
   A C-program for MT19937, with initialization improved 2002/1/26.
   Coded by Takuji Nishimura and Makoto Matsumoto.
 
   Before using, initialize the state by using init_genrand(seed)  
   or init_by_array(init_key, key_length).
 
   Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
   All rights reserved.                          
 
   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:
 
     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
 
     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
 
     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.
 
   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 
   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

class MersenneTwister {

	// region Constants -------------------------------------------------------

	// Period parameters.
	private N: number = 624;
	private M: number = 397;
	private MATRIX_A: number = 0x9908b0df;   // constant vector a
	private UPPER_MASK: number = 0x80000000; // most significant w-r bits
	private LOWER_MASK: number = 0x7fffffff; // least significant r bits
	private MAX_RAND_INT: number = 0x7fffffff;

	// region Instance Variables ----------------------------------------------

	// mag01[x] = x * MATRIX_A  for x=0,1
	private mag01: Array<number> = [0x0, this.MATRIX_A];

	// the array for the state vector
	private mt: Array<number> = new Array<number>();

	// mti==N+1 means mt[N] is not initialized
	private mti: number = this.N + 1;


	// region instanciation
	private static _instance: MersenneTwister;

	public MersenneTwister() {

		if (typeof MersenneTwister._instance !== "undefined") {
			console.log("Cannot have two instances of MersenneTwister.");
		} else {
			this.init_genrand(new Date().getTime());
			MersenneTwister._instance = this;
		}

	}

	// getter/setter
	static get Instance(): MersenneTwister {
		if (typeof MersenneTwister._instance === "undefined") {
			return new MersenneTwister();
		}
		return MersenneTwister._instance;
	}

	// region Properties ------------------------------------------------------

	/// <summary>
	/// Gets the maximum random integer value. All random integers generated
	/// by instances of this class are less than or equal to this value. This
	/// value is <c>0x7fffffff</c> (<c>2,147,483,647</c>).
	/// </summary>
	public get MaxRandomInt() { return this.MAX_RAND_INT; }


	// region Member Functions ------------------------------------------------

	/// <summary>
	/// Returns a random integer greater than or equal to zero and
	/// less than or equal to <c>MaxRandomInt</c>. 
	/// </summary>
	/// <returns>The next random integer.</returns>

	/// <summary>
	/// Returns a positive random integer less than the specified maximum.
	/// </summary>
	/// <param name="maxValue">The maximum value. Must be greater than zero.</param>
	/// <returns>A positive random integer less than or equal to <c>maxValue</c>.</returns>

	/// <summary>
	/// Returns a random integer within the specified range.
	/// </summary>
	/// <param name="minValue">The lower bound.</param>
	/// <param name="maxValue">The upper bound.</param>
	/// <returns>A random integer greater than or equal to <c>minValue</c>, and less than
	/// or equal to <c>maxValue</c>.</returns>
	public Next(minValue?: number, maxValue?: number): number {

		if (typeof minValue === "undefined" && typeof maxValue === "undefined") {
			return this.genrand_int31();
		}

		if (typeof maxValue === "undefined") {
			maxValue = minValue;
			minValue = 0;
		}

		if (minValue > maxValue) {
			let tmp: number = maxValue;
			maxValue = minValue;
			minValue = tmp;
		}

		return Math.floor((maxValue - minValue + 1) * this.genrand_real2() + minValue);
	}

	/// <summary>
	/// Returns a random number between 0.0 and 1.0.
	/// </summary>
	/// <returns>A single-precision floating point number greater than or equal to 0.0, 
	/// and less than 1.0.</returns>

	/// <summary>
	/// Returns a random number greater than or equal to zero, and either strictly
	/// less than one, or less than or equal to one, depending on the value of the
	/// given boolean parameter.
	/// </summary>
	/// <param name="includeOne">
	/// If <c>true</c>, the random number returned will be 
	/// less than or equal to one; otherwise, the random number returned will
	/// be strictly less than one.
	/// </param>
	/// <returns>
	/// If <c>includeOne</c> is <c>true</c>, this method returns a
	/// single-precision random number greater than or equal to zero, and less
	/// than or equal to one. If <c>includeOne</c> is <c>false</c>, this method
	/// returns a single-precision random number greater than or equal to zero and
	/// strictly less than one.
	/// </returns>
	public NextFloat(includeOne?: boolean): number {

		if (typeof includeOne === "undefined") {
			return this.genrand_real2();
		}

		if (includeOne) {
			return this.genrand_real1();
		}

		return this.genrand_real2();
	}

	/// <summary>
	/// Returns a random number greater than 0.0 and less than 1.0.
	/// </summary>
	/// <returns>A random number greater than 0.0 and less than 1.0.</returns>
	public NextFloatPositive(): number {
		return this.genrand_real3();
	}

	/// <summary>
	/// Returns a random number between 0.0 and 1.0.
	/// </summary>
	/// <returns>A double-precision floating point number greater than or equal to 0.0, 
	/// and less than 1.0.</returns>

	/// <summary>
	/// Returns a random number greater than or equal to zero, and either strictly
	/// less than one, or less than or equal to one, depending on the value of the
	/// given boolean parameter.
	/// </summary>
	/// <param name="includeOne">
	/// If <c>true</c>, the random number returned will be 
	/// less than or equal to one; otherwise, the random number returned will
	/// be strictly less than one.
	/// </param>
	/// <returns>
	/// If <c>includeOne</c> is <c>true</c>, this method returns a
	/// single-precision random number greater than or equal to zero, and less
	/// than or equal to one. If <c>includeOne</c> is <c>false</c>, this method
	/// returns a single-precision random number greater than or equal to zero and
	/// strictly less than one.
	/// </returns>
	public NextDouble(includeOne?: boolean): number {

		if (typeof includeOne === "undefined") {
			return this.genrand_real2();
		}

		if (includeOne) {
			return this.genrand_real1();
		}

		return this.genrand_real2();
	}

	/// <summary>
	/// Returns a random number greater than 0.0 and less than 1.0.
	/// </summary>
	/// <returns>A random number greater than 0.0 and less than 1.0.</returns>
	public NextDoublePositive(): number {
		return this.genrand_real3();
	}

	/// <summary>
	/// Generates a random number on <c>[0,1)</c> with 53-bit resolution.
	/// </summary>
	/// <returns>A random number on <c>[0,1)</c> with 53-bit resolution</returns>
	public Next53BitRes(): number {
		return this.genrand_res53();
	}

	/// <summary>
	/// Reinitializes the random number generator using the time of day in
	/// milliseconds as the seed.
	/// </summary>

	/// <summary>
	/// Reinitializes the random number generator with the given seed.
	/// </summary>
	/// <param name="seed">The seed.</param>

	/// <summary>
	/// Reinitializes the random number generator with the given array.
	/// </summary>
	/// <param name="init">The array for initializing keys.</param>

	public Init(seed?: number | Array<number>): void {

		if (typeof seed === "undefined") {
			this.init_genrand(new Date().getTime() + Math.random());

		} else {
			if (typeof seed === "number") {
				this.init_genrand(Math.floor(seed));

			} else {
				let initArray: Array<number> = new Array<number>();
				for (var i = 0; i < seed.length; i++) {
					initArray.push(seed[i]);
				}

				this.init_by_array(initArray, initArray.length);
			}
		}
	}


	// region Methods ported from C-------------------------------------------

	// initializes mt[N] with a seed
	private init_genrand(s: number): void {
		this.mt[0] = s & 0xffffffff;
		for (this.mti = 1; this.mti < this.N; this.mti++) {
			this.mt[this.mti] =
				(1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >> 30)) + this.mti);
			// See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. 
			// In the previous versions, MSBs of the seed affect   
			// only MSBs of the array mt[].                        
			// 2002/01/09 modified by Makoto Matsumoto             
			this.mt[this.mti] &= 0xffffffff;
			// for >32 bit machines
		}
	}

	// initialize by an array with array-length
	// init_key is the array for initializing keys 
	// key_length is its length
	private init_by_array(init_key:Array<number>, key_length:number):void {
		let i: number, j: number, k: number;

		this.init_genrand(19650218);

		i = 1; j = 0;
		k = (this.N > key_length) ? this.N : key_length;
		for (; k > 0; k--) {
			this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1664525)) + init_key[j] + j); /* non linear */
			this.mt[i] &= 0xffffffff; // for WORDSIZE > 32 machines
			i++; j++;
			if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
			if (j >= key_length) j = 0;
		}
		for (k = this.N - 1; k > 0; k--) {
			this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1566083941)) - i); /* non linear */
			this.mt[i] &= 0xffffffff; // for WORDSIZE > 32 machines
			i++;
			if (i >= this.N) { this.mt[0] = this.mt[this.N - 1]; i = 1; }
		}

		this.mt[0] = 0x80000000; // MSB is 1; assuring non-zero initial array
	}

	// generates a random number on [0,0xffffffff]-interval
	private genrand_int32():number {
		let y:number;
		if (this.mti >= this.N) { /* generate N words at one time */
			let kk:number;

			if (this.mti == this.N + 1)   /* if init_genrand() has not been called, */
				this.init_genrand(5489); /* a default initial seed is used */

			for (kk = 0; kk < this.N - this.M; kk++) {
				y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
				this.mt[kk] = this.mt[kk + this.M] ^ (y >> 1) ^ this.mag01[y & 0x1];
			}
			for (; kk < this.N - 1; kk++) {
				y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
				this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >> 1) ^ this.mag01[y & 0x1];
			}
			y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
			this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >> 1) ^ this.mag01[y & 0x1];

			this.mti = 0;
		}

		y = this.mt[this.mti++];

		// Tempering
		y ^= (y >> 11);
		y ^= (y << 7) & 0x9d2c5680;
		y ^= (y << 15) & 0xefc60000;
		y ^= (y >> 18);

		return y;
	}

	// generates a random number on [0,0x7fffffff]-interval
	private genrand_int31():number {
		return Math.floor(this.genrand_int32() >> 1);
	}

	// generates a random number on [0,1]-real-interval
	private genrand_real1():number {
		return this.genrand_int32() * (1.0 / 4294967295.0);
		// divided by 2^32-1
	}

	// generates a random number on [0,1)-real-interval
	private genrand_real2():number {
		return this.genrand_int32() * (1.0 / 4294967296.0);
		// divided by 2^32
	}

	// generates a random number on (0,1)-real-interval
	private genrand_real3():number {
		return ((this.genrand_int32()) + 0.5) * (1.0 / 4294967296.0);
		// divided by 2^32
	}

	// generates a random number on [0,1) with 53-bit resolution
	private genrand_res53() {
		let a:number = this.genrand_int32() >> 5, b:number = this.genrand_int32() >> 6;
		return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
	}
	// These real versions are due to Isaku Wada, 2002/01/09 added

}