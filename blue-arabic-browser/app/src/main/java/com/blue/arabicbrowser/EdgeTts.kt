package com.blue.arabicbrowser

import okhttp3.*
import okio.ByteString
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Microsoft Edge "Read aloud" neural voices (keyless, same endpoint as edge-tts). Returns MP3 bytes or null. */
object EdgeTts {
    private const val CHROMIUM = "143.0.3650.75"
    private const val WSS = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=" + EdgeDrm.TRUSTED_CLIENT_TOKEN
    private val UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0"
    @Volatile var skewSec = 0.0
    val client: OkHttpClient by lazy {
        OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).build()
    }

    private fun uuid() = UUID.randomUUID().toString().replace("-", "")
    private fun jsDate(): String = SimpleDateFormat("EEE MMM dd yyyy HH:mm:ss 'GMT+0000 (Coordinated Universal Time)'", Locale.US)
        .apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date())
    fun esc(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")

    fun ssml(voice: String, text: String, ratePct: Int, pitchHz: Int): String {
        val r = (if (ratePct >= 0) "+" else "") + ratePct + "%"
        val p = (if (pitchHz >= 0) "+" else "") + pitchHz + "Hz"
        return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='$voice'>" +
            "<prosody pitch='$p' rate='$r' volume='+0%'>${esc(text)}</prosody></voice></speak>"
    }

    /** Blocking; call from a worker thread. */
    fun synth(voice: String, text: String, ratePct: Int = 0, pitchHz: Int = 0, retry: Boolean = true): ByteArray? {
        val url = "$WSS&ConnectionId=${uuid()}&Sec-MS-GEC=${EdgeDrm.token(System.currentTimeMillis() / 1000.0 + skewSec)}&Sec-MS-GEC-Version=2-$CHROMIUM"
        val req = Request.Builder().url(url)
            .header("Pragma", "no-cache").header("Cache-Control", "no-cache")
            .header("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold")
            .header("User-Agent", UA).header("Accept-Language", "en-US,en;q=0.9")
            .header("Cookie", "muid=${uuid().uppercase()};").build()
        val out = ByteArrayOutputStream(); val done = CountDownLatch(1)
        var ok = false; var serverDate: String? = null
        val ws = client.newWebSocket(req, object : WebSocketListener() {
            override fun onOpen(w: WebSocket, r: Response) {
                w.send("X-Timestamp:${jsDate()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n" +
                    "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-48kbitrate-mono-mp3\"}}}}\r\n")
                w.send("X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${jsDate()}Z\r\nPath:ssml\r\n\r\n" + ssml(voice, text, ratePct, pitchHz))
            }
            override fun onMessage(w: WebSocket, t: String) {
                if (t.contains("Path:turn.end")) { ok = out.size() > 0; w.close(1000, null); done.countDown() }
            }
            override fun onMessage(w: WebSocket, b: ByteString) {
                val d = b.toByteArray(); if (d.size < 2) return
                val hl = ((d[0].toInt() and 0xFF) shl 8) or (d[1].toInt() and 0xFF)
                if (hl + 2 > d.size) return
                val head = String(d, 2, hl, Charsets.UTF_8)
                if (head.contains("Path:audio") && head.contains("Content-Type")) out.write(d, 2 + hl, d.size - 2 - hl)
            }
            override fun onFailure(w: WebSocket, e: Throwable, r: Response?) { serverDate = r?.header("Date"); done.countDown() }
            override fun onClosed(w: WebSocket, c: Int, reason: String) { done.countDown() }
        })
        if (!done.await(20, TimeUnit.SECONDS)) { ws.cancel(); return null }
        if (!ok && retry && serverDate != null) {
            // 403 from clock skew: align to the server clock once and retry
            try {
                val sd = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US).parse(serverDate!!)!!.time / 1000.0
                skewSec += sd - (System.currentTimeMillis() / 1000.0 + skewSec)
                return synth(voice, text, ratePct, pitchHz, false)
            } catch (_: Exception) {}
        }
        return if (ok) out.toByteArray() else null
    }
}
