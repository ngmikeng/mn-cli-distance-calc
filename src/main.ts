import cli from 'cli-ux';
import ProcessFile from './utils/processFile';
import ProcessData from './utils/processData';
import { VirtualDataStream } from './utils/dataStream';
import { DistanceCalculator } from './utils/distance';
import { MAX_ELEMENTS, DEFAULT_ORIGIN_ADDR, DEFAULT_DEST_CITY } from './constant';
import { IDataRow } from './model';

interface ICalcDistChunks { chunkData: IDataRow[], distanceCalcInstance: DistanceCalculator, fromAddr: string }

async function calcDistanceChunks({ chunkData, distanceCalcInstance, fromAddr }: ICalcDistChunks) {
  try {
    const toAddrs = chunkData.map<string>(item => item.destAddr || 'UNKNOW');
    const distanceResult = await distanceCalcInstance.simpleDistance({
      fromAddr,
      toAddrs
    });
    const destAddrs = distanceResult.destination_addresses;
    const originAddr = distanceResult.origin_addresses[0];
    const distElements = distanceResult.rows[0].elements;
    // write new file csv
    const chunkNewData = chunkData.map((item, index) => {
      let ggDistance = 'UNKNOWN', ggDuration = 'UNKNOWN';
      if (distElements[index] && distElements[index].status === 'OK') {
        ggDistance = distElements[index].distance.text;
        ggDuration = distElements[index].duration.text
      }
      return {
        ...item,
        ggOriginAddr: originAddr,
        ggDestAddr: destAddrs[index],
        ggDistance,
        ggDuration
      };
    });
    return chunkNewData;
  } catch (err) {
    throw err;
  }
}

export const main = async () => {
  return new Promise(async (resolve, reject) => {
    const inApiKey = await cli.prompt(`Input the Google API Key`, { type: 'hide', required: true });
    const inFilePath = await cli.prompt(`Input the path of the file CSV`, { required: true });
    const inCityName = await cli.prompt(`Input the name of destination city`, { default: DEFAULT_DEST_CITY, });
    const inOriginAddress = await cli.prompt(`Input the origin address`, { default: DEFAULT_ORIGIN_ADDR });
    const distanceCalc = new DistanceCalculator({ apiKey: inApiKey });
    const processFile = new ProcessFile({ filePath: inFilePath });
    const data = await processFile.readFilePromise();
    // map destination address
    const newData: IDataRow[] = data.map(item => {
      return {...item, destAddr: `${item.wardName}, ${item.districtName}, ${inCityName}`}
    });

    const simpleBar = cli.progress({
      format: 'API Progress | {bar} | {percentage}% | {value}/{total} Chunks',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    // process chunk data
    const processData = new ProcessData({ inputData: newData });
    const chunkData = processData.processToChunks({ maxChunk: MAX_ELEMENTS });
    const virtualDataStream = new VirtualDataStream({ chunkData });
    virtualDataStream.pushData();
    simpleBar.start(chunkData.length, 0);
    let chunkCount = 0;
    let outData: IDataRow[] = [];
    virtualDataStream.on('data', async (chunk) => {
      try {
        const chunkDataCalculated = await calcDistanceChunks({ distanceCalcInstance: distanceCalc, chunkData: chunk, fromAddr: inOriginAddress });
        outData = outData.concat(chunkDataCalculated);
        chunkCount++;
        simpleBar.update(chunkCount);
        const isPushedDone = virtualDataStream.checkIsPushDone();
        if (isPushedDone) {
          virtualDataStream.done();
        }
      } catch (error) {
        virtualDataStream.destroy();
        reject(error);
      }
    });
    virtualDataStream.on('end', async () => {
      simpleBar.stop();
      if (!outData.length) {
        console.log('Out data is empty');
        resolve(outData);
      }
      // handle write file
      try {
        console.log('Out data item: ', outData[0]);
        const header = Object.keys(outData[0]).map(value => {
          return { id: value, title: value }
        });
        await processFile.writeFileAsync(header, outData);
        resolve(outData);
      } catch (error) {
        reject(error);
      }
    });
  })
};
