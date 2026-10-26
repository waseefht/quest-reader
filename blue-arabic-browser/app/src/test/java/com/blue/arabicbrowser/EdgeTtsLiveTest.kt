package com.blue.arabicbrowser
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.io.File
/** Live network check of every neural voice. Runs only with AR_LIVE=1; writes /tmp/arblue_edge_live.txt */
class EdgeTtsLiveTest {
    @Test fun allVoices() {
        assumeTrue(System.getenv("AR_LIVE") == "1")
        val out = StringBuilder()
        Voices.ALL.filter { it.edge.isNotEmpty() }.forEach { v ->
            val t0 = System.currentTimeMillis()
            val mp3 = EdgeTts.synth(v.edge, "مرحبًا، هذا اختبار لصوت القراءة العربي.")
            val ok = mp3 != null && mp3.size > 3000
            out.append("${v.id} ${v.edge} ${if (ok) "OK" else "FAIL"} ${mp3?.size ?: 0}B ${System.currentTimeMillis() - t0}ms\n")
            mp3?.let { File("/tmp/arblue_${v.id}.mp3").writeBytes(it) }
        }
        File("/tmp/arblue_edge_live.txt").writeText(out.toString())
    }
}
