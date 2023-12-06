namespace Genesis64.AppCode {
	public static class Tools {
		public static string ReadFile(string filename) {
			string strContent = "File not found: {filename}";

			try {
				using (StreamReader sr = new(filename)) {
					strContent = sr.ReadToEnd();
				}
			} catch (Exception ex) {
				//strContent = ex.Message;
			}

			return strContent;

		}
	}
}
