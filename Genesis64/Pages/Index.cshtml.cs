using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Genesis64.Pages {
	public class IndexModel : PageModel {
		private readonly ILogger<IndexModel> _logger;

		public IndexModel(ILogger<IndexModel> logger) {
			_logger = logger;
		}

		public void OnGet() {

		}
	}
}
