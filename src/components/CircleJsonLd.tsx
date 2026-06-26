import { buildCircleJsonLd } from "@/lib/seo";
import type { Circle } from "@/lib/types";

type Props = {
  circle: Circle;
};

export function CircleJsonLd({ circle }: Props) {
  const jsonLd = buildCircleJsonLd(circle);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
