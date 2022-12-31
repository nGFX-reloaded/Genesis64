class MersenneTwister {
    constructor() {
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.MAX_RAND_INT = 0x7fffffff;
        this.mag01 = [0x0, this.MATRIX_A];
        this.mt = new Array();
        this.mti = this.N + 1;
    }
    MersenneTwister() {
        if (typeof MersenneTwister._instance !== "undefined") {
            console.log("Cannot have two instances of MersenneTwister.");
        }
        else {
            this.init_genrand(new Date().getTime());
            MersenneTwister._instance = this;
        }
    }
    static get Instance() {
        if (typeof MersenneTwister._instance === "undefined") {
            return new MersenneTwister();
        }
        return MersenneTwister._instance;
    }
    get MaxRandomInt() { return this.MAX_RAND_INT; }
    Next(minValue, maxValue) {
        if (typeof minValue === "undefined" && typeof maxValue === "undefined") {
            return this.genrand_int31();
        }
        if (typeof maxValue === "undefined") {
            maxValue = minValue;
            minValue = 0;
        }
        if (minValue > maxValue) {
            let tmp = maxValue;
            maxValue = minValue;
            minValue = tmp;
        }
        return Math.floor((maxValue - minValue + 1) * this.genrand_real2() + minValue);
    }
    NextFloat(includeOne) {
        if (typeof includeOne === "undefined") {
            return this.genrand_real2();
        }
        if (includeOne) {
            return this.genrand_real1();
        }
        return this.genrand_real2();
    }
    NextFloatPositive() {
        return this.genrand_real3();
    }
    NextDouble(includeOne) {
        if (typeof includeOne === "undefined") {
            return this.genrand_real2();
        }
        if (includeOne) {
            return this.genrand_real1();
        }
        return this.genrand_real2();
    }
    NextDoublePositive() {
        return this.genrand_real3();
    }
    Next53BitRes() {
        return this.genrand_res53();
    }
    Init(seed) {
        if (typeof seed === "undefined") {
            this.init_genrand(new Date().getTime() + Math.random());
        }
        else {
            if (typeof seed === "number") {
                this.init_genrand(Math.floor(seed));
            }
            else {
                let initArray = new Array();
                for (var i = 0; i < seed.length; i++) {
                    initArray.push(seed[i]);
                }
                this.init_by_array(initArray, initArray.length);
            }
        }
    }
    init_genrand(s) {
        this.mt[0] = s & 0xffffffff;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            this.mt[this.mti] =
                (1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >> 30)) + this.mti);
            this.mt[this.mti] &= 0xffffffff;
        }
    }
    init_by_array(init_key, key_length) {
        let i, j, k;
        this.init_genrand(19650218);
        i = 1;
        j = 0;
        k = (this.N > key_length) ? this.N : key_length;
        for (; k > 0; k--) {
            this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1664525)) + init_key[j] + j);
            this.mt[i] &= 0xffffffff;
            i++;
            j++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
            if (j >= key_length)
                j = 0;
        }
        for (k = this.N - 1; k > 0; k--) {
            this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1566083941)) - i);
            this.mt[i] &= 0xffffffff;
            i++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
        }
        this.mt[0] = 0x80000000;
    }
    genrand_int32() {
        let y;
        if (this.mti >= this.N) {
            let kk;
            if (this.mti == this.N + 1)
                this.init_genrand(5489);
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
        y ^= (y >> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >> 18);
        return y;
    }
    genrand_int31() {
        return Math.floor(this.genrand_int32() >> 1);
    }
    genrand_real1() {
        return this.genrand_int32() * (1.0 / 4294967295.0);
    }
    genrand_real2() {
        return this.genrand_int32() * (1.0 / 4294967296.0);
    }
    genrand_real3() {
        return ((this.genrand_int32()) + 0.5) * (1.0 / 4294967296.0);
    }
    genrand_res53() {
        let a = this.genrand_int32() >> 5, b = this.genrand_int32() >> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }
}
class MiniFSMState {
    constructor(_Name, _Parameter, _OnEnterID, _OnUpdateID, _OnExitID) {
        this.toString = () => {
            return "FSMState: " + this.Name + " -> p: " + this.Parameter + ", s: " + this.OnEnterID + ", u: " + this.OnUpdateID + ", e: " + this.OnExitID;
        };
        this.Name = _Name;
        this.Parameter = _Parameter;
        this.OnEnterID = _OnEnterID;
        this.OnUpdateID = _OnUpdateID;
        this.OnExitID = _OnExitID;
        this.IsLateUpdate = false;
        this.IsRunning = true;
    }
}
class MiniFSMWorker {
    constructor(_Name, _WorkerID, _IsRunning) {
        this.toString = () => {
            return "FsmWorker: " + this.Name + " -> id: " + this.WorkerID;
        };
        this.Name = _Name;
        this.WorkerID = _WorkerID;
        this.IsRunning = _IsRunning;
    }
}
var ActionType;
(function (ActionType) {
    ActionType[ActionType["onEnter"] = 0] = "onEnter";
    ActionType[ActionType["onUpdate"] = 1] = "onUpdate";
    ActionType[ActionType["onExit"] = 2] = "onExit";
})(ActionType || (ActionType = {}));
class MiniFSM {
    get Name() { return this.m_Name; }
    set Name(value) { this.m_Name = value; }
    get State() { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Name : ""); }
    get Parameter() { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Parameter : ""); }
    set Parameter(value) {
        if (this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) {
            let state = this.m_lstStates[this.m_iCurrentState];
            state.Parameter = value;
            this.m_lstStates[this.m_iCurrentState] = state;
        }
    }
    get StateID() { return this.m_iCurrentState; }
    get CallbackState() { return this.m_strCallbackState; }
    set CallbackState(value) { this.m_strCallbackState = value; }
    get LastState() { return ((this.m_iLastState != -1) ? this.m_lstStates[this.m_iLastState].Name : ""); }
    get IsRunning() { return this.m_isRunning; }
    set IsRunning(value) { this.m_isRunning = value; }
    get Debug() { return this.m_debug; }
    set Debug(value) { this.m_debug = value; }
    constructor(name, isRunning) {
        this.m_Name = "";
        this.m_isRunning = true;
        this.m_isRunningState = false;
        this.m_debug = false;
        this.m_iCurrentState = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_iLastState = -1;
        this.m_iWorker = -1;
        this.m_strCallbackState = "";
        this.m_dictNames = new Map();
        this.m_lstStates = [];
        this.m_lstWorker = [];
        this.m_lstAction = [];
        if (typeof name !== "undefined") {
            this.m_Name = name;
        }
        if (typeof isRunning !== "undefined") {
            this.m_isRunning = isRunning;
        }
        else {
            this.m_isRunning = false;
        }
    }
    Update() {
        if (this.m_isRunning) {
            for (this.m_iWorker = 0; this.m_iWorker < this.m_lstWorker.length; this.m_iWorker++) {
                if (this.m_lstWorker[this.m_iWorker].IsRunning)
                    this.m_lstAction[this.m_lstWorker[this.m_iWorker].WorkerID]();
            }
            if (this.m_iCurrentStateUpdate != -1)
                if (this.m_lstStates[this.m_iCurrentState].IsRunning)
                    this.m_lstAction[this.m_iCurrentStateUpdate]();
        }
    }
    Reset() {
        this.m_isRunning = false;
        this.m_isRunningState = false;
        this.m_iCurrentState = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_iLastState = -1;
        this.m_iWorker = -1;
        this.m_strCallbackState = "";
        this.m_dictNames.clear();
        this.m_lstStates = [];
        this.m_lstWorker = [];
        this.m_lstAction = [];
    }
    SetState(name, parameter) {
        let id = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_isRunningState = false;
        if (typeof parameter === "undefined")
            parameter = "";
        if (this.m_dictNames.has(name)) {
            this.m_lstStates[this.m_dictNames.get(name)].Parameter = parameter;
        }
        else {
            return;
        }
        if (this.m_debug)
            console.log("fsm:", name, parameter);
        if (this.m_iCurrentState != -1 && parameter != MiniFSM.SKIP_ONEXIT) {
            id = this.m_lstStates[this.m_iCurrentState].OnExitID;
            if (id != -1)
                this.m_lstAction[id]();
            this.m_iLastState = this.m_iCurrentState;
            this.m_iCurrentState = -1;
        }
        if (this.m_dictNames.has(name)) {
            id = this.m_dictNames.get(name);
            this.m_iCurrentState = id;
            if (this.m_lstStates[id].OnEnterID != -1)
                this.m_lstAction[this.m_lstStates[id].OnEnterID]();
            if (this.m_lstStates[id].OnUpdateID != -1) {
                this.m_iCurrentStateUpdate = this.m_lstStates[id].OnUpdateID;
                this.m_isRunningState = true;
            }
        }
        else {
            console.error("MiniFSM: missing state -> " + name + ".");
        }
    }
    Pause(name) {
        if (typeof name === "undefined") {
            this.m_isRunning = false;
        }
        else {
            if (this.m_dictNames.has(name)) {
                this.m_lstStates[this.m_dictNames.get(name)].IsRunning = false;
            }
        }
    }
    PauseWorker(name) {
        if (this.m_dictNames.has(name)) {
            this.m_lstWorker[this.m_dictNames.get(name)].IsRunning = false;
        }
    }
    Unpause(name) {
        if (typeof name === "undefined") {
            this.m_isRunning = true;
        }
        else {
            if (this.m_dictNames.has(name)) {
                this.m_lstStates[this.m_dictNames.get(name)].IsRunning = true;
            }
        }
    }
    UnpauseWorker(name) {
        if (this.m_dictNames.has(name)) {
            if (typeof this.m_lstWorker[this.m_dictNames.get(name)] !== "undefined")
                this.m_lstWorker[this.m_dictNames.get(name)].IsRunning = true;
        }
    }
    Exit() {
        this.m_iCurrentStateUpdate = -1;
        this.m_isRunningState = false;
        this.m_iLastState = this.m_iCurrentState;
        if (this.m_lstStates[this.m_iCurrentState].OnExitID != -1)
            this.m_lstAction[this.m_lstStates[this.m_iCurrentState].OnExitID]();
        this.m_iCurrentState = -1;
    }
    UseCallbackState() {
        const tmp = this.m_strCallbackState;
        this.m_strCallbackState = "";
        return tmp;
    }
    IsState(name) {
        return (this.State == name);
    }
    IsParameter(parameter) {
        return (this.Parameter == parameter);
    }
    Add(name, parameter, onEnter, onExit, onUpdate) {
        let id = -1;
        if (typeof parameter === "undefined")
            parameter = "";
        if (typeof onEnter === "undefined")
            onEnter = null;
        if (typeof onExit === "undefined")
            onExit = null;
        if (typeof onUpdate === "undefined")
            onUpdate = null;
        if (this.m_dictNames.has(name)) {
            id = this.m_lstStates.length;
            this.m_lstStates.push(new MiniFSMState(name, (parameter != null) ? parameter : "", (onEnter != null) ? this.AddAction(onEnter) : -1, (onUpdate != null) ? this.AddAction(onUpdate) : -1, (onExit != null) ? this.AddAction(onExit) : -1));
            this.m_dictNames.set(name, id);
        }
        else {
            console.error("MiniFSM: Cannot add state '" + name + "', name already exists.");
        }
        return id;
    }
    AddSingle(name, action, type) {
        let id = -1;
        switch (type) {
            case ActionType.onEnter:
                id = this.Add(name, "", action);
                break;
            case ActionType.onExit:
                id = this.Add(name, "", null, action);
                break;
            case ActionType.onUpdate:
                id = this.Add(name, "", null, null, action);
                break;
        }
        return id;
    }
    AddWorker(name, action, autostart) {
        let id = -1;
        if (this.m_dictNames.has(name)) {
            id = this.m_lstWorker.length;
            this.m_lstWorker.push(new MiniFSMWorker(name, this.AddAction(action), autostart));
            this.m_dictNames.set(name, id);
        }
        else {
            console.error("MiniFSM: Cannot add worker '" + name + "', name already exists.");
        }
        return id;
    }
    AddAction(action) {
        let id = this.m_lstAction.length;
        this.m_lstAction.push(action);
        return id;
    }
}
MiniFSM.SKIP_ONEXIT = "@@@SKIPEXIT@@@";
class Genesis64 {
    constructor() {
        this.Init();
    }
    static get Instance() {
        return this.m_instance || (this.m_instance = new this());
    }
    Init() {
        console.log("Genesis64 Init.");
        this.m_divContainer = document.getElementById("Genesis64");
    }
}
//# sourceMappingURL=genesis64.js.map