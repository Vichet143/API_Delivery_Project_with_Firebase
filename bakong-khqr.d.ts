declare module "bakong-khqr" {
  export const khqrData: {
    currency: {
      usd: number;
      khr: number;
    };
  };

  export class IndividualInfo {
    constructor(
      bakongAccountId: string,
      currency: number,
      accountName: string,
      city: string,
      optionalData?: {
        currency?: number;
        amount?: number;
        billNumber?: string;
        storeLabel?: string;
        expirationTimestamp?: number;
      },
    );
  }

  export class BakongKHQR {
    generateIndividual(info: IndividualInfo): {
      data: { qr: string; md5: string } | null;
    };
  }
}
