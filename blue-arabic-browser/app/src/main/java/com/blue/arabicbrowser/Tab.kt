package com.blue.arabicbrowser

import android.annotation.SuppressLint
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONArray

/** One browser tab: its WebView plus the JS bridge used by translate.js. */
@SuppressLint("SetJavaScriptEnabled")
class Tab(val web: WebView, private val host: MainActivity) {
    var mode = "off"           // what translate.js reports for the current page ("arabic" = page already Arabic)
    var title = ""
    var pendingUrl: String? = null   // set when the renderer kept crashing; loaded on ⟳
    val bridge = Bridge()

    inner class Bridge {
        @JavascriptInterface fun initialMode(url: String): String = host.modeForWeb(web, url) + "|" + (if (host.store.flipPage) "1" else "0")
        @JavascriptInterface fun translate(id: Int, json: String) {
            val items = try { JSONArray(json).let { a -> (0 until a.length()).map { a.getString(it) } } } catch (e: Exception) { emptyList() }
            host.translator.translateAsync(items) { res ->
                val js = if (res == null) "null" else JSONArray().apply { res.forEach { put(it ?: org.json.JSONObject.NULL) } }.toString()
                web.post { web.evaluateJavascript("window.__arT&&__arT.cb($id,$js)", null) }
            }
        }
        @JavascriptInterface fun onMode(m: String) { web.post { mode = m; host.onTabMode(this@Tab) } }
        @JavascriptInterface fun onTitle(t: String) { web.post { title = t; host.onTabTitle(this@Tab) } }
        @JavascriptInterface fun onReadable(json: String) { web.post { host.onReadable(this@Tab, json) } }
    }
}
