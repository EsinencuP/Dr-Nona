import marketJson from "./data/market.json";

export type MarketPhone = {
  label: string;
  href: string;
};

export type MoldovaCertificate = {
  id: string;
  title: string;
  issuer: string;
  country: "Молдова";
  products: string[];
  validFrom: string;
  validUntil: string;
  documentUrl: string;
  sourceUrl: string;
  publicationStatus: "approved";
};

export type MarketData = {
  market: "Moldova";
  contact: {
    kind: "official-branch-listing";
    country: "Молдова";
    city: string;
    address: string;
    phones: MarketPhone[];
    sourceUrl: string;
    sourceCheckedAt: string;
    legalEntity: string | null;
    email: string | null;
    telegram: string | null;
  };
  internationalSupport: {
    email: string;
    sourceUrl: string;
  };
  moldovaCertificates: MoldovaCertificate[];
  certificatePolicy: {
    requiredFields: string[];
    internationalArchiveUrl: string;
    foreignDocumentsVisible: false;
  };
};

export const marketData = marketJson as MarketData;
