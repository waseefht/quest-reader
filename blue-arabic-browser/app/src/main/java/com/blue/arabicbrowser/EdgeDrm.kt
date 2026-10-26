package com.blue.arabicbrowser

/**
 * Sec-MS-GEC v2 token for Microsoft Edge "Read aloud" neural TTS (same algorithm as edge-tts 7.x drm.py).
 * Pure Kotlin / JVM so it is unit-tested against reference vectors produced by the Python library.
 */
object EdgeDrm {
    const val TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
    private const val WIN_EPOCH = 11644473600L

    private val INITIAL = intArrayOf(0x6A09E667, 0xBB67AE85.toInt(), 0x3C6EF372, 0xA54FF53A.toInt(), 0x510E527F, 0x9B05688C.toInt(), 0x1F83D9AB, 0x5BE0CD19)
    private val STATE = intArrayOf(0xFD9FBEA2.toInt(), 0x91243CE7.toInt(), 0xBE499094.toInt(), 0xCD2E1E0A.toInt(), 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4.toInt(), 0x03EFFBD2)
    private val SCHEDULE = longArrayOf(0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6,
        0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564).map { it.toInt() }.toIntArray()
    private val K = longArrayOf(
        0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
        0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
        0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
        0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
        0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
        0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
        0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
        0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2).map { it.toInt() }.toIntArray()
    private const val ADJ = 0xC9DC06A7.toInt()
    private val BLOCK_K = K.copyOf().also { it[14] = ADJ }
    private const val SIG0_ADJ = 0x059C0B80
    private const val SIG1_ADJ = 0x000B92C0
    private val CS64 = arrayOf(
        0xE82E91B1 to 0xB32700D0, 0x44DE24C6 to 0x88DFF51D, 0x3BEB65BC to 0x29514038, 0xC89C5933 to 0xB328CBDF,
        0x8D1EC211 to 0xD405B4D5, 0x314EF5D5 to 0x26E55F3C, 0xE92491B1 to 0x607801C6, 0xF0A5B9D5 to 0x82B2C1FB,
        0x06064CF3 to 0xFA51A3DA, 0xDA79FA60 to 0x207CC464, 0xBED20560 to 0x3C3C74F3, 0x89F9C9F8 to 0xD2D14B61,
        0x35FA38C6 to 0xBB04A2C1, 0xCB49E3C6 to 0xC5626167).map { it.first.toInt() to it.second.toInt() }
    private const val CS64_FACTOR = 0x82893933.toInt()
    private const val CS64_ADJ0 = 0xF2F90B1A.toInt()
    private const val CS64_ADJ1 = 0x0B1A0000

    private fun rotr(x: Int, n: Int) = Integer.rotateRight(x, n)
    private fun s0(x: Int) = rotr(x, 7) xor rotr(x, 18) xor (x ushr 3)
    private fun s1(x: Int) = rotr(x, 17) xor rotr(x, 19) xor (x ushr 10)
    private fun rol16(x: Int) = Integer.rotateLeft(x, 16)

    private fun rounds(state: IntArray, w: IntArray, first: Int): IntArray {
        var a = state[0]; var b = state[1]; var c = state[2]; var d = state[3]
        var e = state[4]; var f = state[5]; var g = state[6]; var h = state[7]
        val k = if (first == 14) BLOCK_K else K
        for (i in first until 64) {
            val t1 = h + (rotr(e, 6) xor rotr(e, 11) xor rotr(e, 25)) + (g xor (e and (f xor g))) + k[i] + w[i]
            val t2 = (rotr(a, 2) xor rotr(a, 13) xor rotr(a, 22)) + ((a and b) or (c and (a or b)))
            h = g; g = f; f = e; e = d + t1; d = c; c = b; b = a; a = t1 + t2
        }
        return intArrayOf(a, b, c, d, e, f, g, h)
    }

    private fun expand(w: IntArray, first: Int) { for (i in first until 64) w[i] = s1(w[i - 2]) + w[i - 7] + s0(w[i - 15]) + w[i - 16] }

    private fun be(b: ByteArray, off: Int, n: Int): Int { var v = 0; for (i in 0 until n) v = (v shl 8) or (b[off + i].toInt() and 0xFF); return v }

    private fun init(d: ByteArray): IntArray {
        val w = IntArray(64)
        w[14] = be(d, 0, 3); w[15] = be(d, 3, 4)
        for (i in 16 until 30) {
            var v = SCHEDULE[i - 16]
            if (i - 2 >= 14) v += if (i == 16) s1(w[i - 2]) xor SIG1_ADJ else s1(w[i - 2])
            if (i - 7 >= 14) v += w[i - 7]
            if (i - 15 >= 14) v += if (i == 29) s0(w[i - 15]) xor SIG0_ADJ else s0(w[i - 15])
            w[i] = v
        }
        w[30] = s1(w[28]) + w[23] + s0(w[15]) + w[14] + ADJ - K[14]
        expand(w, 31)
        val work = rounds(STATE, w, 14)
        return IntArray(8) { INITIAL[it] + work[it] }
    }

