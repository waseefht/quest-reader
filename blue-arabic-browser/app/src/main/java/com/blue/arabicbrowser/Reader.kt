package com.blue.arabicbrowser

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.io.File
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Read-aloud pipeline. Text is split into sentence chunks (the first one short so audio starts in ~1 s);
 * chunks are synthesised with an Edge neural voice two ahead of playback and played gap-free with MediaPlayer.
 * If the neural endpoint fails (offline, blocked) the rest is spoken with Android TextToSpeech.
 */
class Reader(private val ctx: Context, private val onState: (String) -> Unit) {
    private val main = Handler(Looper.getMainLooper())
    private val synthPool = Executors.newFixedThreadPool(2)
    private var session = 0
    private var chunks: List<String> = emptyList()
    private val files = HashMap<Int, File?>()     // chunk index -> mp3 (null = failed)
    private var playing = -1
    private var player: MediaPlayer? = null
    private var paused = false
    private var useDevice = false
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    var lastEngine = ""; private set
    var totalBytes = 0L; private set
    val active get() = playing >= 0

    fun speak(paragraphs: List<String>, voice: VoiceOpt, ratePct: Int) {
        stop()
        val s = ++session
        chunks = split(paragraphs)
        files.clear(); totalBytes = 0; useDevice = voice.edge.isEmpty(); paused = false
        if (chunks.isEmpty()) { onState("لا يوجد نص عربي للقراءة"); return }
        Log.i(TAG, "speak ${chunks.size} chunks voice=${voice.edge.ifEmpty { "device" }} rate=$ratePct")
        playing = 0
        if (useDevice) { deviceSpeak(s, 0, ratePct); return }
        for (i in 0 until minOf(3, chunks.size)) prefetch(s, i, voice, ratePct)
        onState("جارٍ تحضير الصوت…")
        waitAndPlay(s, voice, ratePct)
    }

    private fun prefetch(s: Int, i: Int, voice: VoiceOpt, rate: Int) {
        if (i >= chunks.size || files.containsKey(i)) return
        synchronized(files) { if (files.containsKey(i)) return; files[i] = PENDING }
        synthPool.execute {
            if (s != session) return@execute
            var mp3 = EdgeTts.synth(voice.edge, chunks[i], rate)
            if (mp3 == null && s == session) mp3 = EdgeTts.synth(voice.edge, chunks[i], rate)
            val f = mp3?.let { File(ctx.cacheDir, "tts_${s}_$i.mp3").apply { writeBytes(it) } }
            if (mp3 != null) { totalBytes += mp3.size; Log.i(TAG, "chunk $i ${voice.edge} ${mp3.size}B") } else Log.w(TAG, "chunk $i synth failed")
            main.post { if (s == session) { synchronized(files) { files[i] = f ?: FAILED } } }
        }
    }

    private fun waitAndPlay(s: Int, voice: VoiceOpt, rate: Int) {
        if (s != session) return
        val i = playing
        if (i >= chunks.size) { finish(); return }
        val f = synchronized(files) { files[i] }
        if (f == null) prefetch(s, i, voice, rate)
        if (f == null || f === PENDING) { main.postDelayed({ waitAndPlay(s, voice, rate) }, 120); return }
        if (f === FAILED) {
            Log.w(TAG, "neural voice failed -> Android TTS fallback from chunk $i")
            useDevice = true; deviceSpeak(s, i, rate); return
        }
        prefetch(s, i + 1, voice, rate); prefetch(s, i + 2, voice, rate)
        val mp = MediaPlayer()
        player = mp
        try {
            mp.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
            mp.setDataSource(f.absolutePath)
            mp.setOnCompletionListener { it.release(); if (player === it) player = null; f.delete(); if (s == session) { playing++; waitAndPlay(s, voice, rate) } }
            mp.setOnErrorListener { m, _, _ -> m.release(); if (player === m) player = null; if (s == session) { playing++; waitAndPlay(s, voice, rate) }; true }
            mp.prepare(); mp.start()
            lastEngine = "edge:${voice.edge}"
            Log.i(TAG, "playing chunk $i (${f.length()}B) isPlaying=${mp.isPlaying} dur=${mp.duration}ms")
            onState("🔊 ${voice.label.substringBefore(" —")} • ${i + 1}/${chunks.size}")
        } catch (e: Exception) {
            Log.w(TAG, "player error $e"); mp.release(); player = null; playing++; waitAndPlay(s, voice, rate)
        }
    }

