
// Let's make a thing
let g64 = {};

function Ready(fn) {
	if (document.readyState !== "loading") {
		fn();
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

Ready(function () {
	g64 = Genesis64.Instance;
	g64.Setup(document.getElementById("genesis64"));
	g64.Temp();
});