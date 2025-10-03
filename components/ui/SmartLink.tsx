import Link from 'next/link'
import type { Route } from 'next'
import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from 'react'

type InternalLinkProps = ComponentPropsWithoutRef<typeof Link>

type SmartLinkProps = {
  href: Route | string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  Omit<InternalLinkProps, 'href' | 'legacyBehavior' | 'as'>

function isInternalRoute(href: string): href is Route {
  return href.startsWith('/')
}

export function SmartLink({
  href,
  children,
  prefetch,
  replace,
  scroll,
  shallow,
  passHref,
  locale,
  target,
  rel,
  ...rest
}: SmartLinkProps) {
  if (typeof href === 'string' && isInternalRoute(href)) {
    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        passHref={passHref}
        locale={locale}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  const externalHref = typeof href === 'string' ? href : String(href)
  const externalTarget = target ?? '_blank'
  const externalRel = rel ?? 'noopener noreferrer'

  return (
    <a href={externalHref} target={externalTarget} rel={externalRel} {...rest}>
      {children}
    </a>
  )
}
