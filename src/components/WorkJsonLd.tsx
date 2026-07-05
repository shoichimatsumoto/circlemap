import {
  buildWorkBreadcrumbJsonLd,
  buildWorkJsonLd,
} from "@/lib/seo";
import type { Work } from "@/lib/types";

type Props = {
  work: Work;
};

export function WorkJsonLd({ work }: Props) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWorkJsonLd(work)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWorkBreadcrumbJsonLd(work)),
        }}
      />
    </>
  );
}
