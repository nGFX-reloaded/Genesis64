var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

//
// weboptimizer (bundle, sass and minify) (move AFTER razorpages)
builder.Services.AddWebOptimizer(
	pipeline => {
		// see: https://github.com/ligershark/WebOptimizer/blob/master/sample/Startup.cs

		//if (builder.Environment.IsDevelopment()) {
			// This will minify any JS and CSS file that isn't part of any bundle
			pipeline.MinifyCssFiles();
			pipeline.MinifyJsFiles();
		//}

		//// IMPORTANT: bundles go without wwwroot and leading /, files without / as well
		//pipeline.AddJavaScriptBundle("js/jquery.validate.js",
		//	"AppSources/Jquery-validate/jquery.validate.js",
		//	"AppSources/Jquery-validate/additional-methods.js",
		//	"AppSources/jquery-validation-unobtrusive/jquery.validate.unobtrusive.js")
		//	.UseContentRoot();

		//pipeline.AddJavaScriptBundle("js/site.js",
		//	"wwwroot/js/widebight/UITools.js")
		//	.UseContentRoot();

	}
);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment()) {
	app.UseExceptionHandler("/Error");
	// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
	app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
