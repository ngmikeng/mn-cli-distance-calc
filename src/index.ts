import {Command} from '@oclif/command';
import {main} from './main';

class MnCliDistanceCalc extends Command {
  async run() {
    main().then(() => {
      console.log('\nDONE');
      process.exit(1);
    }).catch(error => {
      console.log('\n\nERROR:', error.stack);
      process.exit(1);
    });
  }
}

export = MnCliDistanceCalc
