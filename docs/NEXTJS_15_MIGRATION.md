# Next.js 15 Migration Notes

## Route Handler Parameter Changes

### Breaking Change: Dynamic Route Parameters

In Next.js 15, dynamic route parameters are now wrapped in `Promise` objects and must be awaited.

### Before (Next.js 14)
```typescript
export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  const category = params.category;
  // ...
}
```

### After (Next.js 15)
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  // ...
}
```

## Files Updated

All dynamic route handlers have been updated:

1. ✅ `app/api/catalogue/categories/[category]/route.ts`
2. ✅ `app/api/catalogue/thinkers/[category]/[name]/route.ts`
3. ✅ `app/api/catalogue/thinkers/[category]/[name]/subjects/[subject]/route.ts`

## Pattern to Follow

For any new dynamic routes:

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params at the top of the function
  const { id } = await params;
  
  try {
    // Use the unwrapped parameters
    const result = await loadData(id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Also await params in error handling if needed
    const { id } = await params;
    console.error(`Error for ${id}:`, error);
    return NextResponse.json({ success: false, error: '...' }, { status: 500 });
  }
}
```

## References

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Route Handler API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/route)

## Status

✅ All API routes updated and building successfully

