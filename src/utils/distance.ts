import { Client } from "@googlemaps/google-maps-services-js";
import { IDistanceResult } from "../model";

interface IDistanceCalculatorOption {
  apiKey: string;
}

export class DistanceCalculator {
  private client: Client;
  private apiKey: string;
  constructor({ apiKey }: IDistanceCalculatorOption) {
    this.apiKey = apiKey;
    this.client = new Client({ });
  }

  async simpleDistance({ fromAddr, toAddrs }: { fromAddr: string, toAddrs: string[] }): Promise<IDistanceResult> {
    try {
      const result = await this.client.distancematrix({
        params: {
          key: this.apiKey,
          origins: [fromAddr],
          destinations: toAddrs
        },
      });
      return result.data;
    } catch (error) {
      throw error;
    }
  }

}
