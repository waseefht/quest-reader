package com.blue.arabicbrowser

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

/** All persisted settings: translation defaults, per-site overrides, bookmarks, open tabs, voice. */
class Store(ctx: Context) {
    private val sp = ctx.getSharedPreferences("arblue", Context.MODE_PRIVATE)

    var autoTranslate: Boolean get() = sp.getBoolean("auto", true); set(v) = sp.edit().putBoolean("auto", v).apply()
    /** "ar" full Arabic or "bi" bilingual */
    var defaultMode: String get() = sp.getString("mode", "ar")!!; set(v) = sp.edit().putString("mode", v).apply()
    var flipPage: Boolean get() = sp.getBoolean("flip", false); set(v) = sp.edit().putBoolean("flip", v).apply()
    var voice: String get() = sp.getString("voice", Voices.DEFAULT)!!; set(v) = sp.edit().putString("voice", v).apply()
    var rate: Int get() = sp.getInt("rate", 0); set(v) = sp.edit().putInt("rate", v).apply()

    private fun siteMap(): JSONObject = try { JSONObject(sp.getString("sites", "{}")!!) } catch (e: Exception) { JSONObject() }
    fun siteMode(host: String?): String? = host?.let { siteMap().optString(it, "").ifEmpty { null } }
    fun setSiteMode(host: String?, mode: String?) {
        if (host.isNullOrEmpty()) return
        val m = siteMap(); if (mode == null) m.remove(host) else m.put(host, mode)
        sp.edit().putString("sites", m.toString()).apply()
    }
    fun clearSites() = sp.edit().remove("sites").apply()

    /** Effective mode for a URL: per-site override, else the global default (if auto), else off. */
    fun modeFor(url: String?): String {
        if (url == null || !url.startsWith("http") || url.startsWith(Pages.ORIGIN)) return "off"
        val host = host(url)
        return siteMode(host) ?: if (autoTranslate) defaultMode else "off"
    }

    data class Bookmark(val title: String, val url: String)
    fun bookmarks(): List<Bookmark> {
        val a = try { JSONArray(sp.getString("bm", "[]")) } catch (e: Exception) { JSONArray() }
        return (0 until a.length()).map { a.getJSONObject(it).let { o -> Bookmark(o.optString("t"), o.optString("u")) } }
    }
    private fun saveBm(l: List<Bookmark>) = sp.edit().putString("bm", JSONArray().apply { l.forEach { put(JSONObject().put("t", it.title).put("u", it.url)) } }.toString()).apply()
    fun isBookmarked(u: String?) = bookmarks().any { it.url == u }
    fun toggleBookmark(title: String, u: String): Boolean {
        val l = bookmarks().toMutableList()
        val ex = l.indexOfFirst { it.url == u }
        return if (ex >= 0) { l.removeAt(ex); saveBm(l); false } else { l.add(0, Bookmark(title.ifBlank { u }, u)); saveBm(l); true }
    }
    fun removeBookmark(u: String) = saveBm(bookmarks().filter { it.url != u })

    var tabs: List<String>
        get() { val a = try { JSONArray(sp.getString("tabs", "[]")) } catch (e: Exception) { JSONArray() }; return (0 until a.length()).map { a.getString(it) } }
        set(v) = sp.edit().putString("tabs", JSONArray(v).toString()).apply()
    var currentTab: Int get() = sp.getInt("cur", 0); set(v) = sp.edit().putInt("cur", v).apply()

    companion object {
        fun host(url: String?): String? = try { Uri.parse(url).host?.removePrefix("www.") } catch (e: Exception) { null }
    }
}
