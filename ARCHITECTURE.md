# High-Level Design Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         App.jsx (Router)                             │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────┬──────────────────────────────────────┐ │  │
│  │  │   Sidebar Component     │  TemplateGallery Component          │ │  │
│  │  │                         │                                      │ │  │
│  │  │ • Categories (from API) │  • Displays Templates               │ │  │
│  │  │ • Layouts (from API)    │  • Shows Hero Banner                │ │  │
│  │  │ • Field Types (from API)│  • Dynamic based on Filters         │ │  │
│  │  │ • Field Counts (from API)                                     │ │  │
│  │  │ • Search                │                                      │ │  │
│  │  │ • Recent/Favorites      │                                      │ │  │
│  │  └─────────────────────────┴──────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │          useMarketplace Hook (State Management)                      │  │
│  │                                                                      │  │
│  │  State:                           Actions:                          │  │
│  │  • templates[]                    • loadMarketplace()               │  │
│  │  • filterOptions{}    ◄──────────  • loadFilterOptions() [NEW]      │  │
│  │  • filters{}                      • setFilters()                    │  │
│  │  • recent[]                       • bootstrap()                     │  │
│  │  • favorites[]                                                      │  │
│  │  • availableTypes[]                                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    API Calls via apiFetch()
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
   GET /api/                GET /api/templates/      GET /api/filter-options/
   templates/               (with query params)            [NEW]
                                                          
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Django REST)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     API Controllers (views.py)                      │  │
│  │                                                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │  │
│  │  │ TemplateListView │  │ TemplateDetail   │  │FilterOptionsView│ │  │
│  │  │                  │  │      View        │  │     [NEW]      │  │  │
│  │  │ Filters:         │  │                  │  │                │  │  │
│  │  │ • category       │  │ • Returns full   │  │ Returns:       │  │  │
│  │  │ • type           │  │   schema         │  │ {              │  │  │
│  │  │ • layout         │  │ • Premium check  │  │   category: [], │  │  │
│  │  │ • field_type     │  │                  │  │   layout: [],  │  │  │
│  │  │ • has_required   │  │                  │  │   field_type:[]│  │  │
│  │  │ • field_count    │  │                  │  │   field_count[]│  │  │
│  │  │ • search         │  │                  │  │ }              │  │  │
│  │  │                  │  │                  │  │                │  │  │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │
│                   Database Queries & Serialization
│                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      Models (Django ORM)                            │  │
│  │                                                                     │  │
│  │  Template              FilterOption [NEW]        User              │  │
│  │  ├─ id                 ├─ filter_type           ├─ id             │  │
│  │  ├─ name               │  (category, layout,    ├─ username       │  │
│  │  ├─ category           │   field_type,          ├─ email          │  │
│  │  ├─ template_type      │   field_count)         ├─ is_premium     │  │
│  │  ├─ description        ├─ value                 ├─ favorite_temp  │  │
│  │  ├─ schema (JSON)      ├─ label                 └─ created_at     │  │
│  │  ├─ is_premium         ├─ order                                    │  │
│  │  └─ created_at         └─ created_at                              │  │
│  │                                                                     │  │
│  │  FormSubmission        RecentlyUsedTemplate                       │  │
│  │  ├─ id                 ├─ user_id                                 │  │
│  │  ├─ template_id        ├─ template_id                             │  │
│  │  ├─ user_id            ├─ used_at                                 │  │
│  │  ├─ form_data (JSON)   └─ unique(user, template)                  │  │
│  │  └─ created_at                                                     │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   SQLite Database     │
                        │                       │
                        │ • Templates           │
                        │ • FilterOptions [NEW] │
                        │ • Users               │
                        │ • FormSubmissions     │
                        │ • RecentlyUsedTemplat│
                        └───────────────────────┘
```

## Data Flow: Filter Options (NEW)

```
Frontend Initialization:
────────────────────────

1. App loads → bootstrap()
   ├─ loadMarketplace()
   └─ loadFilterOptions() [NEW]
      └─ GET /api/filter-options/
         └─ Backend returns grouped filter options
            └─ setFilterOptions(data)

2. Sidebar renders with filterOptions props
   ├─ Categories from filterOptions.category
   ├─ Layouts from filterOptions.layout
   ├─ Field Types from filterOptions.field_type
   └─ Field Counts from filterOptions.field_count

User Interaction:
─────────────────

1. User selects a filter
   ├─ Sidebar calls onCategoryChange/onLayoutChange/etc.
   └─ App updates filters state
      └─ loadMarketplace(newFilters)
         └─ GET /api/templates/?category=basic&layout=single-column...
            └─ Backend filters templates
               └─ Returns filtered templates
                  └─ setTemplates(data)

2. TemplateGallery re-renders with new templates
```

## API Endpoints (After Changes)

```
GET /api/filter-options/          [NEW]
  ├─ No auth required
  ├─ Returns: {
  │     category: [
  │       { value: "", label: "All" },
  │       { value: "basic", label: "Free" },
  │       { value: "premium", label: "Premium" }
  │     ],
  │     layout: [
  │       { value: "", label: "All" },
  │       { value: "single-column", label: "Single column" },
  │       { value: "two-column", label: "Two column" },
  │       { value: "multi-step", label: "Multi-step" }
  │     ],
  │     field_type: [
  │       { value: "", label: "Any" },
  │       { value: "text", label: "Text" },
  │       ... (8 total)
  │     ],
  │     field_count: [
  │       { value: "", label: "Any" },
  │       { value: "small", label: "Small (≤ 3)" },
  │       { value: "medium", label: "Medium (4–6)" },
  │       { value: "large", label: "Large (7+)" }
  │     ]
  │   }
  │
  ├─ Seeding: Happens in ensure_seed_data() 
  │   when FilterOption.objects.is_empty()
  │

GET /api/templates/
  ├─ Query Params:
  │  ├─ category=basic|premium
  │  ├─ type=<string>
  │  ├─ layout=single-column|two-column|multi-step
  │  ├─ field_type=text|email|password|textarea|dropdown|date|checkbox
  │  ├─ has_required=true
  │  ├─ field_count=small|medium|large
  │  └─ search=<string>
  │
  └─ Returns: { templates[], recently_used[], favorites[], available_types[] }

... (other existing endpoints unchanged)
```

## Key Changes Made

### Backend
- ✅ Created `FilterOption` model with fields: filter_type, value, label, order
- ✅ Added migration `0004_filteroption.py`
- ✅ Updated `seed_filter_options()` in template_catalog.py
- ✅ Updated `ensure_seed_data()` to seed filter options
- ✅ Added `FilterOptionsView` API endpoint
- ✅ Added `FilterOptionSerializer`
- ✅ Updated urls.py with new route

### Frontend
- ✅ Added `filterOptions` state to useMarketplace hook
- ✅ Created `loadFilterOptions()` function
- ✅ Updated `bootstrap()` to load filter options on app init
- ✅ Updated Sidebar to accept `filterOptions` prop
- ✅ Removed hardcoded filter arrays from Sidebar
- ✅ Updated App.jsx to pass `filterOptions` to Sidebar

## Benefits

1. **Maintainability**: Filter options are now in the database, not hardcoded
2. **Scalability**: Easy to add new filters or options without code changes
3. **API-First**: Frontend can be updated independently from backend
4. **Admin Support**: Future admin panel can manage filter options
5. **Consistency**: Single source of truth in the database
