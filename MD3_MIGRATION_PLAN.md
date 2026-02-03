# Material Design 3 Expressive - Plan de Migración Completo

## 📊 Estado Actual (Febrero 2, 2026 - 17:30)

### ✅ Completado
- **Tema de colores**: Dark theme vibrante con colores MD3
  - Primary: #0066FF (Electric Blue)
  - Secondary: #7B3FF2 (Vivid Purple)
  - Tertiary: #00BCD4 (Energetic Cyan)
  - Superficies dark optimizadas
- **Tipografía**: Sistema de fuentes modernas (SF Pro, Segoe UI, Inter)
- **Componentes MD3 base creados** (5):
  - ✅ NeoButton (con variantes filled/outlined/text/elevated/tonal)
  - ✅ NeoIconButton
  - ✅ NeoCard (con variantes elevated/filled/outlined)
  - ✅ NeoDialog (modales MD3 compliant)
  - ✅ NeoInput (text fields con floating labels)
  - ✅ NeoSwitch (toggle switches)
- **Componentes migrados completamente** (1):
  - ✅ DownloadModal.tsx (862→502 líneas, -42% código)
- **Bugs corregidos**: 37 string literal bugs en 4 archivos
- **Custom functions eliminadas**: btn(), btnGradient(), iconBtn (50 líneas removidas)
- **🎉 CLEANUP COMPLETADO**: 54 archivos Electron-only eliminados
  - De 69 componentes → 15 componentes (-78% reducción)
  - Build exitoso ✅
  - Container healthy ✅
  - Web app funcionando en http://localhost:9090/ ✅

### 🔄 En Progreso
- VideoEditor.tsx: Timeline playback buttons convertidos (3/5), pendiente Mark In/Out buttons

## 📋 Plan de Trabajo Completo

### FASE 1: VideoEditor.tsx - Componente Principal (40-50 horas)

#### 1.1 Timeline Controls (4-6 horas)
**Archivo**: `VideoEditor.tsx` líneas 2529-2700

Botones a convertir:
- Línea 2534: Back 10s button → NeoIconButton
- Línea 2543: Play/Pause button → NeoIconButton (primary, size large)
- Línea 2552: Forward 10s button → NeoIconButton
- Línea 2564: "I" Mark In button → NeoButton (con estado activo)
- Línea 2608: "O" Mark Out button → NeoButton (con estado activo)

**Código actual**:
```tsx
<button style={iconBtn} ...>
```

**Código objetivo**:
```tsx
<NeoIconButton variant="standard" size="medium" ...>
```

#### 1.2 Header Section (3-4 horas)
**Archivo**: `VideoEditor.tsx` líneas 1153-1214

Elementos:
- Logo badge con gradiente → NeoCard variante
- Close/Help buttons → Ya convertidos a NeoIconButton ✅
- Title section → Aplicar neoBrutalism.typography

#### 1.3 Help Modal (2-3 horas)
**Archivo**: `VideoEditor.tsx` líneas 1217-1287

**Actual**: Modal custom con backdrop manual
**Objetivo**: Usar NeoDialog completo

```tsx
<NeoDialog
  open={showHelp}
  onClose={() => setShowHelp(false)}
  title="Atajos de Teclado"
  maxWidth="md"
>
  {/* Contenido del modal */}
</NeoDialog>
```

#### 1.4 Upload Screen (4-5 horas)
**Archivo**: `VideoEditor.tsx` líneas 1293-1362

Elementos a convertir:
- Container card → NeoCard variant="elevated"
- Upload button → Ya convertido ✅
- Info cards → NeoCard variant="filled"

#### 1.5 Left Sidebar - Tools Panel (6-8 horas)
**Archivo**: `VideoEditor.tsx` líneas 1372-1582

Estructura:
- Toggle button (línea 1383) → NeoIconButton
- Feature buttons (8 botones, líneas 1400-1520):
  - Crop → NeoButton icon + label
  - Blur Faces → NeoButton icon + label
  - Watermark → NeoButton icon + label
  - Trim Silence → NeoButton icon + label
  - Speed → NeoButton icon + label
  - Volume → NeoButton icon + label
  - Rotate → NeoButton icon + label
  - Filters → NeoButton icon + label
- Stats cards (líneas 1522-1580) → NeoCard variant="filled"

#### 1.6 Right Sidebar - Clip List (8-12 horas)
**Archivo**: `VideoEditor.tsx` líneas 1876-2158

Elementos más complejos:
- Sidebar toggle → NeoIconButton
- Clip cards individuales (líneas 2006-2136):
  - Card container → NeoCard variant="elevated" elevation={1}
  - Checkbox → Crear NeoCheckbox component
  - Delete button → NeoIconButton variant="standard" color="error"
  - Time badge → NeoCard compact o styled span

