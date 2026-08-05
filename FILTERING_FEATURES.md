# Filtering Features Documentation

## Overview

The Nosso Cinema webapp includes comprehensive filtering capabilities on both the "Já assistimos" (watched movies) and "Para assistir" (to-watch list) pages to help users discover and manage their movie collections effectively.

## Assistidos (Watched Movies) Page

### Available Filters

#### 1. **Genre Filter** (Multi-select)
- Displays all genres from your watched movies collection
- Select one or more genres to filter by
- Shows movies matching ANY of the selected genres (OR logic)
- Clear button to reset the genre filter

#### 2. **Platform Filter** (Multi-select)
- Dynamically populated from available platforms in your watched movies
- Examples: Netflix, Prime Video, Disney+, etc.
- Select multiple platforms to show movies from those services
- Uses OR logic (Platform A OR Platform B)

#### 3. **Class/Rating Filter** (Multi-select)
- Three predefined rating categories based on average score:
  - ⏳ **Vale cada segundo** (8.0+) - Highly recommended
  - 😐 **Dá pro gasto** (5.0-7.99) - Worth watching
  - 🚫 **Sai dessa!** (<5.0) - Not recommended
- Select one or more classes to filter your collection
- Users can customize these criteria in their profile settings

#### 4. **Text Search**
- Search by movie title, genre, or platform name
- Real-time filtering as you type

### Filter Logic
- All filters combine with **AND** logic
- Movie must match: Selected Genre(s) **AND** Selected Platform(s) **AND** Selected Class(es) **AND** Text Search

---

## Assistir (To-Watch List) Page

### Available Filters

#### 1. **Genre Filter** (Multi-select)
- Shows all available genres from your to-watch list
- Select multiple genres to see movies matching ANY of those genres
- Useful for browsing by preference (e.g., "Show me Comedy OR Action movies")
- Clear button to reset

#### 2. **Platform Filter** (Multi-select)
- Filter by streaming platforms where to-watch movies are available
- Helps you find something to watch on a specific service
- OR logic applies (show movies on Platform A OR Platform B)

### Special Features
- Empty state message when filters result in no matches
- Responsive design optimized for mobile and desktop
- Visual feedback: selected filters are highlighted with the app's accent color

---

## Implementation Details

### Components Used
- `FiltrosGenero.tsx` - Genre filter component
- `FiltroPlataforma.tsx` - Platform filter component
- `FiltroClasse.tsx` - Rating class filter (assistidos only)

### Component Props
All filter components accept:
- `[name]Escolhidos`/`selecionadas` - Array of currently selected values
- `onChange` - Callback function to update selected values

### Filter Logic Implementation
Filters use `.some()` for OR logic within a filter type and `.every()` for AND logic between different filter types:

```typescript
const filtrados = useMemo(() => {
  return filmes.filter((f) => {
    // Check if genre matches any selected genre
    if (generosEscolhidos.length > 0) {
      const generos = f.genero.split(",").map((g) => g.trim().toLowerCase());
      const temGenero = generosEscolhidos.some((g) =>
        generos.includes(g.toLowerCase())
      );
      if (!temGenero) return false;
    }
    // Similar checks for other filters...
    return true;
  });
}, [filmes, busca, generosEscolhidos, plataformasEscolhidas, classesEscolhidas]);
```

---

## User Experience Features

### Visual Feedback
- Selected filters display with the app's accent color
- Unselected filters show as bordered buttons
- Hover states indicate interactivity

### Filter Management
- "Clear" buttons appear when filters are active
- Shows count of active filters next to clear buttons
- Filters persist during the session

### Responsive Design
- Filters adapt to mobile and desktop layouts
- Touch-friendly button sizes on mobile
- Horizontal scrolling for many filter options if needed

---

## Future Enhancements (Optional)

- Filter combination presets (e.g., "Action + Adventure")
- Save favorite filter combinations
- Share filtered views with the other user
- Advanced filters (released year, duration, etc.)
