package com.blue.arabicbrowser

/** Read-aloud voices. edge = Microsoft Edge "Read aloud" neural voice (online, keyless); device = Android TextToSpeech. */
data class VoiceOpt(val id: String, val label: String, val edge: String = "", val female: Boolean = true)

object Voices {
    const val DEFAULT = "amany"
    val ALL = listOf(
        VoiceOpt("amany", "أماني — سورية (شامية) ♀", "ar-SY-AmanyNeural"),
        VoiceOpt("layla", "ليلى — لبنانية (شامية) ♀", "ar-LB-LaylaNeural"),
        VoiceOpt("sana", "سناء — أردنية (شامية) ♀", "ar-JO-SanaNeural"),
        VoiceOpt("zariyah", "زارية — سعودية ♀", "ar-SA-ZariyahNeural"),
        VoiceOpt("salma", "سلمى — مصرية ♀", "ar-EG-SalmaNeural"),
        VoiceOpt("fatima", "فاطمة — إماراتية ♀", "ar-AE-FatimaNeural"),
        VoiceOpt("noura", "نورة — كويتية ♀", "ar-KW-NouraNeural"),
        VoiceOpt("rana", "رنا — عراقية ♀", "ar-IQ-RanaNeural"),
        VoiceOpt("amal", "أمل — قطرية ♀", "ar-QA-AmalNeural"),
        VoiceOpt("laith", "ليث — سوري ♂", "ar-SY-LaithNeural", false),
        VoiceOpt("taim", "تيم — أردني ♂", "ar-JO-TaimNeural", false),
        VoiceOpt("device", "صوت الجهاز (بدون إنترنت)"),
    )
    fun byId(id: String?) = ALL.firstOrNull { it.id == id } ?: ALL[0]
    fun index(id: String?) = ALL.indexOf(byId(id))
}