**Ejemplo conversión**:
```tsx
// ANTES
<div style={{
  background: colors.card,
  padding: '16px',
  borderRadius: '12px',
  border: `2px solid ${segment.selected ? colors.primary : colors.border}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
}}>

// DESPUÉS
<NeoCard
  variant="elevated"
  elevation={segment.selected ? 2 : 1}
  style={{
    border: segment.selected
      ? `2px solid ${neoBrutalism.colors.primary}`
      : undefined
  }}
>
```

#### 1.7 Export Section (6-8 horas)
**Archivo**: `VideoEditor.tsx` líneas 2167-2400

Elementos:
- Header con stats → NeoCard variant="filled"
- Format toggle buttons (MP4/WEBM) → NeoButton variant="tonal"
- Effect badges → Custom styled chips (considerar crear NeoChip)
- Preview button → NeoButton variant="outlined"
- Export button → NeoButton variant="filled" color="primary" size="large"

#### 1.8 Toast Notifications (2-3 horas)
**Archivo**: `VideoEditor.tsx` líneas 2800-2900

Convertir toasts custom a:
- Success → NeoCard con successContainer background
- Error → NeoCard con errorContainer background
- Warning → NeoCard con warningContainer background
- Info → NeoCard con infoContainer background

### FASE 2: Componentes Faltantes (10-15 horas)

#### 2.1 NeoSelect (3-4 horas)
Dropdown/Select component MD3 compliant

**Features**:
- Variantes: filled, outlined
- Estados: default, hover, focus, disabled
- Label flotante
- Helper text y error states
- Icon prefix/suffix support

#### 2.2 NeoCheckbox (2-3 horas)
Checkbox MD3 con estados y animaciones

**Features**:
- Estados: unchecked, checked, indeterminate
- Ripple effect en click
- Label opcional
- Error state

#### 2.3 NeoSlider (3-4 horas)
Range slider MD3 para volumen, opacity, etc.

**Features**:
- Track con primary color
- Thumb con elevation
- Labels (start, end, current value)
- Disabled state

#### 2.4 NeoChip (1-2 horas)
Badge/Tag component para labels

**Features**:
- Variantes: filled, outlined
- Optional close button
- Icon support

#### 2.5 NeoTooltip (1-2 horas)
Tooltip MD3 para hover hints

**Features**:
- Posicionamiento (top, bottom, left, right)
- Animación fade in/out
- Arrow opcional

### FASE 3: Componentes Legacy CSS Modules (60-80 horas)

#### Alta Prioridad (20-25 horas)
1. **Button.tsx** + Button.module.css (3-4h)
   - Reemplazar completamente con NeoButton wrapper
   - Migrar todas las variantes

2. **TextInput.tsx** (2h)
   - Reemplazar con NeoInput

3. **Select.tsx** + Select.module.css (3h)
   - Esperar a NeoSelect, luego migrar

4. **Dialog.tsx** + Dialog.module.css (4-5h)
   - Verificar que todos usen NeoDialog
   - Migrar estilos restantes

5. **Settings.tsx** + Settings.module.css (8-10h)
   - COMPLEJO: Muchos controles custom
   - Requiere NeoSelect, NeoCheckbox

#### Prioridad Media (25-30 horas)
6. **ExportSheet.tsx** + ExportSheet.module.css (4-5h)
7. **ConcatDialog.tsx** (3-4h)
8. **KeyboardShortcuts.tsx** (2-3h)
9. **ValueTuner.tsx** (2h)
10. **ExportButton.tsx** (1-2h)
11. **CropSelector.tsx** - Completar migración (4-5h)
12. **BlurRegionSelector.tsx** - Completar migración (4-5h)
13. **WatermarkSettings.tsx** - Completar migración (2-3h)
14. **MultiClipTimeline.tsx** (4-5h)
15. **MultiSourceEditor.tsx** (3-4h)

#### Prioridad Baja (15-25 horas)
Componentes utility y menos usados:
- AlertDialog, ExportConfirm, WhatsNew
- CloseButton, Checkbox, Dropdown Menu
- VolumeControl, BatchFile, FileNameTemplateEditor
- TagEditor, ErrorDialog, etc. (38 componentes)

### FASE 4: Testing & QA (30-35 horas)

#### 4.1 Pruebas Funcionales (15-18h)
- Flujo completo de edición de video
- Todos los modales y diálogos
- Controles de timeline
- Export workflow
- Crop, blur, watermark features
- Keyboard shortcuts

#### 4.2 Pruebas Visuales (8-10h)
- Verificar colores MD3 en todos los estados
- Hover, focus, active states
- Elevations correctas
- Animaciones suaves
- Spacing consistente

#### 4.3 Responsive Testing (4-5h)
- Mobile layout
- Tablet layout
- Desktop (varios tamaños)
- Touch interactions

#### 4.4 Performance (3-4h)
- Bundle size optimization
- Lazy loading components
- Memoization donde sea necesario
- Lighthouse audit

## 🎯 Quick Wins - Próximos Pasos Inmediatos

### Sesión 1: Timeline Controls (2-3 horas)
Reemplazar los 5 botones principales del timeline:
- Lines 2534, 2543, 2552: Botones de playback
- Lines 2564, 2608: Botones I/O

### Sesión 2: Help Modal (1-2 horas)
Convertir completamente a NeoDialog

### Sesión 3: Left Sidebar Feature Buttons (3-4 horas)
Convertir los 8 botones de features a NeoButton

### Sesión 4: Right Sidebar Clip Cards (4-5 horas)
Crear NeoCheckbox primero, luego migrar cards

## 📈 Métricas de Progreso

### Código Reducido
- DownloadModal: 862 → 502 líneas (-42%)
- **Objetivo total**: Reducir 20-30% del código custom inline

### Componentes
- Creados: 6/11 componentes MD3 base (55%)
- Migrados: 1/46 archivos legacy (2%)

### Tiempo Estimado Total
- **Total**: 140-180 horas (4-5 semanas full-time)
- **Completado**: ~15 horas (10%)
- **Restante**: ~165 horas (90%)

## 🚀 Estrategia Recomendada

### Enfoque Incremental
1. **Sprint 1** (Esta semana): Quick wins en VideoEditor.tsx
   - Timeline controls
   - Help modal
   - Upload screen

2. **Sprint 2** (Próxima semana): Sidebars
   - Left sidebar tools
   - Right sidebar clips
   - Crear NeoCheckbox

3. **Sprint 3**: Componentes faltantes
   - NeoSelect
   - NeoSlider
   - NeoChip

4. **Sprint 4+**: Legacy components migration
   - Por prioridad
   - 3-5 componentes por sprint

### Criterios de Aceptación por Sprint
- ✅ Build exitoso sin errores TypeScript
- ✅ Todas las features funcionales
- ✅ Visual QA passed (colores, spacing, elevation)
- ✅ No regressions en funcionalidad existente
- ✅ Bundle size no aumenta >5%

## 📝 Notas de Implementación

### Anti-Patterns a Evitar
❌ NO usar colores hardcoded (#RRGGBB)
❌ NO crear estilos inline complejos
❌ NO usar var(--old-css-variables)
❌ NO usar gradientes (solid colors only en MD3 Expressive)
❌ NO inventar propios shadows/elevations

### Patterns a Seguir
✅ Usar neoBrutalism.colors.* para TODOS los colores
✅ Usar neoBrutalism.elevation.level* para shadows
✅ Usar neoBrutalism.shape.* para border radius
✅ Usar neoBrutalism.typography.* para font styles
✅ Usar neoBrutalism.spacing.* para margins/padding
✅ Preferir componentes Neo* sobre styling manual

### Code Review Checklist
Antes de cada commit:
- [ ] No hay colores hardcoded
- [ ] No hay estilos inline > 3 propiedades (extraer a component)
- [ ] Todos los botones usan NeoButton o NeoIconButton
- [ ] Todas las cards usan NeoCard
- [ ] Todos los modales usan NeoDialog
- [ ] TypeScript sin errores
- [ ] ESLint sin warnings críticos
- [ ] Build exitoso
- [ ] Feature funciona en móvil y desktop

## 🎨 Paleta de Colores MD3 Reference

```typescript
// Primary - Electric Blue
primary: '#0066FF'
onPrimary: '#FFFFFF'
primaryContainer: '#D4E3FF'

// Secondary - Vivid Purple
secondary: '#7B3FF2'
onSecondary: '#FFFFFF'
secondaryContainer: '#EADDFF'

// Tertiary - Energetic Cyan
tertiary: '#00BCD4'
onTertiary: '#FFFFFF'
tertiaryContainer: '#B3E5FC'

// Surfaces - Dark Theme
background: '#0A0A0F'
surface: '#121218'
surfaceContainerLowest: '#0A0A0F'
surfaceContainerLow: '#16161D'
surfaceContainer: '#1A1A22'
surfaceContainerHigh: '#1E1E28'
surfaceContainerHighest: '#24242F'

// Text - Dark Optimized
text.primary: '#FFFFFF'
text.secondary: '#B8B8C0'
text.tertiary: '#8C8C98'

// Semantic
success: '#00E676'
error: '#FF3B30'
warning: '#FFB300'
info: '#00B8D4'
```

---

**Última actualización**: Febrero 2, 2026
**Próxima revisión**: Después de completar Fase 1.1 (Timeline Controls)
