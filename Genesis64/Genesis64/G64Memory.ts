

class G64Memory {

	//#region " ----- Privates ----- "

	private m_isDirty: boolean = false;		// has anything changed?

	private m_ramBuffer: ArrayBuffer;		// internal array and used to create the ram texture
	private m_ramView: Uint8Array;

	private m_ctxFont: CanvasRenderingContext2D;

	private m_isDone: boolean = false;
	private m_initStep: number = 0;

	//#endregion

	//#region " ----- Address Constants----- "

	public readonly ADR_CHARACTERROM: number = 0xE000;		// 57344 - 61440 -> Character ROM, shape of characters(4096 bytes).

	//#endregion

	//#region " ----- Pointers ----- "

	public PTR_SCREENRAM: number = 0x0400;					// 1024 - 2023 -> 1000 bytes screen ram
	public PTR_COLORRAM: number = 0xD800;					// 55296 - 56295 -> 1000 bytes color ram
	public PTR_SPRITEPTR: number = 0x07FF;					// 2040 - 2047 -> Default area for sprite pointers, screenram + 1016 -> val * 64 + bank offset (64k / 16k chunks)
	public PTR_FONTBANK: number = 0xE000;					// 57344 - 59391 -> character rom, upper, set by SetMemorySetupRegister
	public PTR_BITMAP: number = 0x0000;						// not set -> bitmap memory, set by SetMemorySetupRegister

	//#endregion


	//#region " ----- Publics ----- "

	public get IsDone(): boolean { return this.m_isDone; }

	//#endregion

	constructor() {

		Genesis64.Instance.Log(" - G64 memory created\n");

	}

	//#region " ----- Init ----- "

	public Init(): number {

		switch (this.m_initStep) {
			case 0:
				this.InitRam();
				this.m_initStep++;
				break;

			case 1:
				this.InitFont();
				this.m_initStep++;
				break;
			case 2:
				this.SetFontRom();
				this.m_initStep++;
				break;
			case 3:
				this.SetBootMsg();
				this.m_initStep++;
				break;

			default:
				this.m_initStep = -666;
				break;
		}

		return this.m_initStep;
	}

	/**
	 * Inits the G64 RAM with C64 default values
	 **/
	private InitRam() {

		this._start("   ... setting up RAM values ... ");

		// create the g64 "ram"
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
		this.m_ramBuffer = new ArrayBuffer(1024 * 64);
		this.m_ramView = new Uint8Array(this.m_ramBuffer);
		this.m_ramView.fill(0);

		// set memory pattern
		let val: boolean = true;
		for (let i: number = 0; i < this.m_ramView.length; i++) {
			if ((i % 64) == 0) val = !val;
			this.m_ramView[i] = (val) ? 255 : 0;
		}

		this._done();
	}

	/**
	 * Create the image that holds the PETSCII font and draw it to RAM
	 **/
	private InitFont(): void {

		this._start("   ... creating font data ... ");

		const imgFont: HTMLImageElement = document.createElement("img");
		imgFont.setAttribute("src", "data:image/png;base64,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");
		imgFont.width = 256;
		imgFont.height = 128;

		// create a canvas that holds the entire c64 ram in a 128x128 RGBA image
		const canvasFont: HTMLCanvasElement = document.createElement("canvas");
		canvasFont.id = "G64Font";
		canvasFont.width = 256;
		canvasFont.height = 128;

		this.m_ctxFont = canvasFont.getContext("2d");

		// we need this, because img creation takes a while
		imgFont.onload = (event) => {
			this.m_ctxFont.drawImage(imgFont, 0, 0);
			this._done();
		}
	}

	/**
	 * Copy font data from image to ram 
	 **/
	private SetFontRom(): void {

		this._start("   ... copy font data to ram ... ");

		const w: number = this.m_ctxFont.canvas.width;
		const h: number = this.m_ctxFont.canvas.height;
		const imgDataChr: ImageData = this.m_ctxFont.getImageData(0, 0, w, h);

		let ptr: number = 0;
		let pixel: number;

		let aBank: Array<number> = [this.ADR_CHARACTERROM, this.ADR_CHARACTERROM + 0x1000];

		let byte: number = 0

		for (let bank: number = 0; bank < aBank.length; bank++) {
			ptr = aBank[bank];
			// the font img contains both banks ...
			for (let y: number = (bank * 8); y < (8 * (bank + 1)); y++) { // both banks y
				for (let x: number = 0; x < 32; x++) { // each line
					for (let yy: number = 0; yy < 8; yy++) { // y char 
						byte = 0;
						for (let xx: number = 0; xx < 8; xx++) { // each pixel x
							pixel = ((xx * 4) + (x * 8 * 4)) + ((yy * w * 4) + (y * 8 * w * 4));
							byte = BitHelper.BitPlace(byte, 7 - xx, (imgDataChr.data[pixel + 3] >= 128));
						}
						this.m_ramView[ptr++] = byte;
					}
				}
			}
		}

		this._done();
	}

	/** 
	 * Copies the boot msg into screenram 
	 **/
	private SetBootMsg(): void {

		this._start("   ... writing boot message ... ");

		// "    **** commodore 64 basic v2 ****     "
		const strBootMsg: string =
			"                                        " +
			"     **** genesis 64 basic v2 ****      " +
			"                                        " +
			" 64k ram system  38911 basic bytes free " +
			"                                        " +
			"ready.                                  ";

		// set bootmsg
		for (let i: number = 0; i < strBootMsg.length; i++) {
			this.m_ramView[this.PTR_SCREENRAM + i] = Petscii.TXTSCREENCODE.indexOf(strBootMsg.charAt(i));
		}

		this._done();

	}


	private _start(message: string): void {
		Genesis64.Instance.Log(message);
		this.m_isDone = false;
	}
	private _done(): void {
		Genesis64.Instance.Log("OK\n");
		this.m_isDone = true;
	}

	//#endregion

	//#region " ----- Public Methods ----- "

	public Poke(ptr: number, byte: number): void {

		this.m_ramView[ptr] = byte;
		this.m_isDirty = true;

		// if adr is mem setup, trigger update

	}

	public Peek(ptr: number): number {
		return this.m_ramView[ptr];
	}

	//#endregion

}