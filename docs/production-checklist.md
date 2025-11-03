# Production Deployment Checklist

Use this checklist before deploying to production to ensure all critical systems are configured and tested.

## Pre-Deployment

### Environment Variables

- [ ] All required environment variables are set in production environment
- [ ] `.env.example` reflects all available configuration options
- [ ] No secrets committed to repository
- [ ] Environment variable validation passes (`lib/config/env.ts`)

### Required Variables

- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` - Sanity CMS project ID
- [ ] `NEXT_PUBLIC_SANITY_DATASET` - Dataset name (usually "production")
- [ ] `NEXT_PUBLIC_SANITY_API_VERSION` - API version

### Recommended Variables

- [ ] `RECAPTCHA_SECRET` - reCAPTCHA secret key for form protection
- [ ] `CRM_WEBHOOK_URL` - CRM webhook for lead routing
- [ ] `NEXT_PUBLIC_GTM_ID` - Google Tag Manager ID
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- [ ] Data source API keys (Census, FRED, HUD)

## Testing

### Automated Tests

- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### Manual Testing

- [ ] Homepage loads and displays correctly
- [ ] Navigation works on all pages
- [ ] Forms submit successfully (demo request, guide download, Do Not Sell)
- [ ] Territory lookup works
- [ ] Market data API endpoints respond correctly
- [ ] Maps render and are interactive
- [ ] Cookie consent banner displays and saves preferences
- [ ] Analytics tracking works (check GTM)
- [ ] Mobile responsiveness verified

### Performance

- [ ] Lighthouse scores ≥90 for all categories
- [ ] Page load times < 3 seconds
- [ ] Core Web Vitals meet thresholds:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

## Monitoring & Observability

### Error Tracking

- [ ] Sentry (or error tracking) is configured and receiving events
- [ ] Error tracking is tested by triggering a test error
- [ ] Performance monitoring is active
- [ ] Alerts are configured for critical errors

### Health Checks

- [ ] Health check endpoint `/api/health` returns 200
- [ ] Health check verifies:
  - [ ] CMS connection (or mock data fallback)
  - [ ] External API availability
  - [ ] System uptime

### Logging

- [ ] Application logs are configured
- [ ] Error logs are being captured
- [ ] Request logs are being captured (optional, for debugging)

## Security

### API Security

- [ ] Rate limiting is enabled on API routes
- [ ] reCAPTCHA is configured for forms
- [ ] CORS is properly configured
- [ ] No sensitive data in client-side code

### Data Protection

- [ ] GDPR compliance (cookie consent, Do Not Sell form)
- [ ] Privacy policy and terms of service are accessible
- [ ] Data retention policies are documented

## Content & CMS

- [ ] Sanity Studio is deployed and accessible
- [ ] Content editors have access and training
- [ ] Mock data fallback works if CMS is unavailable
- [ ] Images and assets are properly uploaded to CMS

## Infrastructure

### Deployment Platform

- [ ] Vercel/Platform configuration is correct
- [ ] Environment variables are set in platform
- [ ] Build settings are correct
- [ ] Preview deployments are enabled

### Domain & DNS

- [ ] Custom domain is configured
- [ ] SSL certificate is valid
- [ ] DNS records are correct
- [ ] CDN is configured (if applicable)

### Caching

- [ ] ISR (Incremental Static Regeneration) is configured
- [ ] API response caching is working
- [ ] Static asset caching is optimized

## Post-Deployment

### Smoke Tests

- [ ] Visit homepage and verify no console errors
- [ ] Submit a test form and verify it reaches CRM
- [ ] Check error tracking dashboard for any issues
- [ ] Verify analytics events are firing

### Monitoring

- [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- [ ] Configure alerts for:
  - [ ] High error rates (> 1%)
  - [ ] Slow response times (> 5s)
  - [ ] Health check failures
  - [ ] API rate limit violations

### Documentation

- [ ] API documentation is up to date
- [ ] README reflects production setup
- [ ] Troubleshooting guide is accessible
- [ ] Runbook for common issues is available

## Rollback Plan

- [ ] Previous deployment is tagged and can be rolled back
- [ ] Database migrations (if any) are reversible
- [ ] Feature flags are available to disable features
- [ ] Emergency contact list is accessible

## Success Criteria

Before considering deployment complete:

1. ✅ All automated tests pass
2. ✅ Lighthouse scores ≥90
3. ✅ Health check returns healthy
4. ✅ Error tracking is active and working
5. ✅ Critical user flows work end-to-end
6. ✅ No critical security issues
7. ✅ Monitoring and alerts are configured

## Support Contacts

- **Development Team**: [Contact Info]
- **DevOps/Platform**: [Contact Info]
- **Security**: [Contact Info]
- **On-Call**: [Contact Info]

## Additional Notes

- Review this checklist after major updates
- Update checklist as new requirements are identified
- Document any deviations or exceptions

