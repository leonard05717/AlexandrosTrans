package com.alexandrostransport.driver

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Initial native Android entry screen.
 * No shift or GPS controls are included until the build and Supabase contract
 * have been verified.
 */
class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(32, 32, 32, 32)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val title = TextView(this).apply {
            text = "BusTrack Driver"
            textSize = 28f
            gravity = Gravity.CENTER
        }

        val status = TextView(this).apply {
            text = "Android app foundation is installed.\n\nNext: verify the build, then connect driver sign-in and background GPS."
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 0)
        }

        root.addView(title)
        root.addView(status)
        setContentView(root)
    }
}
