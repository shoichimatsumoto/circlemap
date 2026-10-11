import {
  buildWorkBreadcrumbJsonLd,
  buildWorkJsonLd,
} from "@/lib/seo";
import type { Work } from "@/lib/types";

type Props = {
  work: Work;
  /** A群だけ渡す。未指定なら従来の description のまま */
  description?: string;
};

export function WorkJsonLd({ work, description }: Props) {
  const data = buildWorkJsonLd(work);
  if (description) data.description = description;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data),
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
