export const HOME_PAGE_QUERY = `
  *[_type == "homePage"][0]{
    seo {
      title,
      description,
      keywords
    },
    hero {
      eyebrow,
      heading,
      subheading,
      primaryCta,
      secondaryCta,
      video
    },
    metrics[] {
      label,
      value,
      suffix,
      prefix,
      description
    },
    logos[]->url,
    features[] {
      title,
      description,
      icon,
      bullets
    },
    testimonials {
      headline,
      items[] {
        quote,
        author,
        role,
        avatar,
        companyLogo
      }
    },
    guide,
    roiCalculator,
    caseStudies,
    newsletter,
    journey[] {
      title,
      description,
      icon
    },
    territoryMap,
    resources {
      headline,
      items[]->{
        title,
        "slug": slug.current,
        category,
        description,
        image,
        publishDate,
        readingTime
      }
    },
    faqs[] {
      question,
      answer
    }
  }
`

export const PRODUCTS_PAGE_QUERY = `
  *[_type == "productPage"][0]{
    seo,
    overview,
    packages[] {
      name,
      description,
      priceHint,
      features,
      cta
    },
    playbooks[] {
      title,
      description,
      icon
    },
    integrations[]->name,
    testimonials[] {
      quote,
      author,
      role,
      avatar,
      companyLogo
    },
    dashboard
  }
`

export const RESOURCES_PAGE_QUERY = `
  *[_type == "resourcesPage"][0]{
    seo,
    featured->{
      title,
      "slug": slug.current,
      category,
      description,
      image,
      publishDate,
      readingTime
    },
    categories,
    posts[]->{
      title,
      "slug": slug.current,
      category,
      description,
      image,
      publishDate,
      readingTime
    }
  }
`

export const ABOUT_PAGE_QUERY = `
  *[_type == "aboutPage"][0]{
    seo,
    story,
    leadership[] {
      name,
      title,
      bio,
      image
    },
    testimonials[] {
      quote,
      author,
      role,
      avatar,
      companyLogo
    },
    values[] {
      title,
      description,
      icon,
      bullets
    }
  }
`

export const CONTACT_PAGE_QUERY = `
  *[_type == "contactPage"][0]{
    seo,
    hero,
    faqs,
    partnerPortalCta
  }
`

export const GLOBAL_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0]{
    seo,
    navigation[] {
      label,
      href
    },
    footer,
    primaryCta
  }
`

export const RESOURCE_BY_SLUG_QUERY = `
  *[_type == "post" && slug.current == $slug][0]{
    title,
    "slug": slug.current,
    category,
    description,
    image,
    publishDate,
    readingTime,
    body
  }
`
