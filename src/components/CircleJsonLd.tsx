import {
  buildCircleBreadcrumbJsonLd,
  buildCircleJsonLd,
} from "@/lib/seo";
import type { Circle } from "@/lib/types";

type Props = {
  circle: Circle;
};

export function CircleJsonLd({ circle }: Props) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildCircleJsonLd(circle)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildCircleBreadcrumbJsonLd(circle)),
        }}
      />
    </>
  );
}
