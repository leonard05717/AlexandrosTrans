plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.alexandrostransport.driver"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.alexandrostransport.driver"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "SUPABASE_URL", "\"https://ubacukedkhflmiakiuxi.supabase.co\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"REPLACE_WITH_YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY\"")
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