    fun sha(data: ByteArray): ByteArray {
        require(data.size >= 7)
        val length = 57 + data.size
        val tail = data.copyOfRange(7, data.size)
        val zeros = Math.floorMod(55 - length, 64)
        val padded = java.io.ByteArrayOutputStream().apply {
            write(tail); write(0x80); write(ByteArray(zeros))
            val bits = length.toLong() * 8; for (i in 7 downTo 0) write(((bits ushr (8 * i)) and 0xFF).toInt())
        }.toByteArray()
        var st = init(data.copyOfRange(0, 7))
        var off = 0
        while (off < padded.size) {
            val w = IntArray(64); for (i in 0 until 16) w[i] = be(padded, off + i * 4, 4)
            expand(w, 16)
            val work = rounds(st, w, 0)
            st = IntArray(8) { st[it] + work[it] }
            off += 64
        }
        val out = ByteArray(32); for (i in 0 until 8) for (j in 0 until 4) out[i * 4 + j] = (st[i] ushr (24 - 8 * j)).toByte()
        return out
    }

    private fun le(b: ByteArray, off: Int): Int { var v = 0; for (i in 3 downTo 0) v = (v shl 8) or (b[off + i].toInt() and 0xFF); return v }

    fun cs64(data: ByteArray, digest: ByteArray): Pair<Int, Int> {
        val ka = le(digest, 0) or 1; val kb = le(digest, 4) or 1
        val factors = intArrayOf(ka * CS64_FACTOR, kb * CS64_FACTOR)
        val terms = ArrayList<Int>(); val offsets = ArrayList<Int>()
        CS64.forEachIndexed { i, (c, o) -> terms.add(c * factors[i % 2]); offsets.add(o) }
        val raw = ByteArray(1) + data
        var padLen = raw.size + Math.floorMod(-raw.size, 4)
        val padded = raw.copyOf(padLen)
        var words = IntArray(padLen / 4) { le(padded, it * 4) }
        if (words.size % 2 == 1) words = words.copyOf(words.size + 1)
        words.forEachIndexed { i, wd ->
            var term = wd * (if (i % 2 == 0) ka else kb)
            var offset = rol16(wd) * (if (i % 2 == 0) 0xEF0569FB.toInt() else 0xC31713DB.toInt())
            if (i == 0) { term += CS64_ADJ0 * factors[0]; offset += CS64_ADJ1 }
            terms.add(term); offsets.add(offset)
        }
        var swapAcc = 0; var swapLast = 0; var state = 0; var acc = 0
        var i = 0
        while (i < terms.size) {
            val x = terms[i]; val y = terms[i + 1]
            var t = rol16(offsets[i] + x); var q = t * 0x76F50F34
            swapAcc += rol16(q) * 0xC3EFEA97.toInt() + q
            t = rol16(offsets[i + 1] + y); q = t * 0x1881CE3C
            swapLast = rol16(q) * 0x35BD1EC9 + q
            swapAcc += swapLast
            state = state * ka + x
            state = rol16(state) * 0xCF98B111.toInt()
            state = rol16(state) * 0x87085B9F.toInt()
            state = rol16(state) * 0x12CEB96D
            state = rol16(state) * 0x257E1D83
            acc += state
            t = state * kb + y
            t = rol16(t) * 0xA27416F5.toInt()
            t = rol16(t) * 0xD38396FF.toInt()
            state = rol16(rol16(t) * 0x7C932B89) * 0xBFA49F69.toInt()
            acc += state
            i += 2
        }
        return (swapLast xor state) to (swapAcc xor acc)
    }

    private fun hex(b: ByteArray) = b.joinToString("") { "%02X".format(it.toInt() and 0xFF) }

    /** @param unixSeconds current time (with clock-skew correction applied by caller). */
    fun token(unixSeconds: Double): String {
        var secs = Math.floor(unixSeconds).toLong() + WIN_EPOCH
        secs -= secs % 300
        val ticks = secs * 10_000_000L
        val data = "$ticks$TRUSTED_CLIENT_TOKEN".toByteArray(Charsets.US_ASCII)
        val dg = sha(data)
        val (a, b) = cs64(data, dg)
        val cs = ByteArray(8); for (j in 0 until 4) { cs[j] = (a ushr (8 * j)).toByte(); cs[4 + j] = (b ushr (8 * j)).toByte() }
        return hex(cs) + "-" + hex(dg)
    }
}