    private fun deviceSpeak(s: Int, from: Int, rate: Int) {
        val t = tts
        if (t == null || !ttsReady) {
            if (t == null) tts = TextToSpeech(ctx) { st -> ttsReady = st == TextToSpeech.SUCCESS; main.post { if (s == session) { if (ttsReady) deviceSpeak(s, from, rate) else { onState("لا يتوفر صوت عربي على الجهاز"); finish() } } } }
            else main.postDelayed({ deviceSpeak(s, from, rate) }, 200)
            return
        }
        val loc = Locale("ar")
        if (t.isLanguageAvailable(loc) < TextToSpeech.LANG_AVAILABLE) { onState("لا يتوفر صوت عربي على الجهاز — ثبّت بيانات العربية"); finish(); return }
        t.language = loc
        // prefer a female-sounding voice when the engine exposes one
        try { t.voices?.filter { it.locale.language == "ar" && !it.isNetworkConnectionRequired }?.let { vs -> (vs.firstOrNull { it.name.contains("female", true) || it.name.contains("-arc-") } ?: vs.firstOrNull())?.let { t.voice = it } } } catch (_: Exception) {}
        t.setPitch(1.1f); t.setSpeechRate(1f + rate / 100f)
        t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String) { main.post { if (s == session) { playing = id.toInt(); onState("🔊 صوت الجهاز • ${playing + 1}/${chunks.size}") } } }
            override fun onDone(id: String) { if (id.toInt() == chunks.size - 1) main.post { if (s == session) finish() } }
            @Deprecated("") override fun onError(id: String) {}
        })
        lastEngine = "device"
        for (i in from until chunks.size) t.speak(chunks[i], TextToSpeech.QUEUE_ADD, null, i.toString())
    }

    fun togglePause(): Boolean {
        val p = player ?: return paused
        paused = if (p.isPlaying) { p.pause(); true } else { p.start(); false }
        return paused
    }

    fun stop() {
        session++
        player?.let { try { it.stop() } catch (_: Exception) {}; it.release() }; player = null
        tts?.stop(); playing = -1; paused = false
        ctx.cacheDir.listFiles { f -> f.name.startsWith("tts_") }?.forEach { it.delete() }
    }
    private fun finish() { playing = -1; player = null; onState("") }
    fun shutdown() { stop(); tts?.shutdown(); tts = null }

    companion object {
        const val TAG = "ArReader"
        private val PENDING = File("/pending"); private val FAILED = File("/failed")
        /** Sentence chunks: first ≤ 140 chars (fast start), the rest ≤ 400. */
        fun split(paragraphs: List<String>): List<String> {
            val out = ArrayList<String>()
            for (p in paragraphs) {
                val sentences = p.split(Regex("(?<=[.!؟?!؛\\n])\\s+")).filter { it.isNotBlank() }
                var cur = StringBuilder()
                for (s0 in sentences) {
                    var s = s0.trim()
                    while (s.length > 400) { val cut = s.lastIndexOf(' ', 380).takeIf { it > 100 } ?: 380; out.addFlush(cur); out.add(s.substring(0, cut)); s = s.substring(cut).trim() }
                    val limit = if (out.isEmpty()) 140 else 400
                    if (cur.isNotEmpty() && cur.length + s.length + 1 > limit) out.addFlush(cur)
                    if (cur.isNotEmpty()) cur.append(' ')
                    cur.append(s)
                }
                out.addFlush(cur)
            }
            return out
        }
        private fun ArrayList<String>.addFlush(sb: StringBuilder) { if (sb.isNotBlank()) add(sb.toString()); sb.setLength(0) }
    }
}
