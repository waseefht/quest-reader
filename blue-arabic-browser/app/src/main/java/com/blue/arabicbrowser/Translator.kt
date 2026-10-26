package com.blue.arabicbrowser

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.LruCache
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import java.net.URLEncoder
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * Keyless translation to Arabic. Providers (tried in order, a failing provider is benched for 60 s):
 *  1. Google Translate "gtx" HTML endpoint (batched POST, keeps inline tags)
 *  2. Google dict-chrome-ex endpoint (same format, different quota bucket)
 *  3. MyMemory (plain text, one string per call; last resort)
 * Results are cached in memory and in SQLite so revisits are instant and offline-friendly.
 */
class Translator(ctx: Context) {
    data class Provider(val id: String, val url: String?)
    private val providers = listOf(
        Provider("gtx", "https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=ar&format=html"),
        Provider("dict", "https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=ar&format=html"),
        Provider("mymemory", null),
    )
    private val benchedUntil = HashMap<String, Long>()
    @Volatile var lastProvider = ""
    val http: OkHttpClient = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).build()
    private val pool = Executors.newFixedThreadPool(4)
    private val mem = LruCache<String, String>(6000)
    private val db = object : SQLiteOpenHelper(ctx, "trcache.db", null, 1) {
        override fun onCreate(d: SQLiteDatabase) { d.execSQL("CREATE TABLE c(s TEXT PRIMARY KEY, t TEXT, ts INTEGER)") }
        override fun onUpgrade(d: SQLiteDatabase, o: Int, n: Int) {}
    }.writableDatabase

    fun clearCache() { mem.evictAll(); db.delete("c", null, null) }
    fun cacheSize(): Long = android.database.DatabaseUtils.queryNumEntries(db, "c")

    /** Async: [cb] gets a list aligned with [src] (null entries = failed) or null when everything failed. */
    fun translateAsync(src: List<String>, cb: (List<String?>?) -> Unit) { pool.execute { cb(try { translate(src) } catch (e: Exception) { null }) } }

    fun translate(src: List<String>): List<String?>? {
        val out = arrayOfNulls<String>(src.size)
        val need = ArrayList<Int>()
        src.forEachIndexed { i, s ->
            val m = mem.get(s) ?: lookup(s)
            if (m != null) { out[i] = m; mem.put(s, m) } else need.add(i)
        }
        // chunk by size (~4500 chars per request)
        var chunk = ArrayList<Int>(); var len = 0
        val chunks = ArrayList<List<Int>>()
        for (i in need) { val l = src[i].length; if (len + l > 4500 && chunk.isNotEmpty()) { chunks.add(chunk); chunk = ArrayList(); len = 0 }; chunk.add(i); len += l }
        if (chunk.isNotEmpty()) chunks.add(chunk)
        var anyFail = false
        for (c in chunks) {
            val res = translateChunk(c.map { src[it] })
            if (res == null) { anyFail = true; continue }
            c.forEachIndexed { k, i -> val t = res.getOrNull(k); if (t != null) { out[i] = t; store(src[i], t) } }
        }
        if (anyFail && out.all { it == null }) return null
        return out.toList()
    }

    private fun lookup(s: String): String? = db.rawQuery("SELECT t FROM c WHERE s=?", arrayOf(s)).use { if (it.moveToFirst()) it.getString(0) else null }
    private fun store(s: String, t: String) {
        mem.put(s, t)
        try { db.insertWithOnConflict("c", null, ContentValues().apply { put("s", s); put("t", t); put("ts", System.currentTimeMillis()) }, SQLiteDatabase.CONFLICT_REPLACE) } catch (_: Exception) {}
    }

    private fun translateChunk(items: List<String>): List<String?>? {
        val now = System.currentTimeMillis()
        for (p in providers) {
            if ((benchedUntil[p.id] ?: 0) > now) continue
            val r = try { if (p.url != null) google(p.url, items) else myMemory(items) } catch (e: Exception) { null }
            if (r != null) { lastProvider = p.id; return r }
            synchronized(benchedUntil) { benchedUntil[p.id] = now + 60_000 }
        }
        // everything benched: retry the primary once anyway
        return try { google(providers[0].url!!, items) } catch (e: Exception) { null }
    }

    private fun google(url: String, items: List<String>): List<String?>? {
        val fb = FormBody.Builder(); items.forEach { fb.add("q", it) }
        val req = Request.Builder().url(url).post(fb.build()).header("User-Agent", UA).build()
        http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) return null
            val body = r.body?.string() ?: return null
            if (!body.startsWith("[")) return null
            return parseGoogle(body, items.size)
        }
    }

    private fun myMemory(items: List<String>): List<String?>? {
        val out = ArrayList<String?>()
        for (s in items) {
            val plain = stripTags(s)
            if (plain.length > 480) { out.add(null); continue }
            val u = "https://api.mymemory.translated.net/get?langpair=en|ar&q=" + URLEncoder.encode(plain, "UTF-8")
            http.newCall(Request.Builder().url(u).header("User-Agent", UA).build()).execute().use { r ->
                if (!r.isSuccessful) return null
                val j = org.json.JSONObject(r.body!!.string())
                if (j.optInt("responseStatus") != 200) return null
                out.add(escapeHtml(j.getJSONObject("responseData").optString("translatedText")))
            }
        }
        return out
    }

    companion object {
        const val UA = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
        fun parseGoogle(body: String, n: Int): List<String?>? {
            val a = JSONArray(body)
            // n==1 -> [["tr","en"]] ; n>1 with sl=auto -> [["tr","en"],...] ; with fixed sl -> ["tr",...]
            val out = ArrayList<String?>()
            for (i in 0 until a.length()) {
                val x = a.get(i)
                out.add(when (x) { is JSONArray -> x.optString(0, null); is String -> x; else -> null })
            }
            if (out.size != n) return if (n == 1 && out.isNotEmpty()) listOf(out[0]) else null
            return out
        }
        fun stripTags(s: String) = s.replace(Regex("<[^>]*>"), " ").replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&").replace(Regex("\\s+"), " ").trim()
        fun escapeHtml(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    }
}
