package com.blue.arabicbrowser

object Pages {
    const val ORIGIN = "https://appassets.androidplatform.net"
    const val HOME = "$ORIGIN/assets/home.html"
    const val LINKS = "$ORIGIN/assets/quicklinks.html"
    fun isInternal(u: String?) = u?.startsWith(ORIGIN) == true

    /** Turns address-bar input into a URL (search with Google when it is not a URL). */
    fun fixUrl(input: String): String {
        val s = input.trim()
        if (s.isEmpty()) return HOME
        if (Regex("^[a-zA-Z][a-zA-Z0-9+.-]*://").containsMatchIn(s) || s.startsWith("about:")) return s
        if (!s.contains(' ') && Regex("^[^\\s]+\\.[a-zA-Z\\u0600-\\u06FF]{2,}(/.*)?$").matches(s)) return "https://$s"
        return "https://www.google.com/search?q=" + java.net.URLEncoder.encode(s, "UTF-8")
    }
}
