package com.blue.arabicbrowser
import org.junit.Assert.*
import org.junit.Test
class UnitTests {
    @Test fun parseGoogleFormats() {
        assertEquals(listOf("مرحبًا"), Translator.parseGoogle("""[["مرحبًا","en"]]""", 1))
        assertEquals(listOf("a", "b"), Translator.parseGoogle("""[["a","en"],["b","en"]]""", 2))
        assertEquals(listOf("a", "b"), Translator.parseGoogle("""["a","b"]""", 2))
        assertNull(Translator.parseGoogle("""["a"]""", 3))
    }
    @Test fun splitChunks() {
        val p = listOf("جملة أولى قصيرة. " + "كلام ".repeat(60) + "نهاية؟ وجملة أخرى.")
        val c = Reader.split(p)
        assertTrue(c[0].length <= 140)
        assertTrue(c.all { it.length <= 400 })
        assertEquals(p[0].replace(Regex("\\s+"), ""), c.joinToString("").replace(Regex("\\s+"), ""))
    }
    @Test fun fixUrl() {
        assertEquals("https://bbc.com", Pages.fixUrl("bbc.com"))
        assertTrue(Pages.fixUrl("weather in amman").startsWith("https://www.google.com/search?q="))
        assertEquals("https://x.org/a", Pages.fixUrl("https://x.org/a"))
    }
}
