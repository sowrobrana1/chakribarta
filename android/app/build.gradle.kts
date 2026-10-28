plugins {
    id("com.android.application")
}

android {
    namespace = "com.sowrobrana.chakribarta"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.sowrobrana.chakribarta"
        minSdk = 24
        targetSdk = 36
        versionCode = 3
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
}
