export type DmmGenre = { id: number; name: string };
export type DmmNamedId = { id: number; name: string };

export type DmmSearchParams = {
  site?: "FANZA" | "DMM.com";
  service?: string;
  floor?: string;
  hits?: number;
  offset?: number;
  sort?: "rank" | "date" | "review" | "price";
  keyword?: string;
  article?: string;
  article_id?: string;
  gid?: string;
  cid?: string;
};

export type DmmItem = {
  service_code: string;
  service_name: string;
  floor_code: string;
  floor_name: string;
  category_name?: string;
  content_id: string;
  product_id: string;
  title: string;
  URL: string;
  affiliateURL: string;
  imageURL?: {
    large?: string;
    small?: string;
    list?: string;
  };
  sampleImageURL?: {
    sample_l?: { image: string[] };
    sample_s?: { image: string[] };
  };
  prices?: {
    price?: string;
    list_price?: string;
  };
  date?: string;
  iteminfo?: {
    genre?: DmmGenre[];
    series?: DmmNamedId[];
    maker?: DmmNamedId[];
    author?: DmmNamedId[];
    voice_actor?: DmmNamedId[];
  };
};

export type DmmItemListResponse = {
  result: {
    status: number;
    result_count: number;
    total_count: number;
    first_position: number;
    items: DmmItem[];
  };
};
