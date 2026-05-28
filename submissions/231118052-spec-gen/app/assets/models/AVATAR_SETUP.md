# Avatar Model — Kurulum Talimatı

Bu klasöre kendi Avaturn yüz modelini koymalısın.

## Adımlar

1. **avaturn.me** adresine git
2. "Create Avatar" → kendi yüz fotoğrafını yükle
3. Avatarı özelleştir (saç, kıyafet vs.)
4. Export → **GLB format** seç
5. İndirilen dosyayı `avatar.glb` olarak bu klasöre kaydet:
   `app/assets/models/avatar.glb`
6. Uygulamayı yeniden başlat: `npx expo start`

## Önemli Notlar

- **Generic head model kabul edilmez** — ödevin şartı kendi yüzün
- GLB dosyası ReadyPlayerMe/Avaturn standart blend shape'lere sahip olmalı
- Yoksa otomatik placeholder aktif olur (küre kafa, basit lipsync)
- Dosya boyutu tercihen < 15MB (mobile performans)

## Desteklenen Blend Shapes

```
jawOpen
mouthSmileLeft / mouthSmileRight  
mouthFunnel
mouthPucker
mouthShrugUpper
eyeBlinkLeft / eyeBlinkRight (opsiyonel)
```
