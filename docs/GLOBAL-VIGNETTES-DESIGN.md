# Global Vignettes Design

## Overview

Vignettes and modules are now **global** (not institution-specific), meaning they're available to all users regardless of their institution or health system.

## Schema Changes

### Vignettes Table
- `institution_id` is now **nullable** (`UUID | null`)
- When `institution_id IS NULL`: Global vignette (available to all users)
- When `institution_id IS NOT NULL`: Institution-specific vignette (available only to users from that institution)

### Modules Table
- `institution_id` is now **nullable** (`UUID | null`)
- When `institution_id IS NULL`: Global module (available to all users)
- When `institution_id IS NOT NULL`: Institution-specific module

## RLS Policies

### Vignettes Access Policy
Users can access vignettes if:
1. **Global vignette** (`institution_id IS NULL`) - available to everyone
2. **Institution-specific vignette** - user's `institution_id` matches vignette's `institution_id`
3. **Public vignette** (`is_public = true`) - available to everyone

### Vignettes Management Policy
Educators can manage vignettes if:
1. **Global vignette** (`institution_id IS NULL`) - any educator can manage
2. **Institution-specific vignette** - only educators from that institution can manage

## API Changes

### GET /api/vignettes
Now returns:
- All global vignettes (`institution_id IS NULL`)
- Institution-specific vignettes for the user's institution

Query:
```typescript
.or(`institution_id.is.null,institution_id.eq.${user.institution_id}`)
```

## Import Scripts

### MED-001 Import
- MED-001 is imported as a **global vignette** (`institution_id = NULL`)
- Available to all users from all institutions

## TypeScript Types

```typescript
export interface Vignette {
  id: string;
  institution_id: string | null; // null = global vignette
  // ... other fields
}
```

## Benefits

1. **Shared Educational Content**: Vignettes can be shared across all institutions
2. **Reduced Duplication**: No need to create the same vignette for each institution
3. **Easier Maintenance**: Update once, available everywhere
4. **Flexibility**: Still supports institution-specific vignettes when needed

## Migration Notes

If you have existing vignettes with `institution_id` set:
- They will continue to work as institution-specific
- To make them global, set `institution_id = NULL`
- Global vignettes are visible to all users

## Example Usage

### Creating a Global Vignette
```sql
INSERT INTO public.vignettes (
  institution_id,  -- NULL for global
  title,
  category,
  -- ... other fields
) VALUES (
  NULL,  -- Global vignette
  'My Global Vignette',
  'MED',
  -- ... other values
);
```

### Creating an Institution-Specific Vignette
```sql
INSERT INTO public.vignettes (
  institution_id,
  title,
  category,
  -- ... other fields
) VALUES (
  'institution-uuid-here',  -- Specific institution
  'My Institution Vignette',
  'MED',
  -- ... other values
);
```




