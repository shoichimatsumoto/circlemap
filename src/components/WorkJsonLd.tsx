import { buildWorkJsonLd } from "@/lib/seo";
import type { Work } from "@/lib/types";

type Props = {
  work: Work;
};

export function WorkJsonLd({ work }: Props) {
  const jsonLd = buildWorkJsonLd(work);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
