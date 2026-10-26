package com.blue.arabicbrowser

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.text.Html
import android.util.Log
import android.util.TypedValue
import android.view.*
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.webkit.*
import android.widget.*
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONArray

class MainActivity : Activity() {
    lateinit var store: Store
    lateinit var translator: Translator
    private lateinit var reader: Reader
    private lateinit var script: String
    private val docStart by lazy { WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT) }

    private val tabs = ArrayList<Tab>()
    private var cur = 0
    private val tab get() = tabs[cur]

    private lateinit var content: FrameLayout
    private lateinit var url: EditText
    private lateinit var btnMode: Button
    private lateinit var btnTabs: Button
    private lateinit var progress: ProgressBar
    private lateinit var readerBar: LinearLayout
    private lateinit var readerText: TextView
    private lateinit var readerPause: Button
    private var fullView: View? = null
    private var fullCb: WebChromeClient.CustomViewCallback? = null
    private var fileCb: ValueCallback<Array<Uri>>? = null
    private val forceMode = java.util.concurrent.ConcurrentHashMap<WebView, String>()   // per-tab override set by "open translated/normal"
    private val crashTimes = mutableListOf<Long>()

    private fun dp(v: Int) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        store = Store(this); translator = Translator(this)
        reader = Reader(this) { s -> runOnUiThread { readerText.text = s; readerBar.visibility = if (s.isEmpty()) View.GONE else View.VISIBLE } }
        script = assets.open("translate.js").bufferedReader().readText()
        WebView.setWebContentsDebuggingEnabled(true)
        buildUi()
        val saved = store.tabs.filter { it.isNotBlank() }
        val start = intent?.dataString
        if (saved.isEmpty()) newTab(Pages.HOME) else saved.forEach { newTab(it, select = false) }
        cur = store.currentTab.coerceIn(0, tabs.size - 1); show(cur)
        if (start != null && start.startsWith("http")) newTab(start)
        Log.i(TAG, "started docStart=$docStart webview=${WebViewCompat.getCurrentWebViewPackage(this)?.versionName}")
    }

    override fun onNewIntent(i: Intent?) { super.onNewIntent(i); i?.dataString?.takeIf { it.startsWith("http") }?.let { newTab(it) } }

    // ---------------- UI ----------------
    private fun btn(t: String, desc: String, click: () -> Unit) = Button(this).apply {
        text = t; contentDescription = desc; isAllCaps = false; setTextColor(Color.WHITE); textSize = 18f
        background = null; minWidth = 0; minimumWidth = 0; setPadding(dp(8), 0, dp(8), 0)
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48))
        setOnClickListener { click() }
        setOnLongClickListener { Toast.makeText(context, desc, Toast.LENGTH_SHORT).show(); true }
    }

    private fun buildUi() {
        window.statusBarColor = ACCENT
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; layoutDirection = View.LAYOUT_DIRECTION_RTL; setBackgroundColor(Color.WHITE) }
        val bar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setBackgroundColor(ACCENT); setPadding(dp(2), dp(2), dp(2), dp(2)) }
        bar.addView(btn("→", "رجوع") { if (tab.web.canGoBack()) tab.web.goBack() })
        bar.addView(btn("←", "تقدّم") { if (tab.web.canGoForward()) tab.web.goForward() })
        bar.addView(btn("⟳", "إعادة تحميل") { val p = tab.pendingUrl; if (p != null) { tab.pendingUrl = null; tab.web.loadUrl(p) } else tab.web.reload() })
        url = EditText(this).apply {
            hint = "ابحث أو اكتب عنواناً"; setSingleLine(); textSize = 15f; imeOptions = EditorInfo.IME_ACTION_GO
            inputType = android.text.InputType.TYPE_TEXT_VARIATION_URI or android.text.InputType.TYPE_CLASS_TEXT
            textDirection = View.TEXT_DIRECTION_FIRST_STRONG_LTR
            setTextColor(Color.BLACK); setHintTextColor(Color.GRAY); setPadding(dp(12), 0, dp(12), 0)
            background = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(20).toFloat() }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply { marginStart = dp(4); marginEnd = dp(4) }
            setSelectAllOnFocus(true)
            setOnEditorActionListener { _, a, _ -> if (a == EditorInfo.IME_ACTION_GO || a == EditorInfo.IME_NULL) { go(text.toString()); true } else false }
        }
        bar.addView(url)
        btnMode = btn("ع", "وضع الترجمة: عربي كامل ← ثنائي اللغة ← بدون ترجمة") { cycleMode() }.apply { textSize = 16f; typeface = Typeface.DEFAULT_BOLD }
        bar.addView(btnMode)
        btnTabs = btn("1", "التبويبات") { showTabs() }.apply { textSize = 15f }
        bar.addView(btnTabs)
        lateinit var menuBtn: Button; menuBtn = btn("⋮", "القائمة") { showMenu(menuBtn) }; bar.addView(menuBtn)
        root.addView(bar, LinearLayout.LayoutParams(-1, -2))
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply { max = 100; visibility = View.GONE }
        root.addView(progress, LinearLayout.LayoutParams(-1, dp(3)))
        readerBar = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; setBackgroundColor(0xFF263238.toInt()); visibility = View.GONE; setPadding(dp(8), 0, dp(8), 0) }
        readerText = TextView(this).apply { setTextColor(Color.WHITE); textSize = 14f; layoutParams = LinearLayout.LayoutParams(0, -2, 1f) }
        readerPause = btn("⏸", "إيقاف مؤقت / متابعة") { readerPause.text = if (reader.togglePause()) "▶" else "⏸" }
        readerBar.addView(readerText); readerBar.addView(readerPause); readerBar.addView(btn("⏹", "إيقاف القراءة") { reader.stop(); readerBar.visibility = View.GONE })
        root.addView(readerBar, LinearLayout.LayoutParams(-1, dp(44)))
        content = FrameLayout(this)
        root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
        setContentView(root)
    }

    private fun handleView(v: View?) { v?.let { (getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager).hideSoftInputFromWindow(it.windowToken, 0) } }

    private fun go(input: String) { handleView(url); url.clearFocus(); tab.web.loadUrl(Pages.fixUrl(input)) }

    // ---------------- tabs ----------------
    @SuppressLint("SetJavaScriptEnabled")
    fun newTab(u: String, select: Boolean = true, force: String? = null): Tab {
        val w = WebView(this)
        val t = Tab(w, this)
        w.settings.apply {
            javaScriptEnabled = true; domStorageEnabled = true; databaseEnabled = true
            loadWithOverviewMode = true; useWideViewPort = true
            builtInZoomControls = true; displayZoomControls = false; setSupportZoom(true)
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            setGeolocationEnabled(false)
            userAgentString = userAgentString.replace("; wv", "").replace(Regex("Version/\\d+\\.\\d+ "), "")
            textZoom = 100
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true)
        w.addJavascriptInterface(t.bridge, "ArBridge")
        if (docStart) WebViewCompat.addDocumentStartJavaScript(w, script, setOf("*"))
        w.webViewClient = Client(t)
        w.webChromeClient = Chrome(t)
        w.setDownloadListener { dl, ua, cd, mime, _ -> download(dl, ua, cd, mime) }
        registerForContextMenu(w)
        if (force != null) forceMode[w] = force
        tabs.add(t)
        if (u.isNotEmpty()) w.loadUrl(u)
        if (select) show(tabs.size - 1) else updateTabsBtn()
        return t
    }

    private fun show(i: Int) {
        cur = i.coerceIn(0, tabs.size - 1)
        content.removeAllViews()
        content.addView(tab.web, FrameLayout.LayoutParams(-1, -1))
        tab.web.onResume()
        updateUrl(); updateModeBtn(); updateTabsBtn()
    }

    private fun closeTab(i: Int) {
        val t = tabs.removeAt(i); forceMode.remove(t.web)
        content.removeView(t.web); t.web.destroy()
        if (tabs.isEmpty()) newTab(Pages.HOME) else show(if (cur >= tabs.size) tabs.size - 1 else if (i < cur) cur - 1 else cur)
    }

    private fun updateTabsBtn() { btnTabs.text = tabs.size.toString() }
    private fun updateUrl() { if (!url.hasFocus()) url.setText(tab.web.url?.let { if (Pages.isInternal(it)) "" else it } ?: "") }

    private fun showTabs() {
        val list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; layoutDirection = View.LAYOUT_DIRECTION_RTL; setPadding(dp(8), dp(8), dp(8), dp(8)) }
        lateinit var dlg: AlertDialog
        tabs.forEachIndexed { i, t ->
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL; if (i == cur) setBackgroundColor(0x221E88E5) }
            row.addView(TextView(this).apply {
                text = (t.web.title?.takeIf { it.isNotBlank() } ?: t.web.url ?: "تبويب").let { if (Pages.isInternal(t.web.url)) "الصفحة الرئيسية" else it }
                textSize = 16f; maxLines = 2; setPadding(dp(8), dp(12), dp(8), dp(12)); setTextColor(Color.BLACK)
                layoutParams = LinearLayout.LayoutParams(0, -2, 1f); setOnClickListener { show(i); dlg.dismiss() }
            })
            row.addView(Button(this).apply { text = "✕"; contentDescription = "إغلاق التبويب"; background = null; setOnClickListener { closeTab(i); dlg.dismiss(); showTabs() } })
            list.addView(row)
        }
        dlg = AlertDialog.Builder(this).setTitle("التبويبات (${tabs.size})").setView(ScrollView(this).apply { addView(list) })
            .setPositiveButton("تبويب جديد") { _, _ -> newTab(Pages.HOME) }.setNegativeButton("إغلاق", null).create()
        dlg.show()
    }

    // ---------------- translation mode ----------------
    /** Called on the JS thread for each document; honours per-tab overrides. */
    fun modeForWeb(w: WebView?, u: String): String = (w?.let { forceMode[it] } ?: store.modeFor(u)).let { if (Pages.isInternal(u)) "off" else it }

    fun onTabMode(t: Tab) { if (tabs.getOrNull(cur) === t) updateModeBtn() }
    fun onTabTitle(t: Tab) {}

    private fun updateModeBtn() {
        val m = tab.mode
        btnMode.text = when (m) { "ar" -> "ع"; "bi" -> "ع|A"; "arabic" -> "ع✓"; else -> "A" }
        btnMode.setTextColor(if (m == "off") 0xFFB0BEC5.toInt() else Color.WHITE)
    }

    private fun cycleMode() {
        val u = tab.web.url ?: return
        if (Pages.isInternal(u)) { Toast.makeText(this, "افتح موقعاً لترجمته", Toast.LENGTH_SHORT).show(); return }
        val next = when (tab.mode) { "ar" -> "bi"; "bi" -> "off"; else -> "ar" }
        setPageMode(next, remember = true)
    }

    private fun setPageMode(m: String, remember: Boolean) {
        val u = tab.web.url ?: return
        if (remember) { store.setSiteMode(Store.host(u), m); forceMode.remove(tab.web) }
        tab.mode = m; updateModeBtn()
        Toast.makeText(this, when (m) { "ar" -> "ترجمة عربية كاملة"; "bi" -> "وضع ثنائي اللغة"; else -> "بدون ترجمة" } + (if (remember) " — لهذا الموقع" else ""), Toast.LENGTH_SHORT).show()
        tab.web.evaluateJavascript("(function(){if(!window.__arT)return 'none';return __arT.setMode('$m',${store.flipPage},true)})()") { r ->
            if (r?.contains("none") == true) { if (!docStart) injectFallback(tab.web) else tab.web.reload() }
        }
    }

    private fun injectFallback(w: WebView) { w.evaluateJavascript(script, null) }

    // ---------------- menu ----------------
    private fun showMenu(anchor: View) {
        val pm = PopupMenu(this, anchor)
        val items = listOf("🏠 الصفحة الرئيسية", "🔗 روابط سريعة", (if (store.isBookmarked(tab.web.url)) "★ إزالة الإشارة" else "☆ إضافة إشارة مرجعية"), "📑 الإشارات المرجعية",
            "➕ تبويب جديد", "🔊 قراءة الصفحة بصوت عالٍ", "🈯 ترجمة النص المحدد", "🌐 وضع الترجمة لهذا الموقع…", "⚙️ الإعدادات", "ℹ️ حول التطبيق")
        items.forEachIndexed { i, s -> pm.menu.add(0, i, i, s) }
        pm.setOnMenuItemClickListener { mi ->
            when (mi.itemId) {
                0 -> tab.web.loadUrl(Pages.HOME)
                1 -> tab.web.loadUrl(Pages.LINKS)
                2 -> tab.web.url?.let { u -> if (!Pages.isInternal(u)) { val on = store.toggleBookmark(tab.web.title ?: u, u); Toast.makeText(this, if (on) "أُضيفت الإشارة" else "أُزيلت الإشارة", Toast.LENGTH_SHORT).show() } }
                3 -> showBookmarks()
                4 -> newTab(Pages.HOME)
                5 -> readAloud()
                6 -> translateSelection()
                7 -> siteModeDialog()
                8 -> settings()
                9 -> about()
            }
            true
        }
        pm.show()
    }

    private fun siteModeDialog() {
        val host = Store.host(tab.web.url) ?: return
        val opts = arrayOf("تلقائي (حسب الإعداد العام)", "عربي كامل", "ثنائي اللغة", "بدون ترجمة")
        val codes = arrayOf(null, "ar", "bi", "off")
        val sel = codes.indexOf(store.siteMode(host)).coerceAtLeast(0)
        AlertDialog.Builder(this).setTitle("الترجمة في $host").setSingleChoiceItems(opts, sel) { d, w ->
            store.setSiteMode(host, codes[w]); forceMode.remove(tab.web); d.dismiss()
            setPageMode(store.modeFor(tab.web.url), remember = false)
        }.show()
    }

    private fun showBookmarks() {
        val bms = store.bookmarks()
        if (bms.isEmpty()) { Toast.makeText(this, "لا توجد إشارات مرجعية بعد", Toast.LENGTH_SHORT).show(); return }
        AlertDialog.Builder(this).setTitle("الإشارات المرجعية")
            .setItems(bms.map { it.title }.toTypedArray()) { _, i -> tab.web.loadUrl(bms[i].url) }
            .setNeutralButton("تعديل…") { _, _ ->
                AlertDialog.Builder(this).setTitle("احذف إشارة").setItems(bms.map { "✕ " + it.title }.toTypedArray()) { _, i -> store.removeBookmark(bms[i].url) }.show()
            }.setNegativeButton("إغلاق", null).show()
    }

    private fun about() {
        AlertDialog.Builder(this).setTitle("متصفح بلو العربي ${BuildConfigLite.VERSION}")
            .setMessage("متصفح عادي يترجم كل موقع إلى العربية تلقائياً:\n• ع = عربي كامل (من اليمين لليسار)\n• ع|A = ثنائي اللغة (الترجمة تحت كل فقرة)\n• A = بدون ترجمة\n\nالمحرك: ${WebViewCompat.getCurrentWebViewPackage(this)?.let { it.packageName + " " + it.versionName } ?: "WebView"}\nمزوّد الترجمة الأخير: ${translator.lastProvider.ifEmpty { "—" }}\nترجمات محفوظة: ${translator.cacheSize()}")
            .setPositiveButton("حسناً", null).show()
    }

    // ---------------- settings ----------------
    private fun settings() {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; layoutDirection = View.LAYOUT_DIRECTION_RTL; setPadding(dp(20), dp(8), dp(20), dp(8)) }
        fun label(s: String) = TextView(this).apply { text = s; textSize = 15f; setTypeface(typeface, Typeface.BOLD); setPadding(0, dp(14), 0, dp(4)); setTextColor(Color.BLACK) }
        val auto = Switch(this).apply { text = "ترجمة تلقائية عند فتح أي صفحة"; isChecked = store.autoTranslate; textSize = 15f }
        box.addView(auto)
        box.addView(label("الوضع الافتراضي"))
        val rg = RadioGroup(this)
        val rAr = RadioButton(this).apply { text = "عربي كامل (تُستبدل النصوص بالعربية)"; id = View.generateViewId() }
        val rBi = RadioButton(this).apply { text = "ثنائي اللغة (الترجمة تحت كل فقرة)"; id = View.generateViewId() }
        rg.addView(rAr); rg.addView(rBi); rg.check(if (store.defaultMode == "bi") rBi.id else rAr.id); box.addView(rg)
        val flip = Switch(this).apply { text = "قلب اتجاه الصفحة كاملة (RTL) في الوضع العربي"; isChecked = store.flipPage; textSize = 15f }
        box.addView(flip)
        box.addView(label("صوت القراءة"))
        val sp = Spinner(this).apply { adapter = ArrayAdapter(context, android.R.layout.simple_spinner_dropdown_item, Voices.ALL.map { it.label }); setSelection(Voices.index(store.voice)) }
        box.addView(sp)
        val rateLbl = label("سرعة القراءة: ${store.rate}%")
        box.addView(rateLbl)
        val sb = SeekBar(this).apply { max = 150; progress = store.rate + 50
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar?, p: Int, u: Boolean) { rateLbl.text = "سرعة القراءة: ${if (p - 50 > 0) "+" else ""}${p - 50}%" }
                override fun onStartTrackingTouch(s: SeekBar?) {}; override fun onStopTrackingTouch(s: SeekBar?) {}
            }) }
        box.addView(sb)
        box.addView(Button(this).apply { text = "🔊 جرّب الصوت"; setOnClickListener {
            reader.speak(listOf("مرحباً، أنا صوت القراءة في متصفح بلو العربي. هيك رح إقرألك الصفحات المترجمة."), Voices.ALL[sp.selectedItemPosition], sb.progress - 50) } })
        box.addView(label("البيانات"))
        box.addView(Button(this).apply { text = "مسح ذاكرة الترجمة (${translator.cacheSize()})"; setOnClickListener { translator.clearCache(); text = "تم المسح" } })
        box.addView(Button(this).apply { text = "إعادة ضبط ترجمة المواقع"; setOnClickListener { store.clearSites(); text = "تمت إعادة الضبط" } })
        AlertDialog.Builder(this).setTitle("الإعدادات").setView(ScrollView(this).apply { addView(box) })
            .setPositiveButton("حفظ") { _, _ ->
                store.autoTranslate = auto.isChecked; store.defaultMode = if (rg.checkedRadioButtonId == rBi.id) "bi" else "ar"
                store.flipPage = flip.isChecked; store.voice = Voices.ALL[sp.selectedItemPosition].id; store.rate = sb.progress - 50
                if (!Pages.isInternal(tab.web.url) && forceMode[tab.web] == null) setPageMode(store.modeFor(tab.web.url), remember = false)
            }.setNegativeButton("إلغاء", null).show()
    }

    // ---------------- read aloud ----------------
    private fun readAloud() {
        readerBar.visibility = View.VISIBLE; readerText.text = "جارٍ تجهيز نص الصفحة…"; readerPause.text = "⏸"
        tab.web.evaluateJavascript("window.__arT?(__arT.prepareRead(),'ok'):'none'") { r ->
            if (r?.contains("none") == true) { readerText.text = "تعذّر قراءة الصفحة"; }
        }
    }
    fun onReadable(t: Tab, json: String) {
        val a = try { JSONArray(json) } catch (e: Exception) { JSONArray() }
        val paras = (0 until a.length()).map { a.getString(it) }
        Log.i(TAG, "readable paragraphs=${paras.size} chars=${paras.sumOf { it.length }}")
        if (paras.isEmpty()) { readerText.text = "لا يوجد نص عربي للقراءة — فعّل الترجمة أولاً"; return }
        reader.speak(paras, Voices.byId(store.voice), store.rate)
    }

    // ---------------- selected text ----------------
    override fun onActionModeStarted(mode: ActionMode) {
        super.onActionModeStarted(mode)
        if (mode.menu.findItem(SEL_ID) == null) {
            mode.menu.add(Menu.NONE, SEL_ID, 0, "ترجم للعربية").setOnMenuItemClickListener { translateSelection(); mode.finish(); true }
            mode.menu.add(Menu.NONE, SEL_ID + 1, 1, "اقرأ").setOnMenuItemClickListener { readSelection(); mode.finish(); true }
        }
    }

    private fun withSelection(cb: (String) -> Unit) {
        tab.web.evaluateJavascript("(function(){return String(window.getSelection?window.getSelection():'')})()") { r ->
            val s = try { JSONArray("[$r]").optString(0) } catch (e: Exception) { "" }.trim()
            if (s.isEmpty()) Toast.makeText(this, "حدّد نصاً أولاً (ضغطة مطوّلة على النص)", Toast.LENGTH_SHORT).show() else cb(s)
        }
    }
    private fun readSelection() = withSelection { s -> reader.speak(listOf(s), Voices.byId(store.voice), store.rate) }

    fun translateSelection() = withSelection { s ->
        val dlg = AlertDialog.Builder(this).setTitle("ترجمة النص المحدد").setMessage("جارٍ الترجمة…").setNegativeButton("إغلاق", null).create()
        dlg.show()
        translator.translateAsync(listOf(Translator.escapeHtml(s.take(4500)))) { res ->
            runOnUiThread {
                val tr = res?.firstOrNull()?.let { Html.fromHtml(it, Html.FROM_HTML_MODE_LEGACY).toString() }
                if (tr == null) { dlg.setMessage("تعذّرت الترجمة — تحقق من الاتصال"); return@runOnUiThread }
                dlg.dismiss()
                AlertDialog.Builder(this).setTitle("الترجمة").setMessage(tr)
                    .setPositiveButton("نسخ") { _, _ -> (getSystemService(CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("ar", tr)) }
                    .setNeutralButton("🔊 استمع") { _, _ -> reader.speak(listOf(tr), Voices.byId(store.voice), store.rate) }
                    .setNegativeButton("إغلاق", null).show()
            }
        }
    }

    // ---------------- link context menu ----------------
    override fun onCreateContextMenu(menu: ContextMenu, v: View, info: ContextMenu.ContextMenuInfo?) {
        val w = v as? WebView ?: return
        val r = w.hitTestResult
        val link = when (r.type) { WebView.HitTestResult.SRC_ANCHOR_TYPE, WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE -> r.extra; else -> null }
        if (link != null) {
            menu.setHeaderTitle(link)
            menu.add("فتح في تبويب جديد").setOnMenuItemClickListener { newTab(link); true }
            menu.add("فتح مترجماً (عربي كامل)").setOnMenuItemClickListener { newTab(link, force = "ar"); true }
            menu.add("فتح ثنائي اللغة").setOnMenuItemClickListener { newTab(link, force = "bi"); true }
            menu.add("نسخ الرابط").setOnMenuItemClickListener { (getSystemService(CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("url", link)); true }
        }
    }

    // ---------------- internal arblue:// actions ----------------
    private fun handleInternal(w: WebView, u: Uri): Boolean {
        when (u.host) {
            "open" -> {
                val target = u.getQueryParameter("u") ?: return true
                val m = u.getQueryParameter("m")
                if (u.getQueryParameter("nt") == "1") newTab(target, force = m)
                else { if (m != null) forceMode[w] = m else forceMode.remove(w); w.loadUrl(target) }
            }
            "settings" -> settings()
            "bookmarks" -> showBookmarks()
            "links" -> w.loadUrl(Pages.LINKS)
        }
        return true
    }

    private fun download(dl: String, ua: String, cd: String?, mime: String?) {
        try {
            val name = URLUtil.guessFileName(dl, cd, mime)
            val req = DownloadManager.Request(Uri.parse(dl)).setMimeType(mime).addRequestHeader("User-Agent", ua)
                .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(dl) ?: "")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
            (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(req)
            Toast.makeText(this, "جارٍ تنزيل $name", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) { Toast.makeText(this, "تعذّر التنزيل", Toast.LENGTH_SHORT).show() }
    }

    // ---------------- clients ----------------
    inner class Client(private val t: Tab) : WebViewClient() {
        override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean {
            val u = r.url
            if (u.scheme == "arblue") return handleInternal(v, u)
            if (u.scheme == "http" || u.scheme == "https" || u.scheme == "about" || u.scheme == "data" || u.scheme == "blob") return false
            if (u.scheme == "intent") {
                try { val i = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME); val fb = i.getStringExtra("browser_fallback_url")
                    if (i.resolveActivity(packageManager) != null) startActivity(i) else if (fb != null) v.loadUrl(fb) } catch (_: Exception) {}
                return true
            }
            try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (_: Exception) {}
            return true
        }
        override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? {
            val u = r.url
            if (u.host != "appassets.androidplatform.net") return null
            val path = u.path ?: return null
            val asset = when { path.startsWith("/assets/") -> path.removePrefix("/assets/"); path.startsWith("/fonts/") -> path.removePrefix("/fonts/"); else -> return null }
            return try {
                val mime = when (asset.substringAfterLast('.')) { "html" -> "text/html"; "js" -> "application/javascript"; "json" -> "application/json"; "ttf" -> "font/ttf"; "css" -> "text/css"; "svg" -> "image/svg+xml"; "png" -> "image/png"; else -> "application/octet-stream" }
                WebResourceResponse(mime, "utf-8", 200, "OK", mapOf("Access-Control-Allow-Origin" to "*", "Cache-Control" to "max-age=86400"), assets.open(asset))
            } catch (e: Exception) { null }
        }
        override fun onPageStarted(v: WebView, u: String?, f: Bitmap?) {
            t.mode = "off"
            if (t === tabs.getOrNull(cur)) { updateUrl(); updateModeBtn(); progress.visibility = View.VISIBLE }
        }
        override fun onPageCommitVisible(v: WebView, u: String?) { if (!docStart) injectFallback(v) }
        override fun onPageFinished(v: WebView, u: String?) {
            if (!docStart) injectFallback(v)
            if (t === tabs.getOrNull(cur)) { updateUrl(); progress.visibility = View.GONE }
            saveTabs()
        }
        override fun onRenderProcessGone(v: WebView, d: RenderProcessGoneDetail?): Boolean {
            // never crash the app because a page's renderer died: replace the WebView
            val i = tabs.indexOf(t); val last = v.url ?: Pages.HOME
            Log.w(TAG, "renderer gone for $last")
            val now = System.currentTimeMillis(); crashTimes.add(now); crashTimes.removeAll { now - it > 60_000 }
            val looping = crashTimes.size >= 3   // avoid an endless crash/reload loop
            if (looping) { crashTimes.clear(); Toast.makeText(this@MainActivity, "تعذّر عرض الصفحة (توقف محرك العرض). اضغط ⟳ لإعادة المحاولة", Toast.LENGTH_LONG).show() }
            if (i >= 0) { content.removeView(v); tabs.removeAt(i); v.destroy(); val nt = newTab(if (looping) "" else last, select = false); if (looping) nt.pendingUrl = last; tabs.remove(nt); tabs.add(i, nt); show(cur.coerceAtMost(tabs.size - 1)) }
            return true
        }
    }

    inner class Chrome(private val t: Tab) : WebChromeClient() {
        override fun onProgressChanged(v: WebView, p: Int) { if (t === tabs.getOrNull(cur)) { progress.progress = p; if (p >= 100) progress.visibility = View.GONE } }
        override fun onReceivedTitle(v: WebView, title: String?) { t.title = title ?: "" }
        override fun onPermissionRequest(r: PermissionRequest) { r.deny() }   // no runtime permissions
        override fun onGeolocationPermissionsShowPrompt(o: String?, cb: GeolocationPermissions.Callback) { cb.invoke(o, false, false) }
        override fun onShowCustomView(view: View, cb: CustomViewCallback) {
            fullView = view; fullCb = cb
            (window.decorView as FrameLayout).addView(view, FrameLayout.LayoutParams(-1, -1))
            if (android.os.Build.VERSION.SDK_INT >= 30) window.insetsController?.hide(WindowInsets.Type.systemBars())
        }
        override fun onHideCustomView() { exitFull() }
        override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
            fileCb?.onReceiveValue(null); fileCb = cb
            return try { startActivityForResult(p.createIntent(), REQ_FILE); true } catch (e: Exception) { fileCb = null; false }
        }
    }

    private fun exitFull() {
        fullView?.let { (window.decorView as FrameLayout).removeView(it) }; fullView = null
        fullCb?.onCustomViewHidden(); fullCb = null
        if (android.os.Build.VERSION.SDK_INT >= 30) window.insetsController?.show(WindowInsets.Type.systemBars())
    }

    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        if (req == REQ_FILE) { fileCb?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data)); fileCb = null }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        when {
            fullView != null -> exitFull()
            tab.web.canGoBack() -> tab.web.goBack()
            tabs.size > 1 -> closeTab(cur)
            else -> @Suppress("DEPRECATION") super.onBackPressed()
        }
    }

    private fun saveTabs() { store.tabs = tabs.map { it.web.url ?: Pages.HOME }; store.currentTab = cur }
    override fun onPause() { super.onPause(); saveTabs(); CookieManager.getInstance().flush() }
    override fun onDestroy() { reader.shutdown(); tabs.forEach { it.web.destroy() }; super.onDestroy() }

    companion object {
        const val TAG = "ArBlue"
        const val ACCENT = 0xFF1565C0.toInt()
        const val SEL_ID = 0x5e1
        const val REQ_FILE = 7
    }
}

object BuildConfigLite { const val VERSION = "1.0" }
