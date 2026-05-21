import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { catalogApi } from "api/client";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { SectionHeader } from "components/ui/SectionHeader";
import { SkeletonLoader } from "components/ui/SkeletonLoader";
import { usePageMeta } from "../hooks/usePageMeta";
import { getApiErrorMessage } from "../utils/api";

function renderParagraphs(copy?: string) {
  if (!copy?.trim()) {
    return null;
  }

  return copy
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph.slice(0, 24)}-${index}`} className="text-sm leading-7 text-[var(--vr-muted)]">
        {paragraph}
      </p>
    ));
}

export function InfoPage() {
  const { slug = "about" } = useParams();
  const pageQuery = useQuery({
    queryKey: ["content-page", slug],
    queryFn: () => catalogApi.getContentPage(slug)
  });
  const seoQuery = useQuery({
    queryKey: ["seo-setting", "CMS_PAGE", slug],
    queryFn: () => catalogApi.getSeoSetting({ targetType: "CMS_PAGE", targetSlug: slug })
  });

  const page = pageQuery.data;
  const seoSetting = seoQuery.data;

  usePageMeta({
    title: seoSetting?.pageTitle ?? page?.metaTitle ?? page?.heroTitle ?? page?.title,
    description: seoSetting?.metaDescription ?? page?.metaDescription ?? page?.heroDescription,
    keywords: seoSetting?.metaKeywords,
    image: seoSetting?.ogImageUrl,
    canonicalUrl: seoSetting?.canonicalUrl,
    noIndex: seoSetting?.noIndex
  });

  if (pageQuery.isLoading) {
    return (
      <div className="vr-page-shell space-y-6">
        <SkeletonLoader className="h-[280px]" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonLoader key={index} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  if (pageQuery.error || !page) {
    return (
      <div className="vr-page-shell">
        <EmptyState
          title="Page unavailable"
          description={getApiErrorMessage(pageQuery.error, "This page could not be loaded from the content service.")}
          action={<Link to="/" className="button-primary">Back to homepage</Link>}
        />
      </div>
    );
  }

  return (
    <div className="vr-page-shell space-y-6">
      <Card variant="hero" className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <SectionHeader
            eyebrow={page.eyebrow ?? page.title}
            title={page.heroTitle ?? page.title}
            description={page.heroDescription ?? page.metaDescription ?? ""}
          />
          <div className="rounded-[1.6rem] border border-[var(--vr-border)] bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.07)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="mt-4 space-y-4">{renderParagraphs(page.body)}</div>
            <Link to="/contact" className="mt-5 inline-flex rounded-2xl bg-[var(--vr-primary)] px-5 py-3 text-sm font-semibold text-white">
              Contact support
            </Link>
          </div>
        </div>
      </Card>

      {page.sections.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-3">
          {page.sections.map((section, index) => (
            <Card key={`${section.title ?? "section"}-${index}`} className="h-full">
              {section.title ? <h2 className="text-xl font-bold text-[var(--vr-text)]">{section.title}</h2> : null}
              <div className="mt-3 space-y-4">{renderParagraphs(section.content)}</div>
            </Card>
          ))}
        </section>
      ) : null}

      {page.faqItems.length > 0 ? (
        <section className="grid gap-3">
          {page.faqItems.map((item, index) => (
            <Card key={`${item.question ?? "faq"}-${index}`}>
              {item.question ? <h2 className="text-lg font-bold text-[var(--vr-text)]">{item.question}</h2> : null}
              <div className="mt-2 space-y-3">{renderParagraphs(item.answer)}</div>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
