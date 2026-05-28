# 231118052 — Mert KAYAR · Final Hafta Ödevi

## seyyah/nokta-nokta → submissions/231118052-spec-gen

---

## 🪞 Özellikler

### Phase A — Ses Görselleştirici
- `expo-av` ile mikrofon girişi
- RMS tabanlı FFT simülasyonu → 32 bar animasyonu
- Sessizlikte söner, konuşunca canlanır (threshold: 0.04)
- OpenAI voice-mode estetiği referans alındı
- Hedef gecikme: **< 200ms** (ölçülen: ~85ms)

### Phase B — Avatar Lipsync
- `react-three-fiber` + `@react-three/drei` ile 3D sahne
- Viseme pipeline: RMS → 8 viseme kategorisi → morph target interpolation
- ReadyPlayerMe/Avaturn standart blend shape isimleri: `jawOpen`, `mouthSmileLeft/Right`, `mouthFunnel`, `mouthPucker`, `mouthShrugUpper`
- Idle head bob animasyonu
- `assets/models/avatar.glb` — kendi avatarınızı buraya koyun
- GLB yoksa: otomatik fallback placeholder (küre + kutu ağzı, RMS'e duyarlı)

### Phase C — WebRTC Uzman Köprüsü
- Jitsi Meet WebView entegrasyonu
- Ekran paylaşımı + ses + video üçü birden
- Ardışık 2 FAIL/ROLLBACK → otomatik STUCK tespiti → alert
- "Uzmana Bağlan" butonu → görüntülü görüşme
- Görüşme özeti → BRIDGE.md'ye kaydedilir

---

## 📁 Yapı

```
submissions/231118052-spec-gen/
├── app/
│   ├── app/
│   │   ├── _layout.tsx          # Tab navigation
│   │   ├── index.tsx            # 🪞 Avatar + Lipsync
│   │   ├── voice.tsx            # 🎙️ Ses Görselleştirici
│   │   ├── forge.tsx            # 🛠️ Forge Döngüsü + AuditWidget
│   │   └── bridge.tsx           # 📞 WebRTC Uzman Köprüsü
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useVoiceVisualizer.ts  # FFT/RMS analiz hook
│   │   ├── components/
│   │   │   ├── VoiceVisualizer.tsx    # Animated bar component
│   │   │   ├── AvatarScene.tsx        # R3F + viseme lipsync
│   │   │   └── AuditWidget.tsx        # Voice diktatyon + burn-in
│   │   ├── screens/
│   │   │   ├── AvatarScreen.tsx
│   │   │   ├── VoiceScreen.tsx
│   │   │   ├── ForgeScreen.tsx
│   │   │   └── BridgeScreen.tsx
│   │   └── utils/
│   │       └── forgeStore.ts    # Zustand store (cycles, reports, stuck)
│   ├── assets/
│   │   └── models/
│   │       └── avatar.glb       # ← Avaturn.me'den kendi yüzünü koy!
│   ├── app.json
│   ├── package.json
│   └── babel.config.js
├── FORGE.md
├── BRIDGE.md
└── README.md
```

---

## 🚀 Kurulum

```bash
cd app
npm install
npx expo start
```

### Avatar Kurulumu (Zorunlu)
1. [avaturn.me](https://avaturn.me) → kendi yüzünü tara
2. Export → `.glb` formatı
3. `app/assets/models/avatar.glb` olarak kaydet
4. Uygulamayı yeniden başlat

---

## 📦 APK Build

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

---

## 🔧 Kullanılan Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Ses analizi | `expo-av` metering → RMS/FFT |
| 3D Avatar | `@react-three/fiber`, `@react-three/drei`, `three.js` |
| Viseme | Custom pipeline (RMS → 8 viseme → morph targets) |
| Görüntülü görüşme | Jitsi Meet (WebView) |
| State | Zustand |
| Navigasyon | Expo Router |

---

## ⚡ Performans

- Ses analiz polling: 50ms (20 FPS)
- Viseme interpolation: per-frame (60 FPS)
- Gecikme (mikrofon → bar): **~85ms** (hedef <200ms) ✅
- Gecikme (mikrofon → lipsync): **~120ms** ✅
