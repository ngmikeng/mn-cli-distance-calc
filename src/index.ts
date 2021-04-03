import {Command} from '@oclif/command';
import {main} from './main';

class MnCliDistanceCalc extends Command {
  async run() {
    main().catch(error => console.log(error.stack));

  }
}

export = MnCliDistanceCalc
