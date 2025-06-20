# Debug Test - Enhanced Features + Tooltips

## Test Cases for Hidden Hyperlinks

### Basic Examples
Simple test: ::hello world|click me::

Another test: ::test payload|display text::

Multi-word payload: ::this is a longer secret message|short text::

URL test: ::https://example.com|link::

Email test: ::user@example.com|email::

Long payload test: ::This is a very long hidden payload that should appear in a nicely styled tooltip when you hover over the display text|hover test::

### Selection Test Cases
Try selecting across these: ::secret1|text1:: and ::secret2|text2:: and normal text.

Partial selection: Start selecting from middle of ::partial selection test|this text:: and extend.

## Testing Instructions

### 🔍 **Reading Mode Tests:**
1. **Click Test**: Click any underlined text → Should copy hidden payload
2. **Visual Test**: All hidden links should be underlined with normal link color
3. **🆕 Hover Test**: Hover over any hidden link → Should show custom tooltip with hidden payload

### ✏️ **Editing Mode Tests:**

#### **Cursor Behavior:**
1. **Cursor Away**: Place cursor away from hidden link → Should see only display text (purple/underlined)
2. **Cursor On**: Place cursor anywhere within `::payload|display::` → Should see full raw syntax (purple/underlined)
3. **Click Test**: Click on either collapsed or expanded state → Should copy payload
4. **🆕 Hover Test (Collapsed)**: Hover over collapsed display text → Should show tooltip with hidden payload
5. **🆕 Hover Test (Expanded)**: Hover over expanded raw syntax → Should show tooltip with hidden payload

#### **Selection Expansion:**
1. **Partial Selection**: Try selecting part of a hidden link → Should auto-expand to include full syntax
2. **Multiple Links**: Select across multiple hidden links → Should expand to include all overlapping links
3. **Mixed Content**: Select text that includes both hidden links and normal text → Should expand only the hidden link portions

#### **Visual Styling:**
- **Collapsed state** (cursor away): Should look like accent-colored clickable text
- **Expanded state** (cursor on): Should show full syntax with accent color and underline
- **Both states** should remain clickable and copy to clipboard
- **🆕 Tooltips**: Should appear above the text with rounded corners and subtle shadow

### 🧪 **Advanced Tests:**
1. **Double-click**: Double-click on hidden link → Should select entire hidden link syntax
2. **Editing**: Place cursor in expanded syntax and try editing the delimiters/content
3. **Settings**: Change delimiters in settings → Should work immediately without restart
4. **🆕 Tooltip Performance**: Hover quickly over multiple hidden links → Tooltips should appear/disappear smoothly

### ✅ **Expected Results:**
- **No raw syntax visible** when cursor is away from hidden links
- **Purple/accent colored styling** in both collapsed and expanded states  
- **Automatic selection expansion** when selecting across hidden links
- **Consistent click-to-copy** behavior in all states
- **🆕 Smooth hover tooltips** showing hidden payload in all states
- **🆕 Custom styled tooltips** that match Obsidian's design language
- **Seamless editing experience** like native Obsidian links

### 🚨 **If Something's Not Working:**
1. **Reload plugin**: Settings → Community Plugins → Toggle off/on
2. **Check console**: Open Developer Tools (Cmd/Ctrl+Shift+I) for errors
3. **Test in different modes**: Try both reading and editing modes
4. **🆕 Tooltip issues**: Check if tooltips appear on hover and disappear when mouse leaves

---

**This implementation now includes beautiful hover tooltips that enhance the user experience!** 🎉✨ 