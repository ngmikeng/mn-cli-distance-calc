import { Readable } from "stream";
import { IDataRow } from "../model";

interface IVirtualDataStreamOption {
  chunkData: IDataRow[][],
  delayInMilliseconds?: number
}

export class VirtualDataStream extends Readable {
  private chunkData: IDataRow[][] = [];
  private delayInMilliseconds = 1000;
  public static pushedCount = 0;
  public static isPushedDone = false;

  constructor({ chunkData = [], delayInMilliseconds = 1000 }: IVirtualDataStreamOption) {
    super({ objectMode: true });

    this.chunkData = chunkData;
    this.delayInMilliseconds = delayInMilliseconds;
  }

  async pushData() {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const chunk of this.chunkData) {
      VirtualDataStream.pushedCount++;
      if (this.chunkData.length === VirtualDataStream.pushedCount) {
        VirtualDataStream.isPushedDone = true;
      }
      // push to stream
      this.push(chunk);
      await delay(this.delayInMilliseconds);
    }
  }

  endPush() {
    this.push(null);
  }

  _read() {}
}
