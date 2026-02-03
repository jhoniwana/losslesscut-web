# Cleanup Summary - Electron Components Removed

**Date**: February 2, 2026
**Reason**: Focused migration to Material Design 3 for web-only version

## Components Deleted (54 files removed)

### Electron-Only UI Components
- Action.tsx
- AlertDialog.tsx + AlertDialog.module.css
- AnimatedTr.tsx
- AutoExportToggler.tsx
- BatchFile.tsx
- BatchFilesList.tsx
- BigWaveform.tsx
- CaptureFormatButton.tsx
- ConcatDialog.tsx
- CopyClipboardButton.tsx
- EnhancedHomeTab.tsx
- ErrorDialog.tsx
- ExportModeButton.tsx
- ExpressionDialog.tsx
- FileNameTemplateEditor.tsx
- GenericDialog.tsx
- GpsMap.tsx
- HighlightedText.tsx + HighlightedText.module.css
- HomeUI.tsx + HomeUI.module.css
- Json5Dialog.tsx
- Kbd.tsx
- KeyboardShortcuts.tsx
- Loading.tsx + Loading.module.css
- MobileTimeline.tsx + MobileTimeline.module.css
- NeoHeader.tsx
- OutputFormatSelect.tsx
- PlaybackStreamSelector.tsx + PlaybackStreamSelector.module.css
- SegmentCutpointButton.tsx
- SetCutpointButton.tsx
- Settings.tsx + Settings.module.css
- SimpleModeButton.tsx
- Spinner.tsx
- SwalContainer.tsx
- TagEditor.tsx
- ToggleExportConfirm.tsx
- Truncated.tsx
- util.tsx
- ValueTuner.tsx + ValueTuner.module.css
- ValueTuners.tsx
- VolumeControl.tsx
- Warning.tsx
- WhatsNew.tsx + WhatsNew.module.css
- Working.tsx + Working.module.css

### Legacy CSS Module Components (replaced by MD3)
- Button.tsx + Button.module.css (replaced by NeoButton)
- Checkbox.tsx + Checkbox.module.css (will create NeoCheckbox)
- CloseButton.tsx + CloseButton.module.css (replaced by NeoIconButton)
- Dialog.tsx + Dialog.module.css (replaced by NeoDialog)
- DropdownMenu.tsx + DropdownMenu.module.css (will create NeoSelect)
- ExportButton.tsx + ExportButton.module.css (replaced by NeoButton)
- ExportConfirm.tsx + ExportConfirm.module.css (replaced by NeoDialog)
- ExportSheet.tsx + ExportSheet.module.css (not used in web)
- Select.tsx + Select.module.css (will create NeoSelect)
- Switch.tsx + Switch.module.css (replaced by NeoSwitch)
- TextInput.tsx (replaced by NeoInput)

## Components Retained (15 files - web-only)

### Core Editors
1. VideoEditor.tsx - Main video editor (in migration)
2. MultiSourceEditor.tsx - Multi-source editor (pending migration)

### Feature Components
3. CropSelector.tsx - Crop tool (partially migrated)
4. BlurRegionSelector.tsx - Blur faces tool (partially migrated)
5. WatermarkSettings.tsx - Watermark tool (partially migrated)
6. IntroOutroSelector.tsx - Intro/outro tool
7. ReplaceIntroModal.tsx - Replace intro modal

### Multi-Source Components
8. SourcePanel.tsx - Source video panel (pending migration)
9. MultiClipTimeline.tsx - Multi-clip timeline (pending migration)

### Download Feature
10. DownloadModal.tsx - YouTube/URL downloader (✅ fully migrated)

### Material Design 3 Components
11. NeoButton.tsx - MD3 button component ✅
12. NeoCard.tsx - MD3 card component ✅
13. NeoDialog.tsx - MD3 dialog component ✅
14. NeoInput.tsx - MD3 input component ✅
15. NeoSwitch.tsx - MD3 switch component ✅

## Impact

### Before Cleanup
- Total components: 69 .tsx files
- Many unused Electron components
- Mixed styling approaches (CSS modules, inline, legacy)

### After Cleanup
- Total components: 15 .tsx files (-78% reduction)
- Only web-used components
- Focused on MD3 migration

### Build Status
- ✅ Build successful (exit code 0)
- ✅ Container healthy
- ✅ Web app running on http://localhost:9090/

## Next Steps

1. Continue VideoEditor.tsx MD3 migration (40% complete)
2. Create missing Neo components (NeoCheckbox, NeoSelect, NeoSlider)
3. Migrate remaining web components to MD3
4. Complete testing and QA
