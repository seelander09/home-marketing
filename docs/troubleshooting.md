# Troubleshooting Guide

Common issues and solutions for the SmartLead Marketing platform.

## Table of Contents

- [Build Issues](#build-issues)
- [Runtime Errors](#runtime-errors)
- [API Issues](#api-issues)
- [Form Submission Issues](#form-submission-issues)
- [Performance Issues](#performance-issues)
- [CMS/Content Issues](#cmscontent-issues)
- [Analytics Issues](#analytics-issues)
- [Deployment Issues](#deployment-issues)

## Build Issues

### Build Fails with Type Errors

**Symptoms**: Build fails with TypeScript errors

**Solutions**:
1. Run `npm run type-check` locally to identify errors
2. Ensure all dependencies are installed: `npm ci`
3. Clear Next.js cache: `rm -rf .next`
4. Check for missing type definitions: `npm install --save-dev @types/[package]`

### Build Fails with Module Not Found

**Symptoms**: Build fails with "Cannot find module" errors

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Check that all imports use correct paths
4. Verify `tsconfig.json` paths are correct

### Build Succeeds but Pages Return 404

**Symptoms**: Build completes but routes don't work

**Solutions**:
1. Check that pages are in correct directories (`app/` for App Router)
2. Verify `next.config.js` doesn't have incorrect rewrites
3. Ensure page components have default exports
4. Check for case sensitivity in file names

## Runtime Errors

### "Cannot read property of undefined"

**Symptoms**: Runtime errors accessing nested properties

**Solutions**:
1. Check that CMS data structure matches expected format
2. Verify mock data fallback is working
3. Add optional chaining (`?.`) for potentially undefined values
4. Check error tracking for specific component/route errors

### Hydration Mismatch Errors

**Symptoms**: React hydration warnings in console

**Solutions**:
1. Ensure server and client render the same content
2. Avoid using `window` or browser APIs during SSR
3. Use `useEffect` for client-only logic
4. Check for Date/time formatting differences

### Map Components Not Rendering

**Symptoms**: Maps show blank or fail to load

**Solutions**:
1. Verify Leaflet CSS is imported
2. Check that map container has explicit height
3. Ensure Leaflet is only loaded client-side (`"use client"`)
4. Verify map tiles are loading (check network tab)

## API Issues

### API Returns 429 (Rate Limit)

**Symptoms**: API endpoints return rate limit errors

**Solutions**:
1. Check rate limit configuration in `lib/middleware/rate-limit.ts`
2. Wait for rate limit window to reset
3. Review rate limit headers for reset time
4. Consider implementing request queuing for batch operations

### API Returns 500 (Internal Server Error)

**Symptoms**: API endpoints fail with 500 errors

**Solutions**:
1. Check error tracking (Sentry) for detailed error logs
2. Verify environment variables are set correctly
3. Check API route logs for stack traces
4. Verify external API connections (Census, FRED, HUD)

### Market Data API Returns Empty

**Symptoms**: Market data endpoints return no data

**Solutions**:
1. Verify cache files exist in `census-data/cache/`, `fred-data/cache/`, etc.
2. Run cache build scripts: `npm run build-all-caches`
3. Check API keys are valid: `npm run market:validate`
4. Verify data files are in expected format

## Form Submission Issues

### Forms Don't Submit

**Symptoms**: Form submission fails or hangs

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify reCAPTCHA is configured (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`)
3. Check network tab for failed requests
4. Verify API route is accessible: `/api/forms/demo` or `/api/forms/download`

### reCAPTCHA Errors

**Symptoms**: reCAPTCHA verification fails

**Solutions**:
1. Verify `RECAPTCHA_SECRET` is set correctly
2. Check reCAPTCHA site key matches secret key
3. Ensure domain is added to reCAPTCHA allowed domains
4. Test with mock token in development

### CRM Webhook Not Receiving Data

**Symptoms**: Forms submit but CRM doesn't receive data

**Solutions**:
1. Verify `CRM_WEBHOOK_URL` is set and correct
2. Check webhook logs in error tracking
3. Test webhook URL directly with a test payload
4. Verify webhook endpoint accepts POST requests with JSON

## Performance Issues

### Slow Page Loads

**Symptoms**: Pages take > 5 seconds to load

**Solutions**:
1. Run Lighthouse audit to identify bottlenecks
2. Check for large bundle sizes: `npm run build` and review output
3. Verify images are optimized (Next.js Image component)
4. Check for blocking API calls during SSR
5. Review ISR cache configuration

### Maps Lag or Freeze

**Symptoms**: Map interactions are slow or unresponsive

**Solutions**:
1. Reduce number of markers/clusters on map
2. Enable marker clustering for large datasets
3. Use heatmap view for density visualization
4. Implement virtual scrolling for property lists
5. Check for memory leaks in map components

### API Calls Timeout

**Symptoms**: API requests timeout or take too long

**Solutions**:
1. Verify external APIs are accessible and responding
2. Check cache files are being used
3. Implement request timeout handlers
4. Consider async processing for heavy operations
5. Review rate limiting configuration

## CMS/Content Issues

### Content Not Loading from CMS

**Symptoms**: Pages show empty content or fall back to mock data

**Solutions**:
1. Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` is set
2. Check Sanity project is accessible
3. Verify dataset name matches (`NEXT_PUBLIC_SANITY_DATASET`)
4. Check GROQ queries in `cms/queries.ts`
5. Verify mock data fallback is working

### Images Not Displaying

**Symptoms**: CMS images fail to load

**Solutions**:
1. Check Sanity image URLs are correct
2. Verify `@sanity/image-url` configuration
3. Check Next.js image domain configuration in `next.config.js`
4. Verify image assets exist in Sanity

### Content Updates Not Reflecting

**Symptoms**: CMS changes don't appear on site

**Solutions**:
1. Check ISR revalidation settings
2. Trigger manual revalidation if needed
3. Verify content is published (not draft) in Sanity
4. Clear Next.js cache: `rm -rf .next`

## Analytics Issues

### Analytics Not Tracking

**Symptoms**: Events not appearing in Google Analytics

**Solutions**:
1. Verify `NEXT_PUBLIC_GTM_ID` is set
2. Check cookie consent was granted
3. Verify GTM container is published
4. Check browser console for GTM errors
5. Test with GTM Preview mode

### Error Tracking Not Working

**Symptoms**: Errors not appearing in Sentry

**Solutions**:
1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Check Sentry project is active
3. Test error tracking with a test error
4. Verify Sentry client is initialized

## Deployment Issues

### Build Fails in CI/CD

**Symptoms**: GitHub Actions or deployment platform build fails

**Solutions**:
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Check Node.js version matches `.nvmrc` or `package.json` engines
4. Verify environment variables are set in CI/CD platform
5. Check for platform-specific build requirements

### Preview Deployments Not Working

**Symptoms**: Preview deployments fail or show errors

**Solutions**:
1. Verify preview environment variables are set
2. Check for hardcoded production URLs
3. Verify API routes work in preview environment
4. Check for CORS issues with preview domains

### Environment Variables Not Available

**Symptoms**: Application can't access environment variables

**Solutions**:
1. Verify variables are prefixed with `NEXT_PUBLIC_` for client-side
2. Check deployment platform environment variable settings
3. Ensure variables are set before build runs
4. Restart application after setting new variables

## Getting Help

If issues persist:

1. **Check Error Tracking**: Review Sentry or error logs for detailed stack traces
2. **Review Logs**: Check application logs for relevant error messages
3. **Test Locally**: Reproduce issue in local development environment
4. **Check Documentation**: Review relevant documentation files in `docs/`
5. **Contact Support**: Reach out to development team with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Relevant logs

## Diagnostic Commands

```bash
# Check environment variables
npm run env:check

# Validate data sources
npm run market:validate

# Run health check
curl http://localhost:3000/api/health

# Check build
npm run build

# Run tests
npm run test
npm run test:e2e

# Type check
npm run type-check

# Lint
npm run lint
```

