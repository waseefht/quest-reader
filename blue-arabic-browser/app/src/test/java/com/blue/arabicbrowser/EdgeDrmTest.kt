package com.blue.arabicbrowser
import org.junit.Assert.assertEquals
import org.junit.Test
/** Reference vectors generated with edge-tts (Python) drm.generate_sec_ms_gec_v2 on the build box. */
class EdgeDrmTest {
    @Test fun matchesPythonReference() {
        assertEquals("2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2", EdgeDrm.token(1700000000.0))
        assertEquals("F8827104577BEB89-D2534978A2856916F0CA795BE2F991A4CF7E9605D61D22190E738C79FDA3A8C4", EdgeDrm.token(1792812095.5))
        assertEquals("99E54519B490BE5C-E162DB0977FBDCB9B86DD8148BF1BCDC3C0303176CE39852A42B415935C20654", EdgeDrm.token(1800000123.0))
        assertEquals("2D62557F1142BC5D-FD9C30C68FF194A5EE6B45FEFC5E2BA1D1239F88A90569AB55CFFFAA7799F40E", EdgeDrm.token(2000000000.0))
    }
}
