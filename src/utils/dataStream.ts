import { Readable } from "stream";
import { IDataRow } from "../model";

interface IVirtualDataStreamOption {
  chunkData: IDataRow[][],
  delayInMilliseconds?: number
}

export class VirtualDataStream extends Readable {
  private chunkData: IDataRow[][] = [];
  private delayInMilliseconds = 1000;
  private pushDone = false;

  constructor({ chunkData = [], delayInMilliseconds = 1000 }: IVirtualDataStreamOption) {
    super({ objectMode: true });

    this.chunkData = chunkData;
    this.delayInMilliseconds = delayInMilliseconds;
  }

  async pushData() {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const chunk of this.chunkData) {
      // push to stream
      this.push(chunk);
      await delay(this.delayInMilliseconds);
    }
    this.pushDone = true;
  }

  checkIsPushDone() {
    return this.pushDone;
  }

  done() {
    this.push(null);
  }

  _read() {}
}
